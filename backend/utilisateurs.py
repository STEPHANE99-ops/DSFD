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

# ── FIX : approbation des inscriptions ──
# Statuts possibles pour la colonne `statut_compte` : "en_attente" (par défaut
# pour toute nouvelle inscription, bloque la connexion), "approuve" (accès
# normal), "rejete" (connexion bloquée, compte conservé pour trace).
# Les comptes déjà existants avant ce système restent "approuve" : c'est la
# valeur par défaut de la colonne côté base (DEFAULT 'approuve'), donc aucune
# migration de données n'est nécessaire.
STATUT_EN_ATTENTE = "en_attente"
STATUT_APPROUVE   = "approuve"
STATUT_REJETE     = "rejete"
# FIX : compte créé par invitation (ex. bootstrap directeur), en attente
# que la personne choisisse elle-même son mot de passe via le lien reçu
# par email. Ne peut pas se connecter tant que ce n'est pas fait.
STATUT_INVITE     = "invite"

# ── FIX : bootstrap du/des compte(s) directeur — sans jamais toucher à
# la base de données à la main. La liste des emails autorisés à devenir
# directeur vit UNIQUEMENT dans les variables d'environnement (Render),
# jamais dans une table. Dès qu'un compte portant un de ces emails se
# connecte (qu'il vienne de s'inscrire normalement ou existe déjà), il
# est automatiquement promu "directeur" et approuvé — voir connexion().
# Exemple de valeur sur Render : EMAILS_DIRECTEURS=directrice@dsfd.ci
EMAILS_DIRECTEURS = [
    e.strip().lower()
    for e in os.environ.get("EMAILS_DIRECTEURS", "").split(",")
    if e.strip()
]

# ── Rôles applicatifs autorisés ──
ROLES_VALIDES = ["inspecteur", "chef_mission"]
# FIX : rôle réservé à l'interface d'administration (directrice). Volontairement
# absent de ROLES_VALIDES (qui gouverne le validateur du formulaire d'inscription
# public) : un compte directeur ne se crée pas par auto-inscription, seulement en
# base ou par promotion d'un compte existant depuis l'interface d'administration.
ROLE_DIRECTEUR = "directeur"

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


def _exiger_directeur(authorization: Optional[str]) -> dict:
    """FIX : garde d'accès pour les routes réservées à la directrice. Le rôle
    est lu directement dans le token (signé), donc pas de requête base
    supplémentaire pour vérifier les droits."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Authentification requise.")
    payload = decoder_token(authorization.split(" ", 1)[1])
    if payload.get("type") != "session":
        raise HTTPException(401, "Token invalide pour cette opération.")
    if payload.get("role") != ROLE_DIRECTEUR:
        raise HTTPException(403, "Accès réservé à l'administration.")
    return payload


def _creer_et_envoyer_invitation(nom: str, prenoms: str, email: str, role: str):
    """FIX : génère un token d'invitation signé (7 jours de validité) et
    envoie l'email contenant le lien pour définir le mot de passe. Import
    différé de missions.py pour éviter un import circulaire (missions.py
    importe déjà des symboles depuis ce module)."""
    from missions import _envoyer_email, FRONTEND_URL

    payload = {
        "email": email,
        "role":  role,
        "type":  "invitation",
        "iat":   datetime.now(timezone.utc),
        "exp":   datetime.now(timezone.utc) + timedelta(days=7),
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    lien  = f"{FRONTEND_URL}/definir-mot-de-passe.html?token={token}"

    try:
        _envoyer_email(
            destinataire = email,
            sujet        = "[DSFD] Activez votre compte administrateur",
            corps_html   = f"""
            <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto">
              <h2 style="color:#1A2233">Bonjour Madame,</h2>
              <p style="color:#475569;font-size:14px;line-height:1.6">
                Un compte administrateur a été créé pour vous sur la plateforme DSFD.
                Cliquez sur le bouton ci-dessous pour choisir votre mot de passe et
                accéder à votre interface.
              </p>
              <a href="{lien}"
                 style="display:inline-block;margin-top:16px;background:#F97316;color:#fff;
                        padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:700">
                Définir mon mot de passe →
              </a>
              <p style="color:#94A3B8;font-size:12px;margin-top:20px">
                Ce lien est valable 7 jours. Si vous n'êtes pas à l'origine de cette
                demande, vous pouvez ignorer cet email.
              </p>
            </div>
            """
        )
    except Exception as e:
        print(f"⚠️ Email d'invitation non envoyé à {email} : {e}")


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


class DefinirMotDePasseModel(BaseModel):
    """FIX : utilisé sur le lien reçu par email lors d'une invitation
    (bootstrap directeur ou futures invitations d'équipe)."""
    token:        str
    mot_de_passe: str

    @field_validator("mot_de_passe")
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
            "nom":           data.nom,
            "prenoms":       data.prenoms,
            "role":          data.role,
            "email":         data.email,
            "mot_de_passe":  mdp_hache,
            # FIX : toute nouvelle inscription doit être validée par la
            # directrice avant de pouvoir se connecter.
            "statut_compte": STATUT_EN_ATTENTE
        })
        .execute()
    )

    u = res.data[0]
    return {
        "message":     "✅ Inscription réussie ! Votre compte est en attente de validation par l'administration.",
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

    email_normalise = data.email.strip().lower()

    # FIX : bootstrap du compte directeur par invitation email — voir
    # EMAILS_DIRECTEURS. Si aucun compte n'existe encore pour un email de
    # cette liste, on le crée maintenant (mot de passe temporaire inutilisable,
    # personne ne peut deviner ni utiliser ce hash pour se connecter) et on
    # envoie le lien d'activation. La personne doit cliquer ce lien et choisir
    # elle-même son mot de passe — elle ne se connecte jamais avec un mot de
    # passe qu'elle n'a pas choisi.
    if not res.data and email_normalise in EMAILS_DIRECTEURS:
        creation = (
            supabase.table("utilisateurs")
            .insert({
                "nom":           "Direction",
                "prenoms":       "DSFD",
                "role":          ROLE_DIRECTEUR,
                "email":         email_normalise,
                "mot_de_passe":  pwd_context.hash(secrets.token_hex(32)),  # inutilisable
                "statut_compte": STATUT_INVITE,
            })
            .execute()
        )
        u = creation.data[0]
        _creer_et_envoyer_invitation(u["nom"], u["prenoms"], u["email"], ROLE_DIRECTEUR)
        raise HTTPException(
            403,
            "Un email vous a été envoyé pour activer votre compte et choisir "
            "votre mot de passe. Consultez votre boîte de réception."
        )

    if not res.data:
        raise HTTPException(401, "Email ou mot de passe incorrect.")

    u = res.data[0]

    # FIX : compte déjà créé (invité) mais mot de passe pas encore défini —
    # on renvoie un nouveau lien plutôt que d'échouer sur "mot de passe
    # incorrect" (le mot de passe stocké est de toute façon inutilisable).
    if u.get("statut_compte") == STATUT_INVITE:
        _creer_et_envoyer_invitation(u.get("nom"), u.get("prenoms"), u["email"], u.get("role") or ROLE_DIRECTEUR)
        raise HTTPException(
            403,
            "Votre compte n'est pas encore activé. Un nouveau lien pour "
            "définir votre mot de passe vient de vous être envoyé par email."
        )

    if not pwd_context.verify(data.mot_de_passe, u["mot_de_passe"]):
        raise HTTPException(401, "Email ou mot de passe incorrect.")

    # FIX : promotion automatique en "directeur" pour un compte QUI EXISTAIT
    # DÉJÀ avant son ajout à EMAILS_DIRECTEURS (ex. ancien compte chef_mission).
    # Placée APRÈS la vérification du mot de passe : seule la personne qui
    # connaît réellement ce mot de passe peut déclencher la promotion —
    # la présence de l'email dans la liste ne suffit pas à elle seule.
    if email_normalise in EMAILS_DIRECTEURS and (
        u.get("role") != ROLE_DIRECTEUR or u.get("statut_compte") != STATUT_APPROUVE
    ):
        maj = (
            supabase.table("utilisateurs")
            .update({"role": ROLE_DIRECTEUR, "statut_compte": STATUT_APPROUVE})
            .eq("id", u["id"])
            .execute()
        )
        u = maj.data[0]

    # FIX : blocage des comptes non encore approuvés par la directrice.
    # Les comptes créés avant ce système n'ont pas de statut_compte enregistré
    # (colonne absente ou valeur nulle) : on les traite alors comme "approuve"
    # pour ne rétroactivement bloquer personne.
    statut = u.get("statut_compte") or STATUT_APPROUVE
    if statut == STATUT_EN_ATTENTE:
        raise HTTPException(
            403,
            "Votre compte est en attente de validation par l'administration. "
            "Vous recevrez un accès dès son approbation."
        )
    if statut == STATUT_REJETE:
        raise HTTPException(
            403,
            "Votre demande d'inscription n'a pas été approuvée. "
            "Contactez l'administration pour plus d'informations."
        )

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
# ── Définir son mot de passe via un lien d'invitation ─────
# FIX : appelée depuis definir-mot-de-passe.html (lien reçu par email).
# Aucune authentification requise en entrée : c'est le token signé,
# valable 7 jours et à usage lié à un email précis, qui fait office de
# preuve d'identité pour cette seule opération.
@router.post("/utilisateurs/definir-mot-de-passe")
def definir_mot_de_passe(data: DefinirMotDePasseModel):
    try:
        payload = decoder_token(data.token)
    except HTTPException:
        raise HTTPException(400, "Ce lien est invalide ou a expiré. Demandez un nouveau lien en tentant de vous connecter avec votre email.")

    if payload.get("type") != "invitation":
        raise HTTPException(400, "Ce lien n'est pas valide pour cette opération.")

    res = supabase.table("utilisateurs").select("id, nom, prenoms, role, email, statut_compte").eq("email", payload["email"]).execute()
    if not res.data:
        raise HTTPException(404, "Compte introuvable.")

    u = res.data[0]
    if u.get("statut_compte") not in (STATUT_INVITE, STATUT_EN_ATTENTE):
        raise HTTPException(400, "Ce compte a déjà été activé. Connectez-vous normalement.")

    supabase.table("utilisateurs").update({
        "mot_de_passe":  pwd_context.hash(data.mot_de_passe),
        "statut_compte": STATUT_APPROUVE,
    }).eq("id", u["id"]).execute()

    # Connecte immédiatement la personne (évite une double étape) en lui
    # renvoyant un token de session valide, comme après une connexion normale.
    u["role"] = payload.get("role") or u.get("role")
    token_session = creer_token_session(u)

    return {
        "message":     "✅ Mot de passe défini. Vous êtes connecté(e).",
        "token":       token_session,
        "utilisateur": {
            "id":      u["id"],
            "nom":     u["nom"],
            "prenoms": u["prenoms"],
            "role":    u["role"],
            "email":   u["email"],
        }
    }


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


# ══ ADMINISTRATION (réservé au rôle "directeur") ══════════
# FIX : bloc de routes pour l'interface d'administration — approbation
# des inscriptions et suivi de l'activité (journal des volets remplis).

# ── Liste des comptes en attente d'approbation ────────────
@router.get("/utilisateurs/admin/en-attente")
def utilisateurs_en_attente(authorization: str = Header(None)):
    _exiger_directeur(authorization)
    res = (
        supabase.table("utilisateurs")
        .select("id, nom, prenoms, email, role, created_at")
        .eq("statut_compte", STATUT_EN_ATTENTE)
        .order("created_at", desc=False)
        .execute()
    )
    return {"total": len(res.data), "utilisateurs": res.data}


# ── Approuver un compte ───────────────────────────────────
@router.post("/utilisateurs/{id}/approuver")
def approuver_utilisateur(id: int, authorization: str = Header(None)):
    _exiger_directeur(authorization)

    existing = supabase.table("utilisateurs").select("id, email, nom").eq("id", id).execute()
    if not existing.data:
        raise HTTPException(404, f"Utilisateur #{id} introuvable.")

    res = (
        supabase.table("utilisateurs")
        .update({"statut_compte": STATUT_APPROUVE})
        .eq("id", id)
        .execute()
    )

    # Notification par email — best-effort, ne bloque jamais l'approbation.
    # FIX : import différé de missions.py pour éviter un import circulaire
    # (missions.py importe déjà des symboles depuis utilisateurs.py).
    try:
        from missions import _envoyer_email, FRONTEND_URL
        u = existing.data[0]
        _envoyer_email(
            destinataire = u["email"],
            sujet        = "[DSFD] Votre compte a été approuvé",
            corps_html   = f"""
            <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto">
              <h2 style="color:#1A2233">Bonjour {u.get('nom', '')},</h2>
              <p style="color:#475569;font-size:14px;line-height:1.6">
                Votre compte sur la plateforme DSFD a été approuvé par l'administration.
                Vous pouvez désormais vous connecter avec votre email et votre mot de passe.
              </p>
              <a href="{FRONTEND_URL}/index.html"
                 style="display:inline-block;margin-top:16px;background:#F97316;color:#fff;
                        padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:700">
                Se connecter →
              </a>
            </div>
            """
        )
    except Exception as e:
        print(f"⚠️ Notification d'approbation non envoyée : {e}")

    return {"message": "✅ Compte approuvé.", "utilisateur": res.data[0]}


# ── Rejeter un compte ─────────────────────────────────────
@router.post("/utilisateurs/{id}/rejeter")
def rejeter_utilisateur(id: int, authorization: str = Header(None)):
    _exiger_directeur(authorization)

    existing = supabase.table("utilisateurs").select("id").eq("id", id).execute()
    if not existing.data:
        raise HTTPException(404, f"Utilisateur #{id} introuvable.")

    res = (
        supabase.table("utilisateurs")
        .update({"statut_compte": STATUT_REJETE})
        .eq("id", id)
        .execute()
    )
    return {"message": "❌ Compte rejeté.", "utilisateur": res.data[0]}


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