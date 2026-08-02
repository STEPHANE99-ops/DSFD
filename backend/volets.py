from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import supabase
from typing import Optional
import json

router = APIRouter(prefix="/volets", tags=["Volets"])


class VoletModel(BaseModel):
    mission_id:  int
    volet_code:  str
    volet_index: Optional[str] = None
    volet_nom:   Optional[str] = None
    data:        dict = {}
    est_valide:  Optional[bool] = False


class VoletUpdateModel(BaseModel):
    data:       Optional[dict] = None
    est_valide: Optional[bool] = None


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
        "mission_id":  data.mission_id,
        "volet_code":  data.volet_code,
        "volet_index": data.volet_index,
        "volet_nom":   data.volet_nom,
        "data":        data.data,
        "est_valide":  data.est_valide,
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
    if update.data       is not None: champs["data"]       = update.data
    if update.est_valide is not None: champs["est_valide"] = update.est_valide

    if not champs:
        raise HTTPException(400, "Aucun champ à modifier.")

    res = (
        supabase.table("donnees_volets")
        .update(champs)
        .eq("id", id)
        .execute()
    )
    return {"message": "✅ Volet mis à jour !", "volet": res.data[0]}


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