from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, field_validator
from database import supabase
from typing import Optional, List, Dict, Any
import smtplib
import os
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

router = APIRouter(prefix="/missions", tags=["Missions"])

FRONTEND_URL = os.environ.get("FRONTEND_URL", "https://warm-macaron-146f8a.netlify.app")
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
        from datetime import datetime
        try:
            datetime.strptime(v, "%Y-%m-%d")
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


# ── Envoi d'email ──────────────────────────────────────
import urllib.request
import json

import resend

def _envoyer_email(destinataire: str, sujet: str, corps_html: str):
    RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
    if not RESEND_API_KEY:
        print("⚠️ RESEND_API_KEY non configurée")
        return

    try:
        resend.api_key = RESEND_API_KEY
        params = {
            "from":    "DSFD <onboarding@resend.dev>",
            "to":      [destinataire],
            "subject": sujet,
            "html":    corps_html,
        }
        email = resend.Emails.send(params)
        print(f"✅ Email envoyé à {destinataire}: {email}")
    except Exception as e:
        print(f"❌ Erreur envoi email: {e}")

def _template_email_mission(nom_inspecteur: str, mission: dict) -> str:
    """Génère le corps HTML de l'email de notification de mission."""
    mission_id  = mission.get("id", "")
    sfd         = mission.get("sfd", "")
    reference   = mission.get("reference", "N/A")
    date_mission= mission.get("date_mission", "")
    chef        = mission.get("chef_mission", "")
    type_ctrl   = mission.get("type_controle", "global").upper()
    lien        = f"{FRONTEND_URL}/nouvelle_mission.html?id={mission_id}"

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
    """Cherche les emails des inspecteurs et envoie les notifications."""
    for nom in noms_inspecteurs:
        nom = nom.strip()
        if not nom:
            continue

        # Chercher l'email dans la table utilisateurs par nom
        res = (
            supabase.table("utilisateurs")
            .select("email, nom, prenoms")
            .ilike("nom", f"%{nom}%")
            .execute()
        )

        if not res.data:
            # Essayer avec prénom
            res = (
                supabase.table("utilisateurs")
                .select("email, nom, prenoms")
                .ilike("prenoms", f"%{nom}%")
                .execute()
            )

        if res.data:
            utilisateur = res.data[0]
            email       = utilisateur.get("email")
            prenom      = utilisateur.get("prenoms") or nom

            if email:
                corps = _template_email_mission(prenom, mission)
                _envoyer_email(
                    destinataire = email,
                    sujet        = f"[DSFD] Nouvelle mission — {mission.get('sfd', '')} ({mission.get('reference', '')})",
                    corps_html   = corps
                )
        else:
            print(f"⚠️ Inspecteur '{nom}' introuvable dans la base utilisateurs")


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
