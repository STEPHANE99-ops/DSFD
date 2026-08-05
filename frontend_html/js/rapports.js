// js/rapport.js

// Libellés des types de contrôle / rapport
const TYPE_RAPPORT_LABELS = {
    global : "Mission globale",
    suivi  : "Suivi recommandations",
    lbcft  : "LBC/FT/FP",
    cameli : "Rapport CAMELI",
};

// Type de rapport actuellement sélectionné (carte), ou null si aucune carte
function typeRapportSelectionne() {
    const selectedCard = document.querySelector(".report-type-card.selected");
    if (!selectedCard) return null;
    const typeMap = {
        "Mission globale"       : "global",
        "Suivi recommandations" : "suivi",
        "LBC/FT/FP"             : "lbcft",
        "Rapport CAMELI"        : "cameli"
    };
    return typeMap[selectedCard.querySelector(".rt-name")?.textContent.trim()] || "global";
}

async function loadMissionsForReport() {
    const select = document.getElementById("mission-select");
    if (!select) return;

    try {
        const res = await fetch(`${API_URL}/missions/`);
        const data = await res.json();
        // FIX : mémoriser la liste complète pour pouvoir filtrer par type
        window._missionsRapport = data.missions || [];
        filtrerMissionsSelonType();
    } catch (e) { console.error(e); }
}

// FIX : le menu "Mission concernée" n'affiche que les missions dont le
// type de contrôle correspond à la carte sélectionnée. Une mission de
// type "Contrôle global" ne peut donner qu'un rapport global, etc.
function filtrerMissionsSelonType() {
    const select = document.getElementById("mission-select");
    if (!select) return;

    const type = typeRapportSelectionne();
    const valeurActuelle = select.value;

    const missions = (window._missionsRapport || []).filter(m => {
        if (!type) return true; // aucune carte sélectionnée → tout afficher
        return (m.type_controle || "global") === type;
    });

    select.innerHTML = `<option value="">-- Sélectionner une mission --</option>`;
    missions.forEach(m => {
        const opt = document.createElement("option");
        opt.value = m.id;
        opt.textContent = `${m.reference || 'Sans ref'} — ${m.sfd}`;
        select.appendChild(opt);
    });

    // Conserver la sélection si elle est toujours compatible
    if (missions.some(m => String(m.id) === String(valeurActuelle))) {
        select.value = valeurActuelle;
    }
}

// FIX : redéfinit selectType (chargé après app.js, donc prioritaire)
// pour refiltrer les missions à chaque changement de carte.
function selectType(card) {
    document.querySelectorAll(".report-type-card").forEach(c => c.classList.remove("selected"));
    card.classList.add("selected");
    filtrerMissionsSelonType();
}

async function genererRapport() {
    const missionId = document.getElementById("mission-select")?.value;
    const format    = document.getElementById("format-select")?.value;
    const langue    = document.getElementById("langue-select")?.value || "fr";

    // Type de rapport sélectionné
    const selectedCard = document.querySelector(".report-type-card.selected");
    const typeMap = {
        "Mission globale"       : "global",
        "Suivi recommandations" : "suivi",
        "LBC/FT/FP"             : "lbcft",
        "Rapport CAMELI"        : "cameli"
    };
    const type_rapport = selectedCard
        ? typeMap[selectedCard.querySelector(".rt-name")?.textContent.trim()] || "global"
        : null;

    if (!type_rapport) { alert("⚠️ Veuillez sélectionner un type de rapport."); return; }
    if (!missionId)    { alert("⚠️ Veuillez sélectionner une mission.");        return; }
    if (!format)       { alert("⚠️ Veuillez sélectionner un format.");          return; }

    // FIX : le type de rapport doit correspondre au type de contrôle de la mission
    const mission = (window._missionsRapport || []).find(m => String(m.id) === String(missionId));
    const typeMission = mission ? (mission.type_controle || "global") : null;
    if (typeMission && typeMission !== type_rapport) {
        alert(`❌ Cette mission est de type « ${TYPE_RAPPORT_LABELS[typeMission] || typeMission} ».\nVous ne pouvez générer que ce type de rapport pour cette mission.`);
        return;
    }

    const btn = document.querySelector(".btn-primary");
    const originalText = btn?.innerHTML;
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Génération...'; }

    try {
        const res = await fetch(`${API_URL}/rapports/`, {
            method : "POST",
            headers: { "Content-Type": "application/json" },
            body   : JSON.stringify({
                mission_id:   parseInt(missionId),
                type_rapport: type_rapport,
                format:       format,
                langue:       langue
            })
        });

        const data = await res.json();

        if (res.ok) {
            alert(`✅ Rapport généré !\nRéférence : ${data.rapport.reference}`);
            loadRapports();
        } else {
            alert("❌ " + (data.detail || "Erreur lors de la génération"));
        }
    } catch (e) {
        console.error(e);
        alert("❌ Erreur de connexion au serveur");
    } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = originalText; }
    }
}

async function loadRapports() {
    const tbody = document.getElementById("rapports-tbody");
    if (!tbody) return;

    try {
        const res  = await fetch(`${API_URL}/rapports/`);
        const data = await res.json();

        tbody.innerHTML = "";

        if (!data.rapports || data.rapports.length === 0) {
            tbody.innerHTML = `<tr class="empty-row"><td colspan="6"><i class="fas fa-file-alt"></i><p>Aucun rapport généré</p></td></tr>`;
            return;
        }

        data.rapports.forEach(r => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><strong>${r.reference || "—"}</strong></td>
                <td>${r.mission_sfd || "—"}</td>
                <td>${r.type_rapport || "global"}</td>
                <td>${r.date_generation ? new Date(r.date_generation).toLocaleDateString("fr-FR") : "—"}</td>
                <td><span class="format-badge">${(r.format || "").toUpperCase()}</span></td>
                <td>
                   <td>
                      ${r.fichier_url ? `
                           <button class="btn-icon" onclick="telechargerRapport('${r.fichier_url}', '${r.reference}.${r.format}')" title="Télécharger">
                            <i class="fas fa-download"></i>
                           </button>` : "—"}
                      ${r.fichier_url && (!r.statut_validation || r.statut_validation === 'brouillon') ? `
                          <button class="btn-icon" onclick="soumettreValidation(${r.id}, '${r.reference}')" title="Soumettre pour validation" style="color:#F97316">
                         <i class="fas fa-paper-plane"></i>
                         </button>` : ''}
                         
                              </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) {
        console.error(e);
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:red">❌ Erreur de chargement</td></tr>`;
    }
}

async function soumettreValidation(rapportId, reference) {
  const email = prompt(`Soumettre "${reference}" pour validation.\n\nEmail du Chef de mission :`);
  if (!email) return;

  try {
    const res = await fetch(`${API_URL}/validations/soumettre`, {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify({
        rapport_id:       rapportId,
        validateur_nom:   email, // on utilise l'email comme nom par défaut
        validateur_email: email,
      })
    });
    const data = await res.json();
    if (res.ok) {
      alert('✅ ' + data.message);
      loadRapports();
    } else {
      alert('❌ ' + data.detail);
    }
  } catch {
    alert('❌ Serveur inaccessible');
  }
}

async function telechargerRapport(url, filename) {
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('Erreur');
        const blob = await res.blob();
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
    } catch (e) {
        // Fallback — téléchargement direct
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
}