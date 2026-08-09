from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from database import supabase
from typing import Optional
from datetime import datetime, timezone
import json

router = APIRouter(prefix="/volets", tags=["Volets"])


class VoletModel(BaseModel):
    mission_id:  int
    volet_code:  str
    volet_index: Optional[str] = None
    volet_nom:   Optional[str] = None
    data:        dict = {}
    est_valide:  Optional[bool] = False
    # FIX : email de l'utilisateur qui enregistre, envoyé par le frontend
    # (depuis localStorage.utilisateur). Alimente le journal d'activité
    # de l'interface d'administration (jours/heures de remplissage).
    modifie_par: Optional[str] = None


class VoletUpdateModel(BaseModel):
    data:        Optional[dict] = None
    est_valide:  Optional[bool] = None
    modifie_par: Optional[str]  = None


# ── GET tous les volets d'une mission ─────
@router.get("/")
def liste_volets(mission_id: int):
    res = (
        supabase.table("donnees_volets")
        .select("*")
        .eq("mission_id", mission_id)
        .order("volet_index")
        .execute()
    )
    return {"total": len(res.data), "volets": res.data}


# ── GET un volet ──────────────────────────
@router.get("/{id}")
def get_volet(id: int):
    res = (
        supabase.table("donnees_volets")
        .select("*")
        .eq("id", id)
        .execute()
    )
    if not res.data:
        raise HTTPException(404, f"Volet #{id} introuvable.")
    return res.data[0]


# ── GET volet par mission + code ──────────
@router.get("/mission/{mission_id}/{volet_code}")
def get_volet_by_code(mission_id: int, volet_code: str):
    res = (
        supabase.table("donnees_volets")
        .select("*")
        .eq("mission_id", mission_id)
        .eq("volet_code", volet_code)
        .execute()
    )
    if not res.data:
        return {"data": None}
    return res.data[0]


# ── POST créer ou mettre à jour un volet ──
@router.post("/", status_code=201)
def sauvegarder_volet(data: VoletModel):
    # Vérifier que la mission existe
    mission = (
        supabase.table("missions")
        .select("id")
        .eq("id", data.mission_id)
        .execute()
    )
    if not mission.data:
        raise HTTPException(404, "Mission introuvable.")

    # Vérifier si le volet existe déjà (upsert manuel)
    existing = (
        supabase.table("donnees_volets")
        .select("id")
        .eq("mission_id", data.mission_id)
        .eq("volet_code", data.volet_code)
        .execute()
    )

    volet_data = {
        "mission_id":            data.mission_id,
        "volet_code":            data.volet_code,
        "volet_index":           data.volet_index,
        "volet_nom":             data.volet_nom,
        "data":                  data.data,
        "est_valide":            data.est_valide,
        # FIX : horodatage serveur (fiable, non manipulable côté client)
        # + auteur, pour le journal d'activité de l'administration.
        "derniere_modification": datetime.now(timezone.utc).isoformat(),
        "modifie_par":           data.modifie_par,
    }

    if existing.data:
        # Mise à jour
        res = (
            supabase.table("donnees_volets")
            .update(volet_data)
            .eq("id", existing.data[0]["id"])
            .execute()
        )
    else:
        # Création
        res = (
            supabase.table("donnees_volets")
            .insert(volet_data)
            .execute()
        )

    return {
        "message": f"✅ Volet '{data.volet_code}' sauvegardé !",
        "volet":   res.data[0]
    }


# ── PUT modifier un volet ─────────────────
@router.put("/{id}")
def modifier_volet(id: int, update: VoletUpdateModel):
    existing = (
        supabase.table("donnees_volets")
        .select("id")
        .eq("id", id)
        .execute()
    )
    if not existing.data:
        raise HTTPException(404, f"Volet #{id} introuvable.")

    champs = {}
    if update.data        is not None: champs["data"]                  = update.data
    if update.est_valide  is not None: champs["est_valide"]             = update.est_valide
    if update.modifie_par is not None: champs["modifie_par"]            = update.modifie_par

    if not champs:
        raise HTTPException(400, "Aucun champ à modifier.")

    # FIX : toute modification (même partielle) réhorodate le volet.
    champs["derniere_modification"] = datetime.now(timezone.utc).isoformat()

    res = (
        supabase.table("donnees_volets")
        .update(champs)
        .eq("id", id)
        .execute()
    )
    return {"message": "✅ Volet mis à jour !", "volet": res.data[0]}


# ── GET journal d'activité (interface d'administration) ──
# FIX : liste chronologique des sauvegardes de volets, tous inspecteurs et
# missions confondus — jours et heures de remplissage, tel que demandé par
# la directrice pour le suivi du travail. Réservé au rôle "directeur".
@router.get("/admin/activite")
def journal_activite(limite: int = 200, authorization: str = Header(None)):
    from utilisateurs import _exiger_directeur
    _exiger_directeur(authorization)

    # FIX : select("*") plutôt qu'une liste de colonnes explicite, et
    # assemblage manuel avec les missions plutôt qu'une jointure imbriquée
    # PostgREST (missions(...)) — cette dernière dépend d'une relation de
    # clé étrangère correctement déclarée côté Supabase, et une colonne
    # absente ou une relation non reconnue faisait échouer toute la
    # requête. Le tri et la limite se font ici, en Python, pour ne pas
    # dépendre non plus d'une colonne de tri potentiellement absente.
    res = supabase.table("donnees_volets").select("*").execute()

    lignes = [v for v in (res.data or []) if v.get("derniere_modification")]
    lignes.sort(key=lambda v: v["derniere_modification"], reverse=True)
    lignes = lignes[:limite]

    mission_ids = list({v.get("mission_id") for v in lignes if v.get("mission_id") is not None})
    missions_par_id = {}
    if mission_ids:
        res_missions = supabase.table("missions").select("*").in_("id", mission_ids).execute()
        for m in (res_missions.data or []):
            missions_par_id[m["id"]] = m

    activite = []
    for v in lignes:
        m = missions_par_id.get(v.get("mission_id"))
        activite.append({
            **v,
            "missions": {
                "sfd":          m.get("sfd") if m else None,
                "reference":    m.get("reference") if m else None,
                "chef_mission": m.get("chef_mission") if m else None,
            } if m else None,
        })

    return {"total": len(activite), "activite": activite}


# ── DELETE supprimer un volet ─────────────
@router.delete("/{id}")
def supprimer_volet(id: int):
    existing = (
        supabase.table("donnees_volets")
        .select("id, volet_code")
        .eq("id", id)
        .execute()
    )
    if not existing.data:
        raise HTTPException(404, f"Volet #{id} introuvable.")

    supabase.table("donnees_volets").delete().eq("id", id).execute()
    return {"message": "✅ Volet supprimé."}