// js/rapport.js

async function loadMissionsForReport() {
    const select = document.getElementById("mission-select");
    if (!select) return;

    try {
        const res = await fetch(`${API_URL}/missions/`);
        const data = await res.json();
        select.innerHTML = `<option value="">-- Sélectionner une mission --</option>`;
        (data.missions || []).forEach(m => {
            const opt = document.createElement("option");
            opt.value = m.id;
            opt.textContent = `${m.reference || 'Sans ref'} — ${m.sfd}`;
            select.appendChild(opt);
        });
    } catch (e) { console.error(e); }
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
        : "global";

    if (!missionId) { alert("⚠️ Veuillez sélectionner une mission.");        return; }
    if (!format)    { alert("⚠️ Veuillez sélectionner un format.");          return; }

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