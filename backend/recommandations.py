from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, field_validator
from database import supabase
from typing import Optional
from datetime import date

router = APIRouter(prefix="/recommandations", tags=["Recommandations"])


# ══ MODÈLES ══════════════════════════════════════════════

class RecommandationModel(BaseModel):
    mission_id:  int
    description: str
    responsable: Optional[str] = None
    delai:       Optional[date] = None
    statut:      str = "En attente"

    @field_validator("description")
    @classmethod
    def description_valide(cls, v):
        if not v.strip():
            raise ValueError("La description ne peut pas être vide.")
        return v.strip()

    @field_validator("statut")
    @classmethod
    def statut_valide(cls, v):
        if v not in ["Appliquée", "En cours", "Non respectée", "En attente"]:
            raise ValueError("Statut invalide.")
        return v


class RecommandationUpdateModel(BaseModel):
    description: Optional[str]  = None
    responsable: Optional[str]  = None
    delai:       Optional[date] = None
    statut:      Optional[str]  = None


# ══ ROUTES ═══════════════════════════════════════════════

@router.get("/")
def liste_recommandations():
    res = (
        supabase.table("recommandations")
        .select("*, missions(sfd, reference, fichier_url)")
        .order("date_creation", desc=True)
        .execute()
    )

    recos = []
    for r in res.data:
        mission = r.pop("missions", {}) or {}
        r["mission_sfd"]       = mission.get("sfd")
        r["mission_reference"] = mission.get("reference")
        r["fichier_url"]       = mission.get("fichier_url")
        recos.append(r)

    # Statistiques
    total          = len(recos)
    appliquees     = sum(1 for r in recos if r["statut"] == "Appliquée")
    en_cours       = sum(1 for r in recos if r["statut"] == "En cours")
    non_respectees = sum(1 for r in recos if r["statut"] == "Non respectée")

    return {
        "total":           total,
        "appliquees":      appliquees,
        "en_cours":        en_cours,
        "non_respectees":  non_respectees,
        "recommandations": recos
    }


@router.get("/{id}")
def get_recommandation(id: int):
    res = (
        supabase.table("recommandations")
        .select("*")
        .eq("id", id)
        .execute()
    )
    if not res.data:
        raise HTTPException(404, "Recommandation introuvable.")
    return res.data[0]


@router.post("/", status_code=201)
def creer_recommandation(data: RecommandationModel):
    # Vérifie que la mission existe
    mission = (
        supabase.table("missions")
        .select("id")
        .eq("id", data.mission_id)
        .execute()
    )
    if not mission.data:
        raise HTTPException(404, f"Mission #{data.mission_id} introuvable.")

    res = (
        supabase.table("recommandations")
        .insert({
            "mission_id":  data.mission_id,
            "description": data.description,
            "responsable": data.responsable,
            "delai":       str(data.delai) if data.delai else None,
            "statut":      data.statut
        })
        .execute()
    )
    return {
        "message":        "✅ Recommandation créée !",
        "recommandation": res.data[0]
    }


@router.put("/{id}")
def modifier_recommandation(id: int, data: RecommandationUpdateModel):
    existing = (
        supabase.table("recommandations")
        .select("id")
        .eq("id", id)
        .execute()
    )
    if not existing.data:
        raise HTTPException(404, "Recommandation introuvable.")

    champs = {}
    if data.description is not None: champs["description"] = data.description
    if data.responsable is not None: champs["responsable"] = data.responsable
    if data.delai       is not None: champs["delai"]       = str(data.delai)
    if data.statut      is not None: champs["statut"]      = data.statut

    if not champs:
        raise HTTPException(400, "Aucun champ à modifier.")

    res = (
        supabase.table("recommandations")
        .update(champs)
        .eq("id", id)
        .execute()
    )
    return {"message": "✅ Recommandation modifiée !", "recommandation": res.data[0]}


@router.delete("/{id}")
def supprimer_recommandation(id: int):
    res = (
        supabase.table("recommandations")
        .delete()
        .eq("id", id)
        .execute()
    )
    if not res.data:
        raise HTTPException(404, "Recommandation introuvable.")
    return {"message": "✅ Recommandation supprimée."}