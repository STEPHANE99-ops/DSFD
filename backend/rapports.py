from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import supabase
from datetime import datetime
import os
from generateur_rapport import generer_rapport_global_bytes

router = APIRouter(prefix="/rapports", tags=["Rapports"])

BUCKET_NAME = "rapports"


class RapportModel(BaseModel):
    mission_id:   int
    type_rapport: str = "global"
    format:       str = "docx"
    langue:       str = "fr"


# ── FIX : récupération du suivi des recommandations de la mission
#          précédente (même SFD), absente jusqu'ici. Sans cette
#          fonction, mission_data['suivi_recommandations'] n'était
#          jamais renseigné et la Table 10 du rapport (section 4 —
#          « Suivi de la mise en œuvre des recommandations de la
#          précédente mission ») restait systématiquement vide,
#          même quand des recommandations existaient en base. ──
def _recuperer_suivi_recommandations(sfd: str, mission_id_courante: int, date_mission_courante: str):
    """
    Retrouve la mission précédente pour le même SFD (la plus récente
    avant la mission courante) et renvoie ses recommandations, au
    format attendu par _table10() de generateur_rapport.py
    (clés : description, responsable, delai, statut).
    """
    if not sfd or not date_mission_courante:
        return []

    try:
        prec_res = (
            supabase.table("missions")
            .select("id, date_mission")
            .eq("sfd", sfd)
            .lt("date_mission", date_mission_courante)
            .neq("id", mission_id_courante)
            .order("date_mission", desc=True)
            .limit(1)
            .execute()
        )
        if not prec_res.data:
            return []

        mission_precedente_id = prec_res.data[0]["id"]

        recos_res = (
            supabase.table("recommandations")
            .select("*")
            .eq("mission_id", mission_precedente_id)
            .execute()
        )
        return recos_res.data or []
    except Exception as e:
        print(f"⚠️ Erreur récupération suivi recommandations : {e}")
        return []


@router.get("/")
def liste_rapports():
    res = (
        supabase.table("rapports")
        .select("*, missions(sfd)")
        .order("date_generation", desc=True)
        .execute()
    )
    rapports = []
    for r in res.data:
        mission = r.pop("missions", {}) or {}
        r["mission_sfd"] = mission.get("sfd")
        rapports.append(r)
    return {"rapports": rapports}


@router.post("/", status_code=201)
def generer_rapport(data: RapportModel):
    # 1. Récupérer la mission
    mission_res = (
        supabase.table("missions")
        .select("*")
        .eq("id", data.mission_id)
        .execute()
    )
    if not mission_res.data:
        raise HTTPException(404, "Mission introuvable")

    mission   = mission_res.data[0]

    # FIX : le type de rapport demandé doit correspondre au type de contrôle
    # de la mission (une mission "Contrôle global" ne peut produire qu'un
    # rapport global, une mission CAMELI qu'un rapport CAMELI, etc.)
    type_mission = mission.get("type_controle") or "global"
    type_demande = data.type_rapport or "global"
    if type_demande != type_mission:
        labels = {
            "global": "Mission globale", "suivi": "Suivi recommandations",
            "lbcft": "LBC/FT/FP", "cameli": "Rapport CAMELI",
        }
        raise HTTPException(
            400,
            f"Type de rapport incompatible : cette mission est de type "
            f"« {labels.get(type_mission, type_mission)} ». "
            f"Seul ce type de rapport peut être généré pour cette mission."
        )

    reference = f"RAP-{datetime.now().strftime('%Y%m%d-%H%M%S')}"

    # 2. Récupérer tous les volets validés de la mission
    volets_res = (
        supabase.table("donnees_volets")
        .select("*")
        .eq("mission_id", data.mission_id)
        .eq("est_valide", True)
        .execute()
    )
    volets_data = volets_res.data or []

    # 3. Générer le fichier en mémoire
    template_path = "CANEVAS_RAPPORT_DE_MISSION_GLOBAL.docx"
    if not os.path.exists(template_path):
        raise HTTPException(500, f"Template introuvable : {template_path}")

    mission_data = dict(mission)
    mission_data["reference"] = reference

    # ── FIX : injection du suivi des recommandations de la mission
    #          précédente (même SFD) — voir _recuperer_suivi_recommandations
    #          ci-dessus. Sans cette ligne, Table 10 (section 4 du rapport)
    #          restait toujours vide.
    mission_data["suivi_recommandations"] = _recuperer_suivi_recommandations(
        sfd                    = mission.get("sfd"),
        mission_id_courante    = data.mission_id,
        date_mission_courante  = mission.get("date_mission"),
    )

    try:
        file_bytes = generer_rapport_global_bytes(mission_data, volets_data, template_path)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(500, f"Erreur génération : {str(e)}")

    # 4. Upload vers Supabase Storage
    filename = f"{reference}.{data.format}"
    try:
        supabase.storage.from_(BUCKET_NAME).upload(
            path         = filename,
            file         = file_bytes,
            file_options = {
                "content-type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            }
        )
    except Exception as e:
        raise HTTPException(500, f"Erreur upload Storage : {str(e)}")

    # 5. URL publique — construction manuelle (plus fiable que get_public_url)
    SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://bgwhzvhaupfylrfbgggj.supabase.co")
    file_url = f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET_NAME}/{filename}"

    # 6. Sauvegarder en base
    supabase.table("rapports").insert({
        "reference":    reference,
        "mission_id":   data.mission_id,
        "type_rapport": data.type_rapport,
        "format":       data.format,
        "fichier_url":  file_url,
    }).execute()

    return {
        "message": "✅ Rapport généré avec succès !",
        "rapport": {
            "reference":    reference,
            "mission_sfd":  mission.get("sfd"),
            "type_rapport": data.type_rapport,
            "format":       data.format,
            "url":          file_url,
            "nb_volets":    len(volets_data),
        }
    }


@router.delete("/{id}")
def supprimer_rapport(id: int):
    existing = (
        supabase.table("rapports")
        .select("reference, format")
        .eq("id", id)
        .execute()
    )
    if not existing.data:
        raise HTTPException(404, "Rapport introuvable")

    r        = existing.data[0]
    filename = f"{r['reference']}.{r['format']}"
    try:
        supabase.storage.from_(BUCKET_NAME).remove([filename])
    except Exception:
        pass

    supabase.table("rapports").delete().eq("id", id).execute()
    return {"message": "✅ Rapport supprimé."}