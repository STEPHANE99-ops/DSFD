# utilisateurs.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr, field_validator
from passlib.context import CryptContext
from database import supabase
from typing import Optional
import secrets

router = APIRouter(tags=["Utilisateurs"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Tokens reset en mémoire (simple pour commencer)
reset_tokens = {}

# ── Rôles applicatifs autorisés ──
ROLES_VALIDES = ["inspecteur", "chef_mission"]

# ══ MODÈLES ══════════════════════════════════════════════

class InscriptionModel(BaseModel):
    nom:          str
    prenoms:      str
    role:         str  # "inspecteur" ou "chef_mission" — champ obligatoire
    email:        EmailStr
    mot_de_passe: str

    @field_validator("nom", "prenoms")
    @classmethod
    def pas_vide(cls, v):
        if not v.strip():
            raise ValueError("Ce champ ne peut pas être vide.")
        return v.strip()

    @field_validator("role")
    @classmethod
    def role_valide(cls, v):
        if v not in ROLES_VALIDES:
            raise ValueError(f"Rôle invalide. Valeurs autorisées : {ROLES_VALIDES}")
        return v

    @field_validator("mot_de_passe")
    @classmethod
    def mdp_min_8(cls, v):
        if len(v) < 8:
            raise ValueError("Minimum 8 caractères.")
        return v

class ConnexionModel(BaseModel):
    email:        EmailStr
    mot_de_passe: str

class ModificationModel(BaseModel):
    nom:          Optional[str]      = None
    prenoms:      Optional[str]      = None
    role:         Optional[str]      = None
    email:        Optional[EmailStr] = None
    mot_de_passe: Optional[str]      = None

    @field_validator("role")
    @classmethod
    def role_valide(cls, v):
        if v is not None and v not in ROLES_VALIDES:
            raise ValueError(f"Rôle invalide. Valeurs autorisées : {ROLES_VALIDES}")
        return v


# ══ ROUTES ═══════════════════════════════════════════════

# ── Inscription ───────────────────────────────────────────
@router.post("/inscription", status_code=201)
def inscription(data: InscriptionModel):

    existing = (
        supabase.table("utilisateurs")
        .select("id")
        .eq("email", data.email)
        .execute()
    )
    if existing.data:
        raise HTTPException(400, f"L'email '{data.email}' est déjà utilisé.")

    mdp_hache = pwd_context.hash(data.mot_de_passe)

    res = (
        supabase.table("utilisateurs")
        .insert({
            "nom":          data.nom,
            "prenoms":      data.prenoms,
            "role":         data.role,
            "email":        data.email,
            "mot_de_passe": mdp_hache
        })
        .execute()
    )

    u = res.data[0]
    return {
        "message":     "✅ Inscription réussie !",
        "utilisateur": {
            "id":      u["id"],
            "nom":     u["nom"],
            "prenoms": u["prenoms"],
            "role":    u["role"],
            "email":   u["email"]
        }
    }


# ── Connexion ─────────────────────────────────────────────
@router.post("/connexion")
def connexion(data: ConnexionModel):

    res = (
        supabase.table("utilisateurs")
        .select("*")
        .eq("email", data.email)
        .execute()
    )

    if not res.data:
        raise HTTPException(401, "Email ou mot de passe incorrect.")

    u = res.data[0]

    if not pwd_context.verify(data.mot_de_passe, u["mot_de_passe"]):
        raise HTTPException(401, "Email ou mot de passe incorrect.")

    return {
        "message": "✅ Connexion réussie !",
        "utilisateur": {
            "id":      u["id"],
            "nom":     u["nom"],
            "prenoms": u["prenoms"],
            "role":    u.get("role") or "inspecteur",
            "email":   u["email"]
        }
    }


# ── Liste utilisateurs ────────────────────────────────────
@router.get("/utilisateurs")
def liste_utilisateurs():
    res = (
        supabase.table("utilisateurs")
        .select("id, nom, prenoms, role, email")
        .order("id")
        .execute()
    )
    return {"total": len(res.data), "utilisateurs": res.data}


# ── Un utilisateur ────────────────────────────────────────
@router.get("/utilisateurs/{id}")
def get_utilisateur(id: int):
    res = (
        supabase.table("utilisateurs")
        .select("id, nom, prenoms, role, email")
        .eq("id", id)
        .execute()
    )
    if not res.data:
        raise HTTPException(404, f"Utilisateur #{id} introuvable.")
    return res.data[0]


# ── Modifier utilisateur ──────────────────────────────────
@router.put("/utilisateurs/{id}")
def modifier_utilisateur(id: int, data: ModificationModel):

    existing = (
        supabase.table("utilisateurs")
        .select("id")
        .eq("id", id)
        .execute()
    )
    if not existing.data:
        raise HTTPException(404, f"Utilisateur #{id} introuvable.")

    champs = {}
    if data.nom:          champs["nom"]          = data.nom
    if data.prenoms:      champs["prenoms"]       = data.prenoms
    if data.role:         champs["role"]          = data.role
    if data.email:        champs["email"]         = data.email
    if data.mot_de_passe: champs["mot_de_passe"]  = pwd_context.hash(data.mot_de_passe)

    if not champs:
        raise HTTPException(400, "Aucun champ à modifier.")

    res = (
        supabase.table("utilisateurs")
        .update(champs)
        .eq("id", id)
        .execute()
    )
    return {"message": "✅ Modifié !", "utilisateur": res.data[0]}


# ── Supprimer utilisateur ─────────────────────────────────
@router.delete("/utilisateurs/{id}")
def supprimer_utilisateur(id: int):
    res = (
        supabase.table("utilisateurs")
        .delete()
        .eq("id", id)
        .execute()
    )
    if not res.data:
        raise HTTPException(404, f"Utilisateur #{id} introuvable.")
    u = res.data[0]
    return {"message": f"✅ {u['nom']} {u['prenoms']} supprimé."}