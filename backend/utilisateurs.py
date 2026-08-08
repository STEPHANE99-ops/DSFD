# utilisateurs.py
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel, EmailStr, field_validator
from passlib.context import CryptContext
from database import supabase
from typing import Optional
import secrets
import os
import jwt
from datetime import datetime, timedelta, timezone

router = APIRouter(tags=["Utilisateurs"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Tokens reset en mémoire (simple pour commencer)
reset_tokens = {}

# ── Rôles applicatifs autorisés ──
ROLES_VALIDES = ["inspecteur", "chef_mission"]

# ══ AUTHENTIFICATION — JWT ═══════════════════════════════
# FIX : mise en place d'un vrai système de session par token signé.
# Le token n'est PAS stocké en base : un JWT est auto-vérifiable grâce
# à sa signature (SECRET_KEY) et à sa date d'expiration intégrée (exp).
# Aucune table supplémentaire n'est donc nécessaire pour les sessions.

SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "")
if not SECRET_KEY:
    raise RuntimeError(
        "JWT_SECRET_KEY n'est pas configurée dans les variables d'environnement. "
        "Générez-en une avec : python -c \"import secrets; print(secrets.token_hex(32))\""
    )
ALGORITHM = "HS256"
DUREE_SESSION_HEURES = 24 * 7  # 7 jours


def creer_token_session(utilisateur: dict) -> str:
    """Token de session normal, émis à la connexion ou après vérification
    d'un lien d'accès mission (voir missions.py)."""
    payload = {
        "sub":     str(utilisateur["id"]),
        "email":   utilisateur["email"],
        "role":    utilisateur.get("role") or "inspecteur",
        "nom":     utilisateur["nom"],
        "prenoms": utilisateur["prenoms"],
        "type":    "session",
        "iat":     datetime.now(timezone.utc),
        "exp":     datetime.now(timezone.utc) + timedelta(hours=DUREE_SESSION_HEURES),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decoder_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Session expirée, veuillez vous reconnecter.")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Session invalide, veuillez vous reconnecter.")


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
    telephone:    Optional[str]      = None
    fonction:     Optional[str]      = None
    structure:    Optional[str]      = None
    photo:        Optional[str]      = None   # data URL (image redimensionnée côté client)

    @field_validator("role")
    @classmethod
    def role_valide(cls, v):
        if v is not None and v not in ROLES_VALIDES:
            raise ValueError(f"Rôle invalide. Valeurs autorisées : {ROLES_VALIDES}")
        return v


class ChangementMotDePasseModel(BaseModel):
    mot_de_passe_actuel:  str
    nouveau_mot_de_passe: str

    @field_validator("nouveau_mot_de_passe")
    @classmethod
    def mdp_min_8(cls, v):
        if len(v) < 8:
            raise ValueError("Minimum 8 caractères.")
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

    utilisateur_public = {
        "id":      u["id"],
        "nom":     u["nom"],
        "prenoms": u["prenoms"],
        "role":    u.get("role") or "inspecteur",
        "email":   u["email"]
    }

    # FIX : on émet désormais un token de session JWT en plus des infos
    # utilisateur. Le frontend doit le stocker et l'envoyer avec chaque
    # requête protégée (Authorization: Bearer <token>).
    return {
        "message":     "✅ Connexion réussie !",
        "utilisateur": utilisateur_public,
        "token":       creer_token_session(utilisateur_public)
    }


# ── Vérifier / rafraîchir la session courante ─────────────
# FIX : route appelée par requireAuth() sur chaque page protégée.
# Elle revalide le token ET va rechercher le rôle/nom/prénoms à jour
# en base, pour ne jamais servir une information périmée depuis le
# localStorage (cas du rôle affiché "Utilisateur" au lieu du vrai rôle).
@router.get("/auth/me")
def utilisateur_courant(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Authentification requise.")

    token = authorization.split(" ", 1)[1]
    payload = decoder_token(token)

    if payload.get("type") != "session":
        raise HTTPException(401, "Token invalide pour cette opération.")

    res = (
        supabase.table("utilisateurs")
        .select("*")
        .eq("id", int(payload["sub"]))
        .execute()
    )
    if not res.data:
        raise HTTPException(404, "Utilisateur introuvable.")

    u = res.data[0]
    return {"utilisateur": {
        "id":        u["id"],
        "nom":       u["nom"],
        "prenoms":   u["prenoms"],
        "role":      u.get("role") or "inspecteur",
        "email":     u["email"],
        # Champs profil optionnels (None si colonnes absentes)
        "telephone": u.get("telephone"),
        "fonction":  u.get("fonction"),
        "structure": u.get("structure"),
        "photo":     u.get("photo"),
    }}


# ── Changer son mot de passe (sécurisé) ───────────────────
@router.post("/auth/changer-mot-de-passe")
def changer_mot_de_passe(data: ChangementMotDePasseModel,
                         authorization: str = Header(None)):
    """FIX : route dédiée au changement de mot de passe depuis la page
    Profil. Contrairement au PUT /utilisateurs/{id}, elle exige un token
    de session valide ET vérifie le mot de passe actuel avant de changer."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Authentification requise.")

    token   = authorization.split(" ", 1)[1]
    payload = decoder_token(token)
    if payload.get("type") != "session":
        raise HTTPException(401, "Token invalide pour cette opération.")

    res = (
        supabase.table("utilisateurs")
        .select("id, mot_de_passe")
        .eq("id", int(payload["sub"]))
        .execute()
    )
    if not res.data:
        raise HTTPException(404, "Utilisateur introuvable.")

    u = res.data[0]
    if not pwd_context.verify(data.mot_de_passe_actuel, u["mot_de_passe"]):
        raise HTTPException(401, "Le mot de passe actuel est incorrect.")

    supabase.table("utilisateurs").update({
        "mot_de_passe": pwd_context.hash(data.nouveau_mot_de_passe)
    }).eq("id", u["id"]).execute()

    return {"message": "✅ Mot de passe modifié avec succès."}


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
    if data.telephone:    champs["telephone"]     = data.telephone
    if data.fonction:     champs["fonction"]      = data.fonction
    if data.structure:    champs["structure"]     = data.structure
    if data.photo:        champs["photo"]         = data.photo

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