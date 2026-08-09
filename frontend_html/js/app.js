/* ================================================
   DSFD — app.js
   Gère : auth, missions, rapports, recommandations
   ================================================ */

// Remplacez par :
const API_URL = "https://dsfd-2.onrender.com";  // sans slash final

/* ════════════════════════════════════════════
   AUTH — requireAuth + logout + affichage
   FIX : requireAuth() revalide désormais la session
   contre le backend (token JWT) au lieu de faire
   simplement confiance à ce qui traîne dans
   localStorage. Cela évite qu'un rôle périmé ou
   qu'une session d'un autre utilisateur reste
   affichée par erreur.
════════════════════════════════════════════ */
async function requireAuth() {
  const token = localStorage.getItem("token");
  const user  = JSON.parse(localStorage.getItem("utilisateur") || "null");

  if (!token || !user) {
    window.location.href = "index.html";
    return;
  }

  try {
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("session invalide");
    const data = await res.json();
    // FIX : on FUSIONNE les données fraîches du serveur avec la session
    // locale au lieu de l'écraser. Un champ n'est mis à jour que si le
    // serveur renvoie une valeur non vide — sinon les infos locales
    // (téléphone, fonction, structure…) disparaissaient à chaque
    // actualisation de page.
    const fusion = { ...user };
    Object.entries(data.utilisateur || {}).forEach(([k, v]) => {
      if (v !== null && v !== undefined && v !== "") fusion[k] = v;
    });
    localStorage.setItem("utilisateur", JSON.stringify(fusion));
  } catch {
    localStorage.removeItem("utilisateur");
    localStorage.removeItem("token");
    window.location.href = "index.html";
  }
}

const LABEL_ROLE = {
  inspecteur:   "Inspecteur",
  chef_mission: "Chef de mission",
  directeur:    "Directeur",
};

function afficherUtilisateur() {
  const user = JSON.parse(localStorage.getItem("utilisateur") || "{}");
  if (!user.nom) return;

  const nameEl   = document.getElementById("user-name");
  const avatarEl = document.getElementById("user-avatar");
  const roleEl   = document.getElementById("user-role");

  if (nameEl)   nameEl.textContent   = `${user.nom} ${user.prenoms || ""}`;
  if (avatarEl) {
    if (user.photo) {
      avatarEl.innerHTML = `<img src="${user.photo}" alt=""
        style="width:100%;height:100%;object-fit:cover;border-radius:inherit"/>`;
      avatarEl.style.overflow = "hidden";
    } else {
      avatarEl.textContent = (user.nom[0] + (user.prenoms?.[0] || "")).toUpperCase();
    }
  }
  // FIX : affiche le libellé du rôle applicatif (role), plus jamais "fonction"
  if (roleEl)   roleEl.textContent   = LABEL_ROLE[user.role] || "Utilisateur";

  verrouillerAccesDirecteur(user);
}

// FIX : la directrice (rôle "directeur") ne doit accéder qu'à sa propre
// interface, Administration.html — jamais au dashboard ni aux autres
// pages de travail des inspecteurs. Si son compte se retrouve sur une
// autre page (lien direct, onglet resté ouvert, favori…), on la renvoie
// immédiatement vers Administration.html.
function verrouillerAccesDirecteur(user) {
  if (user.role !== "directeur") return;
  const page = (window.location.pathname.split("/").pop() || "").toLowerCase();
  if (page === "administration.html" || page === "index.html" || page === "") return;
  window.location.href = "Administration.html";
}

/* ════════════════════════════════════════════
   RÔLE UTILISATEUR — helpers
════════════════════════════════════════════ */
function getUserRole() {
  const user = JSON.parse(localStorage.getItem("utilisateur") || "{}");
  return user.role || "inspecteur";
}
function estChefMission() {
  return getUserRole() === "chef_mission";
}

// FIX : logout() supprime désormais aussi le token de session.
function logout() {
  localStorage.removeItem("utilisateur");
  localStorage.removeItem("token");
  window.location.href = "index.html";
}

function toggleSidebar() {
  document.querySelector(".sidebar")?.classList.toggle("open");
  document.getElementById("sidebar-overlay")?.classList.toggle("open");
}

/* ════════════════════════════════════════════
   INSCRIPTION
════════════════════════════════════════════ */
const signupForm = document.getElementById("signupForm");
if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nom          = document.getElementById("name")?.value.trim();
    const prenoms      = document.getElementById("user_name")?.value.trim();
    // FIX : "role" est l'unique champ de rôle — "fonction" n'existe plus
    const role         = document.getElementById("user_role")?.value.trim();
    const email        = document.getElementById("email")?.value.trim();
    const mot_de_passe = document.getElementById("password")?.value;
    const confirmation = document.getElementById("confirmPassword")?.value;
    const message      = document.getElementById("message");

    if (!role) {
      message.style.color = "red";
      message.textContent = "❌ Veuillez sélectionner un rôle.";
      return;
    }
    if (mot_de_passe !== confirmation) {
      message.style.color = "red";
      message.textContent = "❌ Les mots de passe ne correspondent pas.";
      return;
    }
    if (mot_de_passe.length < 8) {
      message.style.color = "red";
      message.textContent = "❌ Le mot de passe doit contenir au moins 8 caractères.";
      return;
    }

    try {
      const response = await fetch(`${API_URL}/inscription`, {
        method  : "POST",
        headers : { "Content-Type": "application/json" },
        body    : JSON.stringify({ nom, prenoms, role, email, mot_de_passe })
      });

      const resultat = await response.json();

      if (response.ok) {
        message.style.color = "green";
        message.textContent = "✅ Inscription réussie ! Redirection...";
        setTimeout(() => { window.location.href = "index.html"; }, 1500);
      } else {
        message.style.color = "red";
        message.textContent = "❌ " + resultat.detail;
      }
    } catch (error) {
      console.error("Erreur inscription :", error);
      message.style.color = "red";
      message.textContent = "❌ Serveur inaccessible.";
    }
  });
}

/* ════════════════════════════════════════════
   CONNEXION
   FIX : on stocke désormais aussi le token JWT
   renvoyé par /connexion, en plus des infos user.
════════════════════════════════════════════ */
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email        = document.getElementById("email")?.value.trim();
    const mot_de_passe = document.getElementById("password")?.value;
    const message      = document.getElementById("message");

    try {
      const response = await fetch(`${API_URL}/connexion`, {
        method  : "POST",
        headers : { "Content-Type": "application/json" },
        body    : JSON.stringify({ email, mot_de_passe })
      });

      const resultat = await response.json();

      if (response.ok) {
        message.style.color = "green";
        message.textContent = "✅ Connexion réussie ! Redirection...";
        localStorage.setItem("utilisateur", JSON.stringify(resultat.utilisateur));
        localStorage.setItem("token", resultat.token);
        // FIX : le rôle "directeur" est redirigé directement vers son
        // interface dédiée, jamais vers le dashboard des inspecteurs.
        const destination = resultat.utilisateur?.role === "directeur"
          ? "Administration.html" : "dashboard.html";
        setTimeout(() => { window.location.href = destination; }, 1500);
      } else {
        message.style.color = "red";
        message.textContent = "❌ " + resultat.detail;
      }
    } catch (error) {
      console.error("Erreur connexion :", error);
      message.style.color = "red";
      message.textContent = "❌ Serveur inaccessible.";
    }
  });
}

/* ════════════════════════════════════════════
   DASHBOARD — KPI
════════════════════════════════════════════ */
async function chargerDashboard() {
  const cards = document.querySelectorAll(".card .card-value");
  if (!cards.length) return;

  try {
    const [missionsRes, rapportsRes, recosRes] = await Promise.all([
      fetch(`${API_URL}/missions/`),
      fetch(`${API_URL}/rapports/`),
      fetch(`${API_URL}/recommandations/`)
    ]);

    const missions      = await missionsRes.json();
    const rapports      = await rapportsRes.json();
    const recos         = await recosRes.json();

    const total         = missions.total  || 0;
    const terminees     = (missions.missions || []).filter(m => m.statut === "Terminée").length;
    const nbRapports    = (rapports.rapports || []).length;
    const nbRecos       = recos.total || 0;

    const labels = ["Missions", "Terminées", "Rapports", "Recommandations"];
    const values = [total, terminees, nbRapports, nbRecos];

    cards.forEach((card, i) => {
      if (values[i] !== undefined) card.textContent = values[i];
    });
  } catch (error) {
    console.error("❌ Erreur dashboard :", error);
  }
}

/* ════════════════════════════════════════════
   MISSIONS — liste
════════════════════════════════════════════ */
async function chargerMissions() {
  const tbody = document.getElementById("missions-tbody");
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:#999">Chargement...</td></tr>`;

  try {
    const response = await fetch(`${API_URL}/missions/`);
    const resultat = await response.json();

    if (response.ok) afficherMissions(resultat.missions);
    else tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:red">Erreur de chargement</td></tr>`;

  } catch (error) {
    console.error("❌ Erreur missions :", error);
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:red">❌ Serveur inaccessible</td></tr>`;
  }
}

function afficherMissions(missions) {
  const tbody      = document.getElementById("missions-tbody");
  const emptyState = document.getElementById("empty-state");
  if (!tbody) return;

  if (!missions || missions.length === 0) {
    tbody.innerHTML = "";
    if (emptyState) emptyState.style.display = "block";
    return;
  }

  if (emptyState) emptyState.style.display = "none";

  const typeLabel = {
    global : "Contrôle global",
    lbcft  : "LBC/FT/FP",
    cameli : "CAMELI",
    suivi  : "Suivi reco."
  };

  tbody.innerHTML = missions.map((m, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${m.reference || m.sfd || "—"}</td>
      <td>${typeLabel[m.type_controle] || m.type_controle || "—"}</td>
      <td>${m.sfd}</td>
      <td>${m.date_mission ? new Date(m.date_mission).toLocaleDateString("fr-FR") : "—"}</td>
      <td>—</td>
      <td>
        <span class="statut-badge statut-${(m.statut || "").toLowerCase().replace(/ /g, "-")}">
          ${m.statut || "—"}
        </span>
      </td>
      <td>
        <button class="btn-icon" onclick="voirMission(${m.id})" title="Voir">
          <i class="fas fa-eye"></i>
        </button>
        <button class="btn-icon" onclick="modifierStatut(${m.id})" title="Modifier statut">
          <i class="fas fa-edit"></i>
        </button>
        <button class="btn-icon danger" onclick="supprimerMission(${m.id})" title="Supprimer">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    </tr>`).join("");
}

function filterMissions() {
  const search = document.getElementById("filter-search")?.value.toLowerCase() || "";
  const type   = document.getElementById("filter-type")?.value   || "";
  const statut = document.getElementById("filter-statut")?.value || "";

  document.querySelectorAll("#missions-tbody tr").forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = (
      text.includes(search) &&
      (type   ? text.includes(type.toLowerCase())   : true) &&
      (statut ? text.includes(statut.toLowerCase()) : true)
    ) ? "" : "none";
  });
}

/* ════════════════════════════════════════════
   MISSIONS — actions
════════════════════════════════════════════ */
function voirMission(id) {
  window.location.href = `nouvelle_mission.html?id=${id}`;
}

async function modifierStatut(id) {
  const choix   = prompt("Nouveau statut :\n1. En attente\n2. En cours\n3. Terminée");
  const statuts = { "1": "En attente", "2": "En cours", "3": "Terminée" };
  if (!statuts[choix]) return;

  try {
    const response = await fetch(`${API_URL}/missions/${id}`, {
      method  : "PUT",
      headers : { "Content-Type": "application/json" },
      body    : JSON.stringify({ statut: statuts[choix] })
    });
    if (response.ok) chargerMissions();
    else alert("❌ Erreur lors de la modification.");
  } catch { alert("❌ Serveur inaccessible."); }
}

async function supprimerMission(id) {
  const modal = document.getElementById("delete-modal");
  if (modal) modal.style.display = "flex";

  const confirmBtn = document.getElementById("confirm-delete-btn");
  if (confirmBtn) {
    confirmBtn.onclick = async () => {
      try {
        const response = await fetch(`${API_URL}/missions/${id}`, {
          method  : "DELETE",
          headers : { "Content-Type": "application/json" }
        });
        if (response.ok) { closeDeleteModal(); chargerMissions(); }
        else alert("❌ Erreur lors de la suppression.");
      } catch { alert("❌ Serveur inaccessible."); }
    };
  }
}

function closeDeleteModal() {
  const modal = document.getElementById("delete-modal");
  if (modal) modal.style.display = "none";
}

function exportMissions() {
  alert("📥 Export en cours de développement...");
}

/* ════════════════════════════════════════════
   NOTE IMPORTANTE — enregistrerMission()
   ════════════════════════════════════════════
   Cette fonction a été RETIRÉE de app.js.
   La version à utiliser reste celle de nouvelle_mission.js.
   Ne pas la redéfinir ici.
════════════════════════════════════════════ */

/* ════════════════════════════════════════════
   MISSION — soumettre / terminer
════════════════════════════════════════════ */
async function soumettreMission() {
  const id = new URLSearchParams(window.location.search).get("id");
  if (!id) {
    alert("⚠️ Enregistrez d'abord la mission avant de la soumettre.");
    return;
  }

  try {
    const response = await fetch(`${API_URL}/missions/${id}/soumettre`, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });
    const res = await response.json();
    if (response.ok) {
      showToast("Mission soumise — statut : En cours ✅");
    } else {
      alert("❌ " + res.detail);
    }
  } catch { alert("❌ Serveur inaccessible."); }
}

async function terminerMission() {
  const id = new URLSearchParams(window.location.search).get("id");
  if (!id) { alert("⚠️ Mission non enregistrée."); return; }

  try {
    const response = await fetch(`${API_URL}/missions/${id}/terminer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });
    const res = await response.json();
    if (response.ok) showToast("Mission terminée ✅");
    else alert("❌ " + res.detail);
  } catch { alert("❌ Serveur inaccessible."); }
}

/* ════════════════════════════════════════════
   RAPPORTS
════════════════════════════════════════════ */
async function chargerRapports() {
  const tbody = document.getElementById("rapports-tbody");
  if (!tbody) return;

  try {
    const response = await fetch(`${API_URL}/rapports/`);
    const resultat = await response.json();
    if (response.ok) afficherRapports(resultat.rapports);
  } catch (error) {
    console.error("❌ Erreur rapports :", error);
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:red">❌ Serveur inaccessible</td></tr>`;
  }
}

function afficherRapports(rapports) {
  const tbody = document.getElementById("rapports-tbody");
  if (!tbody) return;

  if (!rapports || rapports.length === 0) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="6"><i class="fas fa-file-alt"></i><p>Aucun rapport généré</p></td></tr>`;
    return;
  }

  const typeLabel = {
    global : "Mission globale",
    lbcft  : "LBC/FT/FP",
    cameli : "CAMELI",
    suivi  : "Suivi recommandations"
  };

  tbody.innerHTML = rapports.map(r => `
    <tr>
      <td>${r.reference || "—"}</td>
      <td>${r.mission_sfd || "—"}</td>
      <td>${typeLabel[r.type_rapport] || r.type_rapport || "—"}</td>
      <td>${r.date_generation ? new Date(r.date_generation).toLocaleDateString("fr-FR") : "—"}</td>
      <td><span class="format-badge">${(r.format || "—").toUpperCase()}</span></td>
      <td>
        <button class="btn-icon" onclick="downloadReport('${r.reference}','${r.format}')" title="Télécharger">
          <i class="fas fa-download"></i>
        </button>
        <button class="btn-icon danger" onclick="supprimerRapport(${r.id})" title="Supprimer">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    </tr>`).join("");
}

function downloadReport(reference, format) {
  window.open(`${API_URL}/static/reports/${reference}.${format}`, "_blank");
}

async function chargerMissionsPourRapport() {
  const select = document.getElementById("mission-select");
  if (!select) return;

  try {
    const response = await fetch(`${API_URL}/missions/`);
    const resultat = await response.json();
    if (response.ok) {
      select.innerHTML = `<option value="">-- Sélectionner --</option>` +
        (resultat.missions || []).map(m =>
          `<option value="${m.id}">${m.reference || m.sfd} — ${m.sfd}</option>`
        ).join("");
    }
  } catch (error) {
    console.error("❌ Erreur missions rapport :", error);
  }
}

function selectType(card) {
  document.querySelectorAll(".report-type-card").forEach(c => c.classList.remove("selected"));
  card.classList.add("selected");
}

async function genererRapport() {
  const mission_id   = document.getElementById("mission-select")?.value;
  const format       = document.getElementById("format-select")?.value;
  const langue       = document.getElementById("langue-select")?.value || "fr";
  const selectedCard = document.querySelector(".report-type-card.selected");

  const typeMap = {
    "Mission globale"       : "global",
    "Suivi recommandations" : "suivi",
    "LBC/FT/FP"             : "lbcft",
    "Rapport CAMELI"        : "cameli"
  };

  const type_rapport = selectedCard
    ? typeMap[selectedCard.querySelector(".rt-name")?.textContent.trim()]
    : null;

  if (!mission_id)   { alert("⚠️ Veuillez sélectionner une mission.");         return; }
  if (!type_rapport) { alert("⚠️ Veuillez sélectionner un type de rapport.");  return; }
  if (!format)       { alert("⚠️ Veuillez sélectionner un format.");           return; }

  const btn = document.querySelector(".btn-primary[onclick='genererRapport()'], .btn-primary");
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Génération...'; }

  try {
    const response = await fetch(`${API_URL}/rapports/`, {
      method  : "POST",
      headers : { "Content-Type": "application/json" },
      body    : JSON.stringify({ mission_id: parseInt(mission_id), type_rapport, format, langue })
    });

    const resultat = await response.json();

    if (response.ok) {
      alert("✅ Rapport généré avec succès !\nRéférence : " + resultat.rapport.reference);
      chargerRapports();
    } else {
      alert("❌ " + resultat.detail);
    }
  } catch (error) {
    console.error("❌ Erreur génération rapport :", error);
    alert("❌ Serveur inaccessible.");
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-magic"></i> Générer'; }
  }
}

async function supprimerRapport(id) {
  if (!confirm("Supprimer ce rapport ?")) return;
  try {
    await fetch(`${API_URL}/rapports/${id}`, {
      method  : "DELETE",
      headers : { "Content-Type": "application/json" }
    });
    chargerRapports();
  } catch { alert("❌ Erreur lors de la suppression."); }
}

/* ════════════════════════════════════════════
   RECOMMANDATIONS
════════════════════════════════════════════ */
const statutClass = {
  "Appliquée"     : "statut-terminee",
  "En cours"      : "statut-en-cours",
  "Non respectée" : "statut-non-respectee",
  "En attente"    : "statut-en-attente"
};

async function chargerRecommandations() {
  const tbody = document.getElementById("recos-tbody");
  if (!tbody) return;

  try {
    const response = await fetch(`${API_URL}/recommandations/`);
    const resultat = await response.json();

    if (response.ok) {
      const kpiTotal = document.getElementById("kpi-total");
      const kpiApp   = document.getElementById("kpi-appliquees");
      const kpiEc    = document.getElementById("kpi-encours");
      const kpiNon   = document.getElementById("kpi-non");

      if (kpiTotal) kpiTotal.textContent = resultat.total          || 0;
      if (kpiApp)   kpiApp.textContent   = resultat.appliquees     || 0;
      if (kpiEc)    kpiEc.textContent    = resultat.en_cours       || 0;
      if (kpiNon)   kpiNon.textContent   = resultat.non_respectees || 0;

      afficherRecommandations(resultat.recommandations || []);
    }
  } catch (error) {
    console.error("❌ Erreur recommandations :", error);
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:red">❌ Serveur inaccessible</td></tr>`;
  }
}

function afficherRecommandations(recos) {
  const tbody = document.getElementById("recos-tbody");
  if (!tbody) return;

  if (!recos || recos.length === 0) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="7"><i class="fas fa-lightbulb"></i><p>Aucune recommandation</p></td></tr>`;
    return;
  }

  tbody.innerHTML = recos.map((r, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${r.description}</td>
      <td>${r.mission_sfd || r.mission_reference || "—"}</td>
      <td>${r.responsable || "—"}</td>
      <td>${r.delai ? new Date(r.delai).toLocaleDateString("fr-FR") : "—"}</td>
      <td><span class="statut-badge ${statutClass[r.statut] || ""}">${r.statut}</span></td>
      <td>
        <button class="btn-icon" onclick="modifierStatutReco(${r.id})" title="Modifier">
          <i class="fas fa-edit"></i>
        </button>
        ${r.fichier_url ? `
        <a class="btn-icon" href="${r.fichier_url}" download title="Télécharger" target="_blank">
          <i class="fas fa-file-word" style="color:#2b579a"></i>
        </a>` : ""}
        <button class="btn-icon danger" onclick="supprimerReco(${r.id})" title="Supprimer">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    </tr>`).join("");
}

function filterRecos() {
  const search = document.getElementById("filter-search")?.value.toLowerCase() || "";
  const statut = document.getElementById("filter-statut")?.value || "";

  document.querySelectorAll("#recos-tbody tr").forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = (
      text.includes(search) &&
      (statut ? text.includes(statut.toLowerCase()) : true)
    ) ? "" : "none";
  });
}

async function modifierStatutReco(id) {
  const choix   = prompt("Nouveau statut :\n1. En attente\n2. En cours\n3. Appliquée\n4. Non respectée");
  const statuts = { "1": "En attente", "2": "En cours", "3": "Appliquée", "4": "Non respectée" };
  if (!statuts[choix]) return;

  try {
    await fetch(`${API_URL}/recommandations/${id}`, {
      method  : "PUT",
      headers : { "Content-Type": "application/json" },
      body    : JSON.stringify({ statut: statuts[choix] })
    });
    chargerRecommandations();
  } catch { alert("❌ Erreur lors de la modification."); }
}

async function supprimerReco(id) {
  if (!confirm("Supprimer cette recommandation ?")) return;
  try {
    await fetch(`${API_URL}/recommandations/${id}`, {
      method  : "DELETE",
      headers : { "Content-Type": "application/json" }
    });
    chargerRecommandations();
  } catch { alert("❌ Erreur lors de la suppression."); }
}

/* ════════════════════════════════════════════
   TOAST
════════════════════════════════════════════ */
function showToast(msg) {
  const t = document.getElementById("toast");
  if (!t) return;
  document.getElementById("toast-msg").textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2800);
}

/* ════════════════════════════════════════════
   INITIALISATION
════════════════════════════════════════════ */
document.addEventListener("DOMContentLoaded", () => {
  afficherUtilisateur();

  if (document.getElementById("missions-tbody"))    chargerMissions();
  if (document.getElementById("rapports-tbody"))    { chargerRapports(); chargerMissionsPourRapport(); }
  if (document.getElementById("recos-tbody"))       chargerRecommandations();
  if (document.querySelector(".card .card-value"))  chargerDashboard();
});