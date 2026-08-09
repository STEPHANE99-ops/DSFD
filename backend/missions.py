from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, field_validator
from database import supabase
from typing import Optional, List, Dict, Any
import smtplib
import os
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import jwt
from datetime import datetime, timedelta, timezone

# FIX : on réutilise le secret et l'algorithme définis dans utilisateurs.py
# pour que les tokens émis ici soient vérifiables partout, ainsi que la
# fonction qui crée un token de session complet une fois l'accès validé.
from utilisateurs import SECRET_KEY, ALGORITHM, creer_token_session


router = APIRouter(prefix="/missions", tags=["Missions"])

FRONTEND_URL = os.environ.get("FRONTEND_URL", "https://delicate-sunburst-fe5240.netlify.app")
MAIL_USERNAME = os.environ.get("MAIL_USERNAME", "")
MAIL_PASSWORD = os.environ.get("MAIL_PASSWORD", "")
MAIL_FROM     = os.environ.get("MAIL_FROM", MAIL_USERNAME)
MAIL_SERVER   = os.environ.get("MAIL_SERVER", "smtp.gmail.com")
MAIL_PORT     = int(os.environ.get("MAIL_PORT", "587"))


# ── Modèles ────────────────────────────────────────────
class MissionModel(BaseModel):
    reference:     Optional[str]            = None
    sfd:           str
    date_mission:  str
    inspecteurs:   List[str]
    chef_mission:  str
    reviseur:      Optional[str]            = None
    type_controle: Optional[str]            = None
    periode:       Optional[str]            = None
    statut:        Optional[str]            = "En attente"
    est_soumise:   Optional[bool]           = False
    infos_sfd:     Optional[Dict[str, Any]] = None
    organes:       Optional[Dict[str, Any]] = None
    reunions:      Optional[Dict[str, Any]] = None
    ratios:        Optional[Dict[str, Any]] = None
    # ── FIX : champs manquants pour les tables 4, 5 et 10 du rapport ──
    personnel:              Optional[List[Dict[str, Any]]] = None
    indicateurs_financiers: Optional[Dict[str, Any]]        = None
    suivi_recommandations:  Optional[List[Dict[str, Any]]]  = None

    @field_validator("sfd", "chef_mission")
    @classmethod
    def pas_vide(cls, v):
        if not v.strip():
            raise ValueError("Ce champ ne peut pas être vide.")
        return v.strip()

    @field_validator("inspecteurs")
    @classmethod
    def inspecteurs_valides(cls, v):
        if not v:
            raise ValueError("Au moins un inspecteur est requis.")
        return v

    @field_validator("date_mission")
    @classmethod
    def date_valide(cls, v):
        from datetime import datetime as dt
        try:
            dt.strptime(v, "%Y-%m-%d")
        except ValueError:
            raise ValueError("Format de date invalide. Utilisez YYYY-MM-DD.")
        return v


class MissionUpdateModel(BaseModel):
    reference:     Optional[str]            = None
    sfd:           Optional[str]            = None
    date_mission:  Optional[str]            = None
    inspecteurs:   Optional[List[str]]      = None
    chef_mission:  Optional[str]            = None
    reviseur:      Optional[str]            = None
    type_controle: Optional[str]            = None
    periode:       Optional[str]            = None
    statut:        Optional[str]            = None
    est_soumise:   Optional[bool]           = None
    infos_sfd:     Optional[Dict[str, Any]] = None
    organes:       Optional[Dict[str, Any]] = None
    reunions:      Optional[Dict[str, Any]] = None
    ratios:        Optional[Dict[str, Any]] = None
    # ── FIX : champs manquants pour les tables 4, 5 et 10 du rapport ──
    personnel:              Optional[List[Dict[str, Any]]] = None
    indicateurs_financiers: Optional[Dict[str, Any]]        = None
    suivi_recommandations:  Optional[List[Dict[str, Any]]]  = None


# FIX : modèle pour la vérification du lien d'accès envoyé par mail
class AccesMissionModel(BaseModel):
    token: str


# ── Envoi d'email ──────────────────────────────────────
import urllib.request
import json

import resend

# FIX : adresse d'expédition configurable. Par défaut, "onboarding@resend.dev"
# — l'adresse de test fournie par Resend, qui ne peut envoyer QU'À l'adresse
# du propriétaire du compte Resend (tout autre destinataire est refusé tant
# qu'aucun domaine n'est vérifié). Une fois un domaine vérifié sur
# resend.com/domains, définir RESEND_FROM_EMAIL sur Render (ex. "DSFD
# <notifications@dsfd.ci>") : les emails partiront alors vers n'importe quel
# destinataire, sans autre changement de code.
RESEND_FROM_EMAIL = os.environ.get("RESEND_FROM_EMAIL", "DSFD <onboarding@resend.dev>")

# FIX : solution sans domaine à vérifier — envoi via un compte Gmail
# personnel (SMTP + mot de passe d'application), utile en phase de test
# tant qu'aucun nom de domaine n'a été acheté. Contrairement à Resend en
# mode test, Gmail envoie vers n'importe quel destinataire dès l'origine.
# Pour l'activer : définir GMAIL_ADDRESS et GMAIL_APP_PASSWORD sur Render
# (voir la marche à suivre ci-dessous) — dès que ces deux variables sont
# présentes, _envoyer_email() passe automatiquement par Gmail au lieu de
# Resend, sans aucun autre changement de code.
#
# Marche à suivre pour obtenir un mot de passe d'application Gmail :
#   1. Compte Google → Sécurité → activer la validation en 2 étapes
#      (obligatoire, sinon l'étape suivante n'apparaît pas)
#   2. Compte Google → Sécurité → Mots de passe des applications
#      → générer un mot de passe pour "Mail" / "Autre"
#   3. Copier le code à 16 caractères obtenu (jamais le mot de passe
#      normal du compte) dans GMAIL_APP_PASSWORD sur Render
GMAIL_ADDRESS      = os.environ.get("GMAIL_ADDRESS", "")
GMAIL_APP_PASSWORD = os.environ.get("GMAIL_APP_PASSWORD", "")

# FIX : option Brevo (ex-Sendinblue) — plan gratuit à vie, 300 emails/jour,
# sans domaine à vérifier pour envoyer vers n'importe quel destinataire
# (contrairement au mode test de Resend). Sans domaine authentifié côté
# Brevo, l'email part depuis une adresse générique à eux plutôt que la
# vôtre, avec une délivrabilité un peu réduite — largement suffisant pour
# une phase de test. Pour l'activer : créer un compte gratuit sur
# brevo.com, récupérer la clé API (Paramètres → Clés API → SMTP & API),
# puis définir BREVO_API_KEY sur Render.
BREVO_API_KEY = os.environ.get("BREVO_API_KEY", "")
BREVO_FROM_EMAIL = os.environ.get("BREVO_FROM_EMAIL", "")


def _envoyer_email_brevo(destinataire: str, sujet: str, corps_html: str):
    """Envoi via l'API transactionnelle de Brevo (REST, pas de dépendance
    supplémentaire : utilise urllib, déjà importé dans ce fichier)."""
    payload = json.dumps({
        "sender":      {"name": "DSFD", "email": BREVO_FROM_EMAIL},
        "to":          [{"email": destinataire}],
        "subject":     sujet,
        "htmlContent": corps_html,
    }).encode("utf-8")

    requete = urllib.request.Request(
        "https://api.brevo.com/v3/smtp/email",
        data=payload,
        method="POST",
        headers={
            "api-key":       BREVO_API_KEY,
            "Content-Type":  "application/json",
            "Accept":        "application/json",
        },
    )
    with urllib.request.urlopen(requete, timeout=15) as reponse:
        reponse.read()  # consomme la réponse ; lève une exception si le statut n'est pas 2xx


def _envoyer_email_gmail(destinataire: str, sujet: str, corps_html: str):
    """Envoi via le SMTP de Gmail — pas de domaine à vérifier, mais soumis
    aux limites d'envoi d'un compte Gmail normal (environ 500 emails/jour),
    largement suffisant en phase de test."""
    msg = MIMEMultipart("alternative")
    msg["From"]    = f"DSFD <{GMAIL_ADDRESS}>"
    msg["To"]      = destinataire
    msg["Subject"] = sujet
    # Repli texte brut minimal, en plus du HTML — meilleure délivrabilité,
    # certains clients mail affichent ce texte en aperçu.
    msg.attach(MIMEText("Ouvrez cet email avec un client compatible HTML pour voir son contenu.", "plain"))
    msg.attach(MIMEText(corps_html, "html"))

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as serveur:
        serveur.login(GMAIL_ADDRESS, GMAIL_APP_PASSWORD)
        serveur.sendmail(GMAIL_ADDRESS, [destinataire], msg.as_string())


def _envoyer_email(destinataire: str, sujet: str, corps_html: str):
    # FIX : ordre de priorité — Brevo en premier s'il est configuré (le
    # plus simple : aucun domaine à vérifier, envoie vers n'importe quel
    # destinataire dès l'origine) ; puis Gmail ; puis Resend en dernier
    # recours (limité à l'adresse du propriétaire du compte tant qu'aucun
    # domaine n'y est vérifié).
    if BREVO_API_KEY:
        if not BREVO_FROM_EMAIL:
            # FIX : sans adresse d'expéditeur vérifiée, Brevo transmet quand
            # même le message, mais Gmail (et la plupart des messageries)
            # le rejette juste après en voyant une adresse d'expéditeur non
            # autorisée — c'était le cas avec l'ancienne valeur par défaut
            # factice ("dsfd@example.com"). Mieux vaut échouer clairement
            # ici, plutôt qu'un envoi silencieusement voué au rejet.
            print("⚠️ BREVO_API_KEY configurée mais BREVO_FROM_EMAIL manquante — "
                  "email non envoyé. Voir Brevo → Senders, Domains & Dedicated IPs "
                  "pour obtenir une adresse d'expéditeur vérifiée.")
            return
        try:
            _envoyer_email_brevo(destinataire, sujet, corps_html)
            print(f"✅ Email envoyé à {destinataire} (via Brevo)")
            return
        except Exception as e:
            print(f"❌ Erreur envoi email (Brevo) : {e}")
            return

    if GMAIL_ADDRESS and GMAIL_APP_PASSWORD:
        try:
            _envoyer_email_gmail(destinataire, sujet, corps_html)
            print(f"✅ Email envoyé à {destinataire} (via Gmail)")
            return
        except Exception as e:
            print(f"❌ Erreur envoi email (Gmail) : {e}")
            return

    RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
    if not RESEND_API_KEY:
        print("⚠️ Aucun service d'email configuré (ni Brevo, ni Gmail, ni Resend)")
        return

    try:
        resend.api_key = RESEND_API_KEY
        params = {
            "from":    RESEND_FROM_EMAIL,
            "to":      [destinataire],
            "subject": sujet,
            "html":    corps_html,
        }
        email = resend.Emails.send(params)
        print(f"✅ Email envoyé à {destinataire} (via Resend) : {email}")
    except Exception as e:
        print(f"❌ Erreur envoi email (Resend) : {e}")


# ── FIX : génération du token d'accès mission ──────────
# Ce token est propre à UN email d'inspecteur et UNE mission précise.
# Il est signé avec le même secret que les sessions normales, mais porte
# un "type" différent ("mission_access") pour ne jamais être confondu
# avec un token de session classique. Il expire après 14 jours.
def _creer_token_acces_mission(email: str, mission_id: int) -> str:
    payload = {
        "sub":        email,
        "mission_id": mission_id,
        "type":       "mission_access",
        "iat":        datetime.now(timezone.utc),
        "exp":        datetime.now(timezone.utc) + timedelta(days=14),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def _template_email_mission(nom_inspecteur: str, mission: dict, token_acces: str) -> str:
    """Génère le corps HTML de l'email de notification de mission."""
    mission_id  = mission.get("id", "")
    sfd         = mission.get("sfd", "")
    reference   = mission.get("reference", "N/A")
    date_mission= mission.get("date_mission", "")
    chef        = mission.get("chef_mission", "")
    type_ctrl   = (mission.get("type_controle") or "global").upper()
    # FIX : le lien porte désormais un token prouvant l'identité du
    # destinataire — plus de dépendance à "qui est connecté sur ce
    # navigateur en ce moment".
    lien        = f"{FRONTEND_URL}/nouvelle_mission.html?id={mission_id}&token={token_acces}"

    return f"""
    <!DOCTYPE html>
    <html lang="fr">
    <head><meta charset="UTF-8"/></head>
    <body style="font-family:Arial,sans-serif;background:#F8FAFC;margin:0;padding:20px">
      <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,.08)">

        <!-- En-tête -->
        <div style="background:#1A2233;padding:28px 32px;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:22px">DSFD</h1>
          <p style="color:#94A3B8;margin:4px 0 0;font-size:13px">Direction des Systèmes Financiers Décentralisés</p>
        </div>

        <!-- Corps -->
        <div style="padding:32px">
          <p style="font-size:15px;color:#1A2233">Bonjour <strong>{nom_inspecteur}</strong>,</p>

          <p style="font-size:14px;color:#475569;line-height:1.6">
            Vous avez été désigné(e) comme inspecteur pour une nouvelle mission de contrôle.
            Veuillez cliquer sur le bouton ci-dessous pour accéder à la mission et commencer le travail.
          </p>

          <!-- Détails mission -->
          <div style="background:#F8FAFC;border:1.5px solid #E2E8F0;border-radius:10px;padding:20px;margin:24px 0">
            <h3 style="margin:0 0 16px;font-size:14px;color:#1A2233">Détails de la mission</h3>
            <table style="width:100%;font-size:13px;color:#475569">
              <tr><td style="padding:5px 0;font-weight:600;width:40%">Référence</td><td>{reference}</td></tr>
              <tr><td style="padding:5px 0;font-weight:600">SFD concerné</td><td>{sfd}</td></tr>
              <tr><td style="padding:5px 0;font-weight:600">Date de mission</td><td>{date_mission}</td></tr>
              <tr><td style="padding:5px 0;font-weight:600">Chef de mission</td><td>{chef}</td></tr>
              <tr><td style="padding:5px 0;font-weight:600">Type de contrôle</td><td>{type_ctrl}</td></tr>
            </table>
          </div>

          <!-- Bouton -->
          <div style="text-align:center;margin:32px 0">
            <a href="{lien}"
               style="background:#F97316;color:#fff;padding:14px 32px;border-radius:10px;
                      text-decoration:none;font-weight:700;font-size:15px;display:inline-block">
              Accéder à la mission →
            </a>
          </div>

          <p style="font-size:12px;color:#94A3B8;text-align:center">
            Ou copiez ce lien dans votre navigateur :<br/>
            <a href="{lien}" style="color:#F97316">{lien}</a>
          </p>

          <p style="font-size:11px;color:#CBD5E1;text-align:center;margin-top:18px">
            Ce lien est personnel et valable 14 jours.
          </p>
        </div>

        <!-- Pied de page -->
        <div style="background:#F8FAFC;padding:16px 32px;text-align:center;border-top:1px solid #E2E8F0">
          <p style="font-size:11px;color:#94A3B8;margin:0">
            Cet email a été envoyé automatiquement par la plateforme DSFD.<br/>
            Ne pas répondre à cet email.
          </p>
        </div>

      </div>
    </body>
    </html>
    """


def _notifier_inspecteurs(mission: dict, noms_inspecteurs: List[str]):
    """Cherche les inspecteurs dans la table utilisateurs et envoie les notifications.

    FIX : la recherche se fait désormais en priorité par EMAIL (identifiant
    unique et fiable envoyé par le frontend) et est restreinte aux comptes
    dont la colonne `role` vaut 'inspecteur'. On conserve une recherche de
    repli par nom/prénom pour les anciennes missions enregistrées avec un nom.
    Le paramètre garde le nom `noms_inspecteurs` pour rester compatible avec
    l'appel existant dans creer_mission().

    FIX : chaque email envoyé embarque désormais un token d'accès propre à
    l'inspecteur et à la mission (voir _creer_token_acces_mission).
    """
    for identifiant in noms_inspecteurs:
        identifiant = (identifiant or "").strip()
        if not identifiant:
            continue

        utilisateur = None

        # 1) Recherche prioritaire par email (valeur envoyée par le frontend),
        #    filtrée sur le rôle 'inspecteur' via la colonne `role`.
        if "@" in identifiant:
            res = (
                supabase.table("utilisateurs")
                .select("email, nom, prenoms, role")
                .eq("email", identifiant)
                .eq("role", "inspecteur")
                .execute()
            )
            if res.data:
                utilisateur = res.data[0]

        # 2) Repli : anciennes missions stockées avec un nom/prénom.
        if utilisateur is None:
            res = (
                supabase.table("utilisateurs")
                .select("email, nom, prenoms, role")
                .eq("role", "inspecteur")
                .ilike("nom", f"%{identifiant}%")
                .execute()
            )
            if not res.data:
                res = (
                    supabase.table("utilisateurs")
                    .select("email, nom, prenoms, role")
                    .eq("role", "inspecteur")
                    .ilike("prenoms", f"%{identifiant}%")
                    .execute()
                )
            if res.data:
                utilisateur = res.data[0]

        if utilisateur:
            email  = utilisateur.get("email")
            prenom = utilisateur.get("prenoms") or utilisateur.get("nom") or "Inspecteur"

            if email:
                token_acces = _creer_token_acces_mission(email, mission.get("id"))
                corps = _template_email_mission(prenom, mission, token_acces)
                _envoyer_email(
                    destinataire = email,
                    sujet        = f"[DSFD] Nouvelle mission — {mission.get('sfd', '')} ({mission.get('reference', '')})",
                    corps_html   = corps
                )
        else:
            print(f"⚠️ Inspecteur '{identifiant}' introuvable dans la base utilisateurs (role='inspecteur')")


# ── Routes ────────────────────────────────────────────

@router.get("/")
def liste_missions():
    res = (
        supabase.table("missions")
        .select("*")
        .order("date_creation", desc=True)
        .execute()
    )
    return {"total": len(res.data), "missions": res.data}


@router.get("/{id}")
def get_mission(id: int):
    res = (
        supabase.table("missions")
        .select("*")
        .eq("id", id)
        .execute()
    )
    if not res.data:
        raise HTTPException(404, f"Mission #{id} introuvable.")
    return res.data[0]


@router.post("/", status_code=201)
def creer_mission(data: MissionModel):
    inspecteurs_str = ", ".join(data.inspecteurs)

    res = (
        supabase.table("missions")
        .insert({
            "reference":     data.reference,
            "sfd":           data.sfd,
            "date_mission":  data.date_mission,
            "inspecteurs":   inspecteurs_str,
            "chef_mission":  data.chef_mission,
            "reviseur":      data.reviseur,
            "type_controle": data.type_controle,
            "periode":       data.periode,
            "statut":        data.statut,
            "est_soumise":   data.est_soumise,
            "infos_sfd":     data.infos_sfd,
            "organes":       data.organes,
            "reunions":      data.reunions,
            "ratios":        data.ratios,
            # ── FIX ──
            "personnel":              data.personnel,
            "indicateurs_financiers": data.indicateurs_financiers,
            "suivi_recommandations":  data.suivi_recommandations,
        })
        .execute()
    )

    mission = res.data[0]

    # Envoyer les emails en arrière-plan (ne bloque pas la réponse)

    _notifier_inspecteurs(
        mission          = mission,
        noms_inspecteurs = data.inspecteurs
    )

    return {"message": "✅ Mission créée avec succès ! Emails envoyés aux inspecteurs.", "mission": mission}


@router.put("/{id}")
def modifier_mission(id: int, data: MissionUpdateModel):
    existing = supabase.table("missions").select("id").eq("id", id).execute()
    if not existing.data:
        raise HTTPException(404, f"Mission #{id} introuvable.")

    champs = {}
    if data.reference     is not None: champs["reference"]     = data.reference
    if data.sfd           is not None: champs["sfd"]           = data.sfd
    if data.date_mission  is not None: champs["date_mission"]  = data.date_mission
    if data.inspecteurs   is not None: champs["inspecteurs"]   = ", ".join(data.inspecteurs)
    if data.chef_mission  is not None: champs["chef_mission"]  = data.chef_mission
    if data.reviseur      is not None: champs["reviseur"]      = data.reviseur
    if data.type_controle is not None: champs["type_controle"] = data.type_controle
    if data.periode       is not None: champs["periode"]       = data.periode
    if data.statut        is not None: champs["statut"]        = data.statut
    if data.est_soumise   is not None: champs["est_soumise"]   = data.est_soumise
    if data.infos_sfd     is not None: champs["infos_sfd"]     = data.infos_sfd
    if data.organes       is not None: champs["organes"]       = data.organes
    if data.reunions      is not None: champs["reunions"]      = data.reunions
    if data.ratios        is not None: champs["ratios"]        = data.ratios
    # ── FIX : champs manquants pour les tables 4, 5 et 10 du rapport ──
    if data.personnel              is not None: champs["personnel"]              = data.personnel
    if data.indicateurs_financiers is not None: champs["indicateurs_financiers"] = data.indicateurs_financiers
    if data.suivi_recommandations  is not None: champs["suivi_recommandations"]  = data.suivi_recommandations

    if not champs:
        raise HTTPException(400, "Aucun champ à modifier.")

    res = (
        supabase.table("missions")
        .update(champs)
        .eq("id", id)
        .execute()
    )
    return {"message": "✅ Mission modifiée !", "mission": res.data[0]}


@router.post("/{id}/soumettre")
def soumettre_mission(id: int):
    existing = supabase.table("missions").select("id").eq("id", id).execute()
    if not existing.data:
        raise HTTPException(404, f"Mission #{id} introuvable.")

    res = (
        supabase.table("missions")
        .update({"est_soumise": True, "statut": "En cours"})
        .eq("id", id)
        .execute()
    )
    return {"message": "✅ Mission soumise !", "mission": res.data[0]}


@router.post("/{id}/terminer")
def terminer_mission(id: int):
    existing = supabase.table("missions").select("id").eq("id", id).execute()
    if not existing.data:
        raise HTTPException(404, f"Mission #{id} introuvable.")

    res = (
        supabase.table("missions")
        .update({"statut": "Terminée", "est_soumise": True})
        .eq("id", id)
        .execute()
    )
    return {"message": "✅ Mission terminée !", "mission": res.data[0]}


@router.delete("/{id}")
def supprimer_mission(id: int):
    res = (
        supabase.table("missions")
        .delete()
        .eq("id", id)
        .execute()
    )
    if not res.data:
        raise HTTPException(404, f"Mission #{id} introuvable.")
    return {"message": "✅ Mission supprimée.", "mission": res.data[0]}


# ── FIX : vérification du lien d'accès reçu par mail ────
# Appelée par le frontend (nouvelle_mission.js) dès qu'un paramètre
# ?token=... est présent dans l'URL. Si le token est valide, non expiré,
# et correspond bien à un inspecteur existant, on renvoie un token de
# session complet qui remplace toute session précédente (par exemple
# celle du chef de mission qui aurait été restée connecté sur ce poste).
@router.post("/verifier-acces")
def verifier_acces_mission(data: AccesMissionModel):
    try:
        payload = jwt.decode(data.token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Ce lien a expiré. Demandez au chef de mission de vous le renvoyer.")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Lien d'accès invalide.")

    if payload.get("type") != "mission_access":
        raise HTTPException(401, "Lien d'accès invalide.")

    email       = payload.get("sub")
    mission_id  = payload.get("mission_id")

    res = (
        supabase.table("utilisateurs")
        .select("id, nom, prenoms, role, email")
        .eq("email", email)
        .eq("role", "inspecteur")
        .execute()
    )
    if not res.data:
        raise HTTPException(404, "Inspecteur introuvable ou rôle modifié depuis l'envoi du lien.")
    u = res.data[0]

    mission = supabase.table("missions").select("id").eq("id", mission_id).execute()
    if not mission.data:
        raise HTTPException(404, "Mission introuvable.")

    return {
        "utilisateur": u,
        "token":       creer_token_session(u),
        "mission_id":  mission_id,
    }