from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import supabase
from typing import Optional
from datetime import datetime
import os
import resend

router = APIRouter(prefix="/validations", tags=["Validations"])

FRONTEND_URL = os.environ.get("FRONTEND_URL", "https://delicate-sunburst-fe5240.netlify.app")

STATUT_PAR_NIVEAU = {
    1: "en_attente_chef",
    2: "en_attente_resp",
    3: "en_attente_dir",
}

LABEL_NIVEAU = {
    1: "Chef de mission",
    2: "Responsable des missions",
    3: "Directeur",
}


# ── Modèles ──────────────────────────────────────────────────────────
class SoumettreValidationModel(BaseModel):
    rapport_id:       int
    validateur_nom:   str
    validateur_email: str


class ValiderRapportModel(BaseModel):
    commentaire: Optional[str] = ""
    statut:      str


# ── Emails ───────────────────────────────────────────────────────────
def _envoyer_email_validation(destinataire_email: str, destinataire_nom: str,
                               rapport: dict, niveau: int, validation_id: int):
    RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
    if not RESEND_API_KEY:
        print("⚠️ RESEND_API_KEY non configurée")
        return

    lien  = f"{FRONTEND_URL}/validation.html?rapport_id={rapport['id']}&niveau={niveau}"
    label = LABEL_NIVEAU.get(niveau, f"Niveau {niveau}")

    corps_html = f"""
    <!DOCTYPE html>
    <html lang="fr">
    <head><meta charset="UTF-8"/></head>
    <body style="font-family:Arial,sans-serif;background:#F8FAFC;margin:0;padding:20px">
      <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,.08)">
        <div style="background:#1A2233;padding:28px 32px;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:22px">DSFD</h1>
          <p style="color:#94A3B8;margin:4px 0 0;font-size:13px">Workflow de validation</p>
        </div>
        <div style="padding:32px">
          <p style="font-size:15px;color:#1A2233">Bonjour <strong>{destinataire_nom}</strong>,</p>
          <p style="font-size:14px;color:#475569;line-height:1.6">
            Un rapport de mission est en attente de votre validation en tant que <strong>{label}</strong>.
          </p>
          <div style="background:#F8FAFC;border:1.5px solid #E2E8F0;border-radius:10px;padding:20px;margin:24px 0">
            <h3 style="margin:0 0 16px;font-size:14px;color:#1A2233">Détails du rapport</h3>
            <table style="width:100%;font-size:13px;color:#475569">
              <tr><td style="padding:5px 0;font-weight:600;width:40%">Référence</td><td>{rapport.get('reference', 'N/A')}</td></tr>
              <tr><td style="padding:5px 0;font-weight:600">Mission</td><td>{rapport.get('mission_sfd', 'N/A')}</td></tr>
              <tr><td style="padding:5px 0;font-weight:600">Type</td><td>{rapport.get('type_rapport', 'global')}</td></tr>
              <tr><td style="padding:5px 0;font-weight:600">Niveau</td><td><strong style="color:#E8500A">{label}</strong></td></tr>
            </table>
          </div>
          <div style="text-align:center;margin:32px 0">
            <a href="{lien}" style="background:#E8500A;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block">
              Valider le rapport →
            </a>
          </div>
          <p style="font-size:12px;color:#94A3B8;text-align:center">
            Ou copiez ce lien :<br/>
            <a href="{lien}" style="color:#E8500A">{lien}</a>
          </p>
        </div>
        <div style="background:#F8FAFC;padding:16px 32px;text-align:center;border-top:1px solid #E2E8F0">
          <p style="font-size:11px;color:#94A3B8;margin:0">Email automatique DSFD — Ne pas répondre.</p>
        </div>
      </div>
    </body>
    </html>
    """

    try:
        resend.api_key = RESEND_API_KEY
        resend.Emails.send({
            "from":    "DSFD <onboarding@resend.dev>",
            "to":      [destinataire_email],
            "subject": f"[DSFD] Rapport à valider — {rapport.get('reference', '')} ({label})",
            "html":    corps_html,
        })
        print(f"✅ Email validation envoyé à {destinataire_email}")
    except Exception as e:
        print(f"❌ Erreur email validation: {e}")


def _envoyer_email_resultat(rapport: dict, niveau: int, statut: str, commentaire: str):
    RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
    if not RESEND_API_KEY:
        return

    mission_res = (
        supabase.table("missions")
        .select("chef_mission")
        .eq("id", rapport.get("mission_id"))
        .execute()
    )
    if not mission_res.data:
        return

    chef_nom = mission_res.data[0].get("chef_mission", "")
    if not chef_nom:
        return

    utilisateur = (
        supabase.table("utilisateurs")
        .select("email, prenoms")
        .ilike("nom", f"%{chef_nom}%")
        .execute()
    )
    if not utilisateur.data:
        return

    email_chef = utilisateur.data[0].get("email")
    if not email_chef:
        return

    label   = LABEL_NIVEAU.get(niveau, f"Niveau {niveau}")
    couleur = "#16A34A" if statut == "valide" else "#DC2626"
    emoji   = "✅" if statut == "valide" else "❌"
    mot     = "validé" if statut == "valide" else "rejeté"

    corps_html = f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <h2 style="color:#1A2233">Résultat de validation</h2>
      <p>Le rapport <strong>{rapport.get('reference', '')}</strong> a été
         <strong style="color:{couleur}">{emoji} {mot}</strong>
         par le <strong>{label}</strong>.</p>
      {'<p><strong>Commentaire :</strong> ' + commentaire + '</p>' if commentaire else ''}
      <p style="color:#64748B;font-size:12px">Email automatique DSFD</p>
    </div>
    """

    try:
        resend.api_key = RESEND_API_KEY
        resend.Emails.send({
            "from":    "DSFD <onboarding@resend.dev>",
            "to":      [email_chef],
            "subject": f"[DSFD] {emoji} Rapport {mot} — {rapport.get('reference', '')}",
            "html":    corps_html,
        })
    except Exception as e:
        print(f"❌ Erreur email résultat: {e}")


# ── Routes ───────────────────────────────────────────────────────────

@router.get("/rapport/{rapport_id}")
def get_validations_rapport(rapport_id: int):
    res = (
        supabase.table("validations")
        .select("*")
        .eq("rapport_id", rapport_id)
        .order("niveau")
        .execute()
    )
    return {"validations": res.data}


@router.post("/soumettre", status_code=201)
def soumettre_pour_validation(data: SoumettreValidationModel):
    # Vérifier que le rapport existe
    rapport_res = (
        supabase.table("rapports")
        .select("*, missions(sfd)")
        .eq("id", data.rapport_id)
        .execute()
    )
    if not rapport_res.data:
        raise HTTPException(404, "Rapport introuvable")

    rapport = rapport_res.data[0]
    mission = rapport.pop("missions", {}) or {}
    rapport["mission_sfd"] = mission.get("sfd", "")

    # Vérifier qu'il n'y a pas déjà une validation en cours
    existing = (
        supabase.table("validations")
        .select("id")
        .eq("rapport_id", data.rapport_id)
        .execute()
    )
    if existing.data:
        raise HTTPException(400, "Ce rapport est déjà en cours de validation.")

    # Chercher le nom du validateur dans utilisateurs à partir de l'email
    user_res = (
        supabase.table("utilisateurs")
        .select("nom, prenoms")
        .eq("email", data.validateur_email)
        .execute()
    )
    nom_validateur = data.validateur_email  # fallback si pas trouvé
    if user_res.data:
        u = user_res.data[0]
        nom_validateur = f"{u.get('nom', '')} {u.get('prenoms', '')}".strip()

    # Créer la validation niveau 1
    val_res = (
        supabase.table("validations")
        .insert({
            "rapport_id":       data.rapport_id,
            "niveau":           1,
            "validateur_nom":   nom_validateur,
            "validateur_email": data.validateur_email,
            "statut":           "en_attente",
        })
        .execute()
    )

    # Mettre à jour le statut du rapport
    supabase.table("rapports").update({
        "statut_validation": "en_attente_chef"
    }).eq("id", data.rapport_id).execute()

    # Notifier le validateur niveau 1
    _envoyer_email_validation(
        destinataire_email = data.validateur_email,
        destinataire_nom   = nom_validateur,
        rapport            = rapport,
        niveau             = 1,
        validation_id      = val_res.data[0]["id"]
    )

    return {
        "message":    "✅ Rapport soumis pour validation au Chef de mission !",
        "validation": val_res.data[0]
    }


@router.put("/{rapport_id}/niveau/{niveau}")
def valider_rapport(rapport_id: int, niveau: int, data: ValiderRapportModel):
    if data.statut not in ("valide", "rejete"):
        raise HTTPException(400, "Statut invalide. Utilisez 'valide' ou 'rejete'.")

    # Récupérer la validation existante
    val_res = (
        supabase.table("validations")
        .select("*")
        .eq("rapport_id", rapport_id)
        .eq("niveau", niveau)
        .execute()
    )
    if not val_res.data:
        raise HTTPException(404, f"Validation niveau {niveau} introuvable.")

    validation = val_res.data[0]
    if validation["statut"] != "en_attente":
        raise HTTPException(400, "Cette validation a déjà été traitée.")

    # Mettre à jour la validation
    supabase.table("validations").update({
        "statut":          data.statut,
        "commentaire":     data.commentaire,
        "date_validation": datetime.now().isoformat(),
    }).eq("id", validation["id"]).execute()

    # Récupérer le rapport
    rapport_res = (
        supabase.table("rapports")
        .select("*, missions(sfd)")
        .eq("id", rapport_id)
        .execute()
    )
    rapport = rapport_res.data[0]
    mission = rapport.pop("missions", {}) or {}
    rapport["mission_sfd"] = mission.get("sfd", "")

    # Notifier le créateur du résultat
    _envoyer_email_resultat(rapport, niveau, data.statut, data.commentaire or "")

    if data.statut == "rejete":
        supabase.table("rapports").update({
            "statut_validation": "rejete"
        }).eq("id", rapport_id).execute()
        return {"message": f"❌ Rapport rejeté au niveau {niveau}."}

    # Validé → niveau suivant ou final
    if niveau < 3:
        niveau_suivant = niveau + 1
        role_map = {2: "responsable", 3: "directeur"}
        role = role_map.get(niveau_suivant, "")

        validateur_suivant = None
        if role:
            users_res = (
                supabase.table("utilisateurs")
                .select("nom, prenoms, email, fonction")
                .ilike("fonction", f"%{role}%")
                .execute()
            )
            if users_res.data:
                validateur_suivant = users_res.data[0]

        val_data = {
            "rapport_id": rapport_id,
            "niveau":     niveau_suivant,
            "statut":     "en_attente",
        }
        if validateur_suivant:
            val_data["validateur_nom"]   = f"{validateur_suivant.get('nom', '')} {validateur_suivant.get('prenoms', '')}".strip()
            val_data["validateur_email"] = validateur_suivant.get("email", "")

        val_next = supabase.table("validations").insert(val_data).execute()

        supabase.table("rapports").update({
            "statut_validation": STATUT_PAR_NIVEAU[niveau_suivant]
        }).eq("id", rapport_id).execute()

        if validateur_suivant and validateur_suivant.get("email"):
            _envoyer_email_validation(
                destinataire_email = validateur_suivant["email"],
                destinataire_nom   = val_data["validateur_nom"],
                rapport            = rapport,
                niveau             = niveau_suivant,
                validation_id      = val_next.data[0]["id"]
            )

        return {
            "message":        f"✅ Niveau {niveau} validé ! Rapport transmis au {LABEL_NIVEAU[niveau_suivant]}.",
            "niveau_suivant": niveau_suivant
        }

    else:
        supabase.table("rapports").update({
            "statut_validation": "valide"
        }).eq("id", rapport_id).execute()
        return {"message": "✅ Rapport validé par le Directeur ! Disponible au téléchargement."}


@router.get("/en-attente/{email}")
def get_rapports_en_attente(email: str):
    res = (
        supabase.table("validations")
        .select("*, rapports(reference, type_rapport, fichier_url, statut_validation, missions(sfd))")
        .eq("validateur_email", email)
        .eq("statut", "en_attente")
        .execute()
    )
    return {"validations": res.data}