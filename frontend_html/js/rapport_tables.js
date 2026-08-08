/* ================================================
   DSFD — rapport_tables.js
   Formulaires pour les tables restantes du canevas
   Tables 2, 3, 14, 25 + textes narratifs
   À inclure dans nouvelle_mission.html avant app.js
   ================================================ */

/* ════════════════════════════════════════════
   TABLE 2 — Infos générales du SFD
   À afficher dans la section "Infos générales"
   de nouvelle_mission.html
════════════════════════════════════════════ */
function buildInfosGeneralesSFD() {
  return `
    <div class="sub-title" style="margin-top:28px">
      <i class="fas fa-building"></i> Informations générales du SFD
      <span style="font-size:11px;color:var(--text-muted);font-weight:400;margin-left:8px">(Table 2 du rapport)</span>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px">
      <div class="form-group-full">
        <label>Date de constitution (AG constitutive)</label>
        <input type="date" id="sfd-date-constitution"/>
      </div>
      <div class="form-group-full">
        <label>Date d'immatriculation au RCCM</label>
        <input type="date" id="sfd-date-rccm"/>
      </div>
      <div class="form-group-full">
        <label>Numéro RCCM</label>
        <input type="text" id="sfd-num-rccm" placeholder="Ex : CI-ABJ-2020-B-12345"/>
      </div>
      <div class="form-group-full">
        <label>Date d'agrément</label>
        <input type="date" id="sfd-date-agrement"/>
      </div>
      <div class="form-group-full">
        <label>Numéro d'agrément</label>
        <input type="text" id="sfd-num-agrement" placeholder="Ex : 2020-001/MEFP/DGTCP"/>
      </div>
      <div class="form-group-full">
        <label>Situation géographique</label>
        <input type="text" id="sfd-situation-geo" placeholder="Ex : Abidjan, Cocody"/>
      </div>
      <div class="form-group-full">
        <label>Date de démarrage des activités</label>
        <input type="date" id="sfd-date-demarrage"/>
      </div>
      <div class="form-group-full">
        <label>Adresse</label>
        <input type="text" id="sfd-adresse" placeholder="Ex : 01 BP 1234 Abidjan 01"/>
      </div>
      <div class="form-group-full">
        <label>Contacts (téléphone / email)</label>
        <input type="text" id="sfd-contacts" placeholder="Ex : +225 27 XX XX XX XX"/>
      </div>
      <div class="form-group-full">
        <label>Nombre de points de service</label>
        <input type="number" id="sfd-nb-points" placeholder="0" min="0"/>
      </div>
    </div>
    <div class="form-group-full" style="margin-top:10px">
      <label>Activités du SFD</label>
      <textarea id="sfd-activites" rows="2" placeholder="Ex : Collecte de l'épargne, octroi de crédits aux membres…"></textarea>
    </div>
    <div class="form-group-full" style="margin-top:10px">
      <label>Évolution institutionnelle</label>
      <textarea id="sfd-evaluation-institutionnelle" rows="3" placeholder="Ex : Appréciation générale du fonctionnement institutionnel du SFD…"></textarea>
    </div>
  `;
}

/* ════════════════════════════════════════════
   TABLE 3 — Membres des organes (CA, CC, CS)
   À afficher dans le volet Gouvernance
════════════════════════════════════════════ */
function buildMembresOrganes() {
  function buildOrganeTable(organeId, orgnaNom) {
    return `
      <div class="sub-title" style="margin-top:20px">
        <i class="fas fa-users"></i> ${orgnaNom}
      </div>
      <div style="overflow-x:auto">
        <table class="dyn-table" id="tbl-${organeId}">
          <thead>
            <tr>
              <th style="width:40px">N°</th>
              <th>Nom et prénoms</th>
              <th>Fonction / Qualité</th>
              <th style="width:120px">Début mandat</th>
              <th style="width:120px">Fin mandat</th>
              <th>Profession</th>
              <th style="width:130px">Contact</th>
            </tr>
          </thead>
          <tbody id="tbody-${organeId}">
            ${[1,2,3,4,5].map(n => `
            <tr>
              <td style="text-align:center">${n}</td>
              <td><input type="text" placeholder="Nom…" style="width:100%"/></td>
              <td>
                <select style="width:100%;padding:10px 8px;border:1.5px solid var(--border);border-radius:var(--radius-xs);font-family:'Nunito',sans-serif;font-size:13px;color:var(--text-dark)">
                  <option value="" disabled selected style="color:var(--text-muted)">Fonction…</option>
                  <option value="PCA">PCA</option>
                  <option value="SG">SG</option>
                  <option value="Vice president">Vice président</option>
                  <option value="Membre">Membre</option>
                </select>
              </td>
              <td><input type="date" style="width:100%"/></td>
              <td><input type="date" style="width:100%"/></td>
              <td><input type="text" placeholder="Profession…" style="width:100%"/></td>
              <td><input type="text" placeholder="+225…" style="width:100%"/></td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
      <button class="add-btn" onclick="ajouterMembreOrgane('tbody-${organeId}')">
        <i class="fas fa-plus"></i> Ajouter un membre
      </button>
    `;
  }

  return `
    <div class="sub-title" style="margin-top:28px">
      <i class="fas fa-sitemap"></i> Composition des organes de gouvernance
      <span style="font-size:11px;color:var(--text-muted);font-weight:400;margin-left:8px">(Tables 3, 11, 12, 13 du rapport)</span>
    </div>
    ${buildOrganeTable('ca', 'Conseil d\'Administration (CA)')}
    ${buildOrganeTable('cc', 'Comité de Crédit (CC)')}
    ${buildOrganeTable('cs', 'Conseil de Surveillance (CS)')}
  `;
}

function ajouterMembreOrgane(tbodyId) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;
  const n = tbody.rows.length + 1;
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td style="text-align:center">${n}</td>
    <td><input type="text" placeholder="Nom…" style="width:100%"/></td>
    <td>
      <select style="width:100%;padding:10px 8px;border:1.5px solid var(--border);border-radius:var(--radius-xs);font-family:'Nunito',sans-serif;font-size:13px;color:var(--text-dark)">
        <option value="" disabled selected style="color:var(--text-muted)">Fonction…</option>
        <option value="PCA">PCA</option>
        <option value="SG">SG</option>
        <option value="Vice president">Vice président</option>
        <option value="Membre">Membre</option>
      </select>
    </td>
    <td><input type="date" style="width:100%"/></td>
    <td><input type="date" style="width:100%"/></td>
    <td><input type="text" placeholder="Profession…" style="width:100%"/></td>
    <td><input type="text" placeholder="+225…" style="width:100%"/></td>
  `;
  tbody.appendChild(tr);
}

/* ════════════════════════════════════════════
   TABLE 14 — Réunions des organes
════════════════════════════════════════════ */
function buildReunionsOrganes() {
  return `
    <div class="sub-title" style="margin-top:28px">
      <i class="fas fa-calendar-check"></i> Fonctionnement des organes — Réunions
      <span style="font-size:11px;color:var(--text-muted);font-weight:400;margin-left:8px">(Table 14 du rapport)</span>
    </div>
    <p style="font-size:12px;color:var(--text-muted);margin-bottom:10px">
      Nombre de réunions tenues par organe et par période. Une période peut être une année complète, un semestre ou un trimestre (ex : « 2024 », « 2024 - S1 », « T1 2025 »).
    </p>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:10px;margin-bottom:10px">
      <div class="form-group-full"><label>Période 1</label><input type="text" id="reunion-annee1" placeholder="Ex : 2024 ou T1 2024" oninput="syncPeriodes(1, this.value)"/></div>
      <div class="form-group-full"><label>Période 2</label><input type="text" id="reunion-annee2" placeholder="Ex : 2024 - S1" oninput="syncPeriodes(2, this.value)"/></div>
      <div class="form-group-full"><label>Période 3</label><input type="text" id="reunion-annee3" placeholder="Ex : 2025" oninput="syncPeriodes(3, this.value)"/></div>
      <div class="form-group-full"><label>Période 4 <span style="font-weight:400;color:var(--text-muted)">(facultatif)</span></label><input type="text" id="reunion-annee4" placeholder="Optionnel" oninput="syncPeriodes(4, this.value)"/></div>
    </div>
    <div style="overflow-x:auto">
      <table class="dyn-table" id="tbl-reunions">
        <thead>
          <tr>
            <th>Organe</th>
            <th style="width:100px">Période 1</th>
            <th style="width:100px">Période 2</th>
            <th style="width:100px">Période 3</th>
            <th style="width:100px">Période 4</th>
            <th style="width:80px">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          ${['Assemblée Générale','Conseil d\'Administration','Comité de Crédit','Conseil de Surveillance'].map((org, i) => `
          <tr>
            <td style="font-weight:600">${org}</td>
            <td><input type="number" id="reunion-${i}-a1" placeholder="0" min="0" style="width:100%;text-align:center" oninput="calcTotalReunions(${i})"/></td>
            <td><input type="number" id="reunion-${i}-a2" placeholder="0" min="0" style="width:100%;text-align:center" oninput="calcTotalReunions(${i})"/></td>
            <td><input type="number" id="reunion-${i}-a3" placeholder="0" min="0" style="width:100%;text-align:center" oninput="calcTotalReunions(${i})"/></td>
            <td><input type="number" id="reunion-${i}-a4" placeholder="0" min="0" style="width:100%;text-align:center" oninput="calcTotalReunions(${i})"/></td>
            <td><input type="number" id="reunion-${i}-total" readonly style="width:100%;text-align:center;font-weight:700"/></td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function syncPeriodes(index, value) {
  const reunionEl = document.getElementById(`reunion-annee${index}`);
  const ratioEl = document.getElementById(`ratio-p${index}`);
  if (reunionEl && reunionEl.value !== value) reunionEl.value = value;
  if (ratioEl && ratioEl.value !== value) ratioEl.value = value;
}

function calcTotalReunions(i) {
  const a1 = parseInt(document.getElementById(`reunion-${i}-a1`)?.value || 0) || 0;
  const a2 = parseInt(document.getElementById(`reunion-${i}-a2`)?.value || 0) || 0;
  const a3 = parseInt(document.getElementById(`reunion-${i}-a3`)?.value || 0) || 0;
  const a4 = parseInt(document.getElementById(`reunion-${i}-a4`)?.value || 0) || 0;
  const totalEl = document.getElementById(`reunion-${i}-total`);
  if (totalEl) totalEl.value = a1 + a2 + a3 + a4;
}

/* ════════════════════════════════════════════
   TABLE 25 — Ratios prudentiels BCEAO
════════════════════════════════════════════ */
const RATIOS_BCEAO = [
  { num: 1, libelle: 'Limitation des opérations autres que les activités d\'épargne et de crédits', norme: '< 5%' },
  { num: 2, libelle: 'Réserve générale', norme: '≥ 15%' },
  { num: 3, libelle: 'Limitation des risques portés par une institution', norme: '< 200%' },
  { num: 4, libelle: 'Limitation des prêts aux dirigeants, au personnel ainsi qu\'aux personnes liées', norme: '< 10%' },
  { num: 5, libelle: 'Limitation des risques pris sur une seule signature', norme: '< 10%' },
  { num: 6, libelle: 'Couverture des emplois à moyen et long termes par des ressources stables', norme: '> 100%' },
  { num: 7, libelle: 'Norme de liquidité', norme: '> 100%' },
  { num: 8, libelle: 'Capitalisation', norme: '> 15%' },
  { num: 9, libelle: 'Limitation de prise de participation', norme: '< 25%' },
  { num: 10, libelle: 'Financement des immobilisations et des participations', norme: '< 100%' },
];

function buildRatiosPrudentiels() {
  return `
    <div class="sub-title" style="margin-top:28px">
      <i class="fas fa-balance-scale"></i> Ratios prudentiels BCEAO
      <span style="font-size:11px;color:var(--text-muted);font-weight:400;margin-left:8px">(Table 25 du rapport)</span>
    </div>
    <p style="font-size:12px;color:var(--text-muted);margin-bottom:10px">
      Saisissez les valeurs calculées pour les périodes contrôlées (la période 4 est facultative) et les observations. Ces périodes sont partagées avec le tableau des réunions ci-dessus.
    </p>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:10px;margin-bottom:10px">
      <div class="form-group-full"><label>Période 1</label><input type="text" id="ratio-p1" placeholder="Ex : 31/12/2022" oninput="syncPeriodes(1, this.value)"/></div>
      <div class="form-group-full"><label>Période 2</label><input type="text" id="ratio-p2" placeholder="Ex : 31/12/2023" oninput="syncPeriodes(2, this.value)"/></div>
      <div class="form-group-full"><label>Période 3</label><input type="text" id="ratio-p3" placeholder="Ex : 31/12/2024" oninput="syncPeriodes(3, this.value)"/></div>
      <div class="form-group-full"><label>Période 4 <span style="font-weight:400;color:var(--text-muted)">(facultatif)</span></label><input type="text" id="ratio-p4" placeholder="Optionnel" oninput="syncPeriodes(4, this.value)"/></div>
    </div>
    <div style="overflow-x:auto">
      <table class="dyn-table" id="tbl-ratios">
        <thead>
          <tr>
            <th style="width:40px">N°</th>
            <th>Libellé du ratio</th>
            <th style="width:80px">Norme</th>
            <th style="width:100px">Période 1</th>
            <th style="width:100px">Période 2</th>
            <th style="width:100px">Période 3</th>
            <th style="width:100px">Période 4</th>
            <th>Observation</th>
          </tr>
        </thead>
        <tbody>
          ${RATIOS_BCEAO.map(r => `
          <tr>
            <td style="text-align:center;font-weight:700">${r.num}</td>
            <td style="font-size:12px">${r.libelle}</td>
            <td style="text-align:center;font-weight:700;color:#1D4ED8">${r.norme}</td>
            <td><input type="text" id="ratio-${r.num}-p1" placeholder="—" style="width:100%;text-align:center" oninput="checkRatioConformite(${r.num})"/></td>
            <td><input type="text" id="ratio-${r.num}-p2" placeholder="—" style="width:100%;text-align:center" oninput="checkRatioConformite(${r.num})"/></td>
            <td><input type="text" id="ratio-${r.num}-p3" placeholder="—" style="width:100%;text-align:center" oninput="checkRatioConformite(${r.num})"/></td>
            <td><input type="text" id="ratio-${r.num}-p4" placeholder="—" style="width:100%;text-align:center" oninput="checkRatioConformite(${r.num})"/></td>
            <td><input type="text" id="ratio-${r.num}-obs" placeholder="Observation…" style="width:100%"/></td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function evaluerConformite(valeur, norme) {
  if (valeur === undefined || valeur === null || String(valeur).trim() === '') return null;
  const val = parseFloat(String(valeur).replace(',', '.').replace('%', '').trim());
  if (isNaN(val)) return null;
  const match = String(norme).match(/([<>≤≥])\s*([\d.,]+)/);
  if (!match) return null;
  const op = match[1];
  const seuil = parseFloat(match[2].replace(',', '.'));
  switch (op) {
    case '<': return val < seuil;
    case '>': return val > seuil;
    case '≤': return val <= seuil;
    case '≥': return val >= seuil;
    default: return null;
  }
}

function checkRatioConformite(num) {
  const ratio = RATIOS_BCEAO.find(r => r.num === num);
  if (!ratio) return;

  let auMoinsUneValeur = false;
  let toutesRespectees = true;

  ['p1', 'p2', 'p3', 'p4'].forEach(p => {
    const el = document.getElementById(`ratio-${num}-${p}`);
    if (!el) return;
    const conforme = evaluerConformite(el.value, ratio.norme);
    if (conforme === null) {
      el.style.background = '';
      el.style.color = '';
      el.style.fontWeight = '';
    } else {
      auMoinsUneValeur = true;
      if (conforme) {
        el.style.background = '#F0FDF4';
        el.style.color = '#16A34A';
      } else {
        el.style.background = '#FEF2F2';
        el.style.color = '#DC2626';
        toutesRespectees = false;
      }
      el.style.fontWeight = '700';
    }
  });

  const obsEl = document.getElementById(`ratio-${num}-obs`);
  if (obsEl) {
    if (auMoinsUneValeur) {
      obsEl.value = toutesRespectees ? 'Respecté' : 'Non respecté';
      obsEl.style.color = toutesRespectees ? '#16A34A' : '#DC2626';
      obsEl.style.fontWeight = '700';
    } else {
      obsEl.value = '';
      obsEl.style.color = '';
      obsEl.style.fontWeight = '';
    }
  }
}

/* ════════════════════════════════════════════
   TEXTES NARRATIFS DES SECTIONS
   Champs libres pour le rédactionnel du rapport
════════════════════════════════════════════ */
function buildTextesNarratifs() {
  const sections = [
    { id: 'narr-gouvernance', titre: 'Gouvernance', icon: 'fa-university' },
    { id: 'narr-ci', titre: 'Contrôle interne et plan d\'affaires', icon: 'fa-search' },
    { id: 'narr-lbcft', titre: 'Dispositif LBC/FT/FP', icon: 'fa-hand-fist' },
    { id: 'narr-rh', titre: 'Gestion des ressources humaines', icon: 'fa-users' },
    { id: 'narr-epargne', titre: 'Gestion de l\'épargne', icon: 'fa-piggy-bank' },
    { id: 'narr-credit', titre: 'Gestion du crédit', icon: 'fa-hand-holding-usd' },
    { id: 'narr-compta', titre: 'Situation comptable et financière', icon: 'fa-calculator' },
    { id: 'narr-si', titre: 'Système informatique et sécurité', icon: 'fa-server' },
  ];

  return `
    <div class="sub-title" style="margin-top:28px">
      <i class="fas fa-file-alt"></i> Textes narratifs du rapport
      <span style="font-size:11px;color:var(--text-muted);font-weight:400;margin-left:8px">(Rédactionnel par section)</span>
    </div>
    <p style="font-size:12px;color:var(--text-muted);margin-bottom:16px">
      Ces textes seront intégrés directement dans le corps du rapport sous chaque section.
    </p>
    ${sections.map(s => `
    <div style="margin-bottom:16px">
      <label style="font-size:13px;font-weight:700;color:#334155;display:flex;align-items:center;gap:8px;margin-bottom:6px">
        <i class="fas ${s.icon}" style="color:#F97316"></i> ${s.titre}
      </label>
      <textarea id="${s.id}" rows="4"
        placeholder="Rédigez ici la synthèse narrative de la section ${s.titre} qui sera intégrée dans le rapport final…"
        style="width:100%;padding:10px;border:1.5px solid var(--border);border-radius:8px;font-size:13px;resize:vertical;line-height:1.6"></textarea>
    </div>`).join('')}
  `;
}

/* ════════════════════════════════════════════
   TABLE 4 — Suivi des recommandations de la
   précédente mission — CHEF DE MISSION (page principale)
════════════════════════════════════════════ */
function buildSuiviRecommandationsPrecedentes() {
  return `
    <div class="sub-title" style="margin-top:20px">
      <i class="fas fa-clipboard-check"></i> Suivi des recommandations de la précédente mission
      <span style="font-size:11px;color:var(--text-muted);font-weight:400;margin-left:8px">(Table 4 du rapport — le cas échéant)</span>
    </div>
    <div style="overflow-x:auto">
      <table class="dyn-table" id="tbl-suivi-recomm-prec">
        <thead>
          <tr>
            <th style="width:50px">N°</th>
            <th>Recommandations</th>
            <th style="width:140px">Statut</th>
            <th>Observations</th>
          </tr>
        </thead>
        <tbody id="tbody-suivi-recomm-prec">
          ${[1,2,3,4,5].map(n => `
          <tr>
            <td style="text-align:center">${String(n).padStart(2,'0')}</td>
            <td><input type="text" placeholder="Recommandation…" style="width:100%"/></td>
            <td>
              <select style="width:100%;padding:8px;border:1.5px solid var(--border);border-radius:6px;font-family:'Nunito',sans-serif;font-size:13px">
                <option value="" disabled selected>Statut…</option>
                <option value="Mise en oeuvre">Mise en œuvre</option>
                <option value="Non mise en oeuvre">Non mise en œuvre</option>
                <option value="Partielle">Mise en œuvre partielle</option>
              </select>
            </td>
            <td><input type="text" placeholder="Observations…" style="width:100%"/></td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
    <button class="add-btn" onclick="ajouterLigneRecommPrec()"><i class="fas fa-plus"></i> Ajouter une ligne</button>
  `;
}

function ajouterLigneRecommPrec() {
  const tbody = document.getElementById('tbody-suivi-recomm-prec');
  if (!tbody) return;
  const n = tbody.rows.length + 1;
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td style="text-align:center">${String(n).padStart(2,'0')}</td>
    <td><input type="text" placeholder="Recommandation…" style="width:100%"/></td>
    <td>
      <select style="width:100%;padding:8px;border:1.5px solid var(--border);border-radius:6px;font-family:'Nunito',sans-serif;font-size:13px">
        <option value="" disabled selected>Statut…</option>
        <option value="Mise en oeuvre">Mise en œuvre</option>
        <option value="Non mise en oeuvre">Non mise en œuvre</option>
        <option value="Partielle">Mise en œuvre partielle</option>
      </select>
    </td>
    <td><input type="text" placeholder="Observations…" style="width:100%"/></td>
  `;
  tbody.appendChild(tr);
}

/* ════════════════════════════════════════════
   3.2.1 — Principaux indicateurs d'activités
   CHEF DE MISSION (page principale)
════════════════════════════════════════════ */
const RUBRIQUES_INDICATEURS = [
  "Nombre de membres", "Trésorerie", "Capital social (en F CFA)",
  "Encours des dépôts (en F CFA)", "Dépôt moyen par membre (en F CFA)",
  "Nombre de crédits octroyés", "Production de prêts (en F CFA)",
  "Charges d'exploitation (en F CFA)", "Encours des crédits (en F CFA)",
  "Crédits sains (en F CFA)", "Créances en souffrance (en F CFA)",
  "Montant des irrécouvrables à déclasser (en F CFA)",
  "Taux de créances en souffrance (%)", "Taux de perte sur créances (%)",
  "Taux de transformation (%)", "Résultat net (en F CFA)",
  "Fonds propres (en F CFA)", "Immobilisations (en F CFA)",
  "Actif total (en F CFA)", "Nombre d'agents",
];

function buildIndicateursActivites() {
  return `
    <div class="sub-title" style="margin-top:20px">
      <i class="fas fa-chart-line"></i> Principaux indicateurs d'activités
      <span style="font-size:11px;color:var(--text-muted);font-weight:400;margin-left:8px">(Table du rapport — 3.2.1)</span>
    </div>
    <div style="overflow-x:auto">
      <table class="dyn-table" id="tbl-indicateurs">
        <thead>
          <tr>
            <th>Rubriques</th>
            <th style="width:110px">Période 1</th>
            <th style="width:110px">Période 2</th>
            <th style="width:110px">Période 3</th>
            <th style="width:110px">Période 4</th>
            <th style="width:100px">Variation (%)</th>
          </tr>
        </thead>
        <tbody>
          ${RUBRIQUES_INDICATEURS.map((r, i) => `
          <tr>
            <td style="font-size:12.5px">${r}</td>
            <td><input type="text" id="indic-${i}-p1" style="width:100%;text-align:center"/></td>
            <td><input type="text" id="indic-${i}-p2" style="width:100%;text-align:center"/></td>
            <td><input type="text" id="indic-${i}-p3" style="width:100%;text-align:center"/></td>
            <td><input type="text" id="indic-${i}-p4" style="width:100%;text-align:center"/></td>
            <td><input type="text" id="indic-${i}-var" style="width:100%;text-align:center"/></td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  `;
}

/* ════════════════════════════════════════════
   3.1.3 — Personnel de l'institution
   VOLET GOUVERNANCE
════════════════════════════════════════════ */
function buildPersonnelInstitution() {
  return `
    <div class="sub-title" style="margin-top:28px">
      <i class="fas fa-id-badge"></i> Personnel de l'institution
      <span style="font-size:11px;color:var(--text-muted);font-weight:400;margin-left:8px">(Table du rapport — 3.1.3)</span>
    </div>
    <div style="overflow-x:auto">
      <table class="dyn-table" id="tbl-personnel">
        <thead>
          <tr>
            <th style="width:40px">N°</th>
            <th>Noms prénoms</th>
            <th>Fonction</th>
            <th style="width:150px">Date d'embauche / début de stage</th>
            <th style="width:140px">Nature du contrat</th>
          </tr>
        </thead>
        <tbody id="tbody-personnel">
          ${[1,2,3,4,5].map(n => `
          <tr>
            <td style="text-align:center">${n}</td>
            <td><input type="text" placeholder="Nom…" style="width:100%"/></td>
            <td><input type="text" placeholder="Fonction…" style="width:100%"/></td>
            <td><input type="date" style="width:100%"/></td>
            <td>
              <select style="width:100%;padding:8px;border:1.5px solid var(--border);border-radius:6px;font-family:'Nunito',sans-serif;font-size:13px">
                <option value="" disabled selected>Nature…</option>
                <option value="CDI">CDI</option>
                <option value="CDD">CDD</option>
                <option value="Stage">Stage</option>
                <option value="Consultant">Consultant</option>
              </select>
            </td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
    <button class="add-btn" onclick="ajouterLignePersonnel()"><i class="fas fa-plus"></i> Ajouter un agent</button>
  `;
}

function ajouterLignePersonnel() {
  const tbody = document.getElementById('tbody-personnel');
  if (!tbody) return;
  const n = tbody.rows.length + 1;
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td style="text-align:center">${n}</td>
    <td><input type="text" placeholder="Nom…" style="width:100%"/></td>
    <td><input type="text" placeholder="Fonction…" style="width:100%"/></td>
    <td><input type="date" style="width:100%"/></td>
    <td>
      <select style="width:100%;padding:8px;border:1.5px solid var(--border);border-radius:6px;font-family:'Nunito',sans-serif;font-size:13px">
        <option value="" disabled selected>Nature…</option>
        <option value="CDI">CDI</option>
        <option value="CDD">CDD</option>
        <option value="Stage">Stage</option>
        <option value="Consultant">Consultant</option>
      </select>
    </td>
  `;
  tbody.appendChild(tr);
}

/* ════════════════════════════════════════════
   3.2.2 — Évolution des activités : RESSOURCES
   VOLET ÉPARGNE
════════════════════════════════════════════ */
const LIGNES_RESSOURCES = [
  { lib: "Ressources des institutions financières", groupe: true },
  { lib: "Comptes ordinaires créditeurs" },
  { lib: "Dépôts à terme" },
  { lib: "Dépôts de garantie reçus" },
  { lib: "Emprunts" },
  { lib: "Dépôts des membres/clients", groupe: true },
  { lib: "Comptes ordinaires créditeurs " },
  { lib: "Dépôts à terme " },
  { lib: "Comptes d'épargne à régime spécial" },
  { lib: "Dépôts de garantie" },
  { lib: "Autres dépôts" },
  { lib: "Total", total: true },
];

function buildEvolutionRessources() {
  return `
    <div class="sub-title" style="margin-top:28px">
      <i class="fas fa-piggy-bank"></i> Évolution des activités — Les ressources
      <span style="font-size:11px;color:var(--text-muted);font-weight:400;margin-left:8px">(Table du rapport — 3.2.2)</span>
    </div>
    <div style="overflow-x:auto">
      <table class="dyn-table" id="tbl-evol-ressources">
        <thead>
          <tr>
            <th>Ressources</th>
            <th style="width:130px">Montants (F CFA)</th>
            <th style="width:100px">Variation (%)</th>
          </tr>
        </thead>
        <tbody>
          ${LIGNES_RESSOURCES.map((l, i) => `
          <tr${l.groupe || l.total ? ' style="background:#F8FAFC"' : ''}>
            <td style="font-size:12.5px${l.groupe || l.total ? ';font-weight:700' : ''}">${l.lib}</td>
            <td><input type="text" id="ress-${i}-montant" style="width:100%;text-align:center"/></td>
            <td><input type="text" id="ress-${i}-var" style="width:100%;text-align:center"/></td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  `;
}

/* ════════════════════════════════════════════
   3.2.2 — Évolution des activités : EMPLOIS
   VOLET CRÉDIT
════════════════════════════════════════════ */
const LIGNES_EMPLOIS = [
  { lib: "Concours aux institutions", groupe: true },
  { lib: "Prêts aux institutions financières" },
  { lib: "Prêts en souffrance" },
  { lib: "Crédits aux membres/clients", groupe: true },
  { lib: "Comptes ordinaires" },
  { lib: "Court terme" },
  { lib: "Moyen terme" },
  { lib: "Long terme" },
  { lib: "Créances en souffrance" },
  { lib: "Total", total: true },
];

function buildEvolutionEmplois() {
  return `
    <div class="sub-title" style="margin-top:28px">
      <i class="fas fa-hand-holding-usd"></i> Évolution des activités — Les emplois
      <span style="font-size:11px;color:var(--text-muted);font-weight:400;margin-left:8px">(Table du rapport — 3.2.2)</span>
    </div>
    <div style="overflow-x:auto">
      <table class="dyn-table" id="tbl-evol-emplois">
        <thead>
          <tr>
            <th>Emplois bruts</th>
            <th style="width:130px">Montants (F CFA)</th>
            <th style="width:100px">Variation (%)</th>
          </tr>
        </thead>
        <tbody>
          ${LIGNES_EMPLOIS.map((l, i) => `
          <tr${l.groupe || l.total ? ' style="background:#F8FAFC"' : ''}>
            <td style="font-size:12.5px${l.groupe || l.total ? ';font-weight:700' : ''}">${l.lib}</td>
            <td><input type="text" id="empl-${i}-montant" style="width:100%;text-align:center"/></td>
            <td><input type="text" id="empl-${i}-var" style="width:100%;text-align:center"/></td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  `;
}

/* ════════════════════════════════════════════
   3.2.3 — Résultats
   VOLET COMPTABILITÉ ET FINANCE
════════════════════════════════════════════ */
const LIGNES_RESULTATS = [
  "Produits d'intérêt (i)", "Charges d'intérêt (ii)",
  "Marge d'intérêt bénéficiaire (a) = (i-ii)", "Autres produits d'intérêt (iii)",
  "Autres produits financiers nets (b)=(iii-iv)", "Produits financiers nets (a+b)",
  "Frais de personnel", "Impôts et taxes",
  "Autres charges externes et charges diverses d'exploitation",
  "Produits généraux d'exploitation", "Dotations aux amortissements",
  "Dotations aux provisions sur créances en souffrance",
  "Dotations aux provisions pour risques et charges",
  "Pertes sur créances irrécouvrables",
  "Reprises provisions sur créances en souffrance",
  "Reprises provisions pour risques et charges",
  "Récupération sur créances amorties", "Produits exceptionnels",
  "Charges exceptionnelles", "Profits sur services antérieurs",
  "Pertes sur services antérieurs", "Résultat",
];

function buildResultats() {
  return `
    <div class="sub-title" style="margin-top:28px">
      <i class="fas fa-calculator"></i> Résultats
      <span style="font-size:11px;color:var(--text-muted);font-weight:400;margin-left:8px">(Table du rapport — 3.2.3)</span>
    </div>
    <div style="overflow-x:auto">
      <table class="dyn-table" id="tbl-resultats">
        <thead>
          <tr>
            <th>Libellés</th>
            <th style="width:130px">Montants (F CFA)</th>
            <th style="width:100px">Variation (%)</th>
          </tr>
        </thead>
        <tbody>
          ${LIGNES_RESULTATS.map((l, i) => `
          <tr${l === 'Résultat' ? ' style="background:#F8FAFC"' : ''}>
            <td style="font-size:12.5px${l === 'Résultat' ? ';font-weight:700' : ''}">${l}</td>
            <td><input type="text" id="resu-${i}-montant" style="width:100%;text-align:center"/></td>
            <td><input type="text" id="resu-${i}-var" style="width:100%;text-align:center"/></td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  `;
}

/* ════════════════════════════════════════════
   3.2.4 — Fonds propres
   VOLET COMPTABILITÉ ET FINANCE
════════════════════════════════════════════ */
const LIGNES_FONDS_PROPRES = [
  "Subventions d'investissement", "Fonds affectés", "Emprunts et titres subordonnés",
  "Provisions pour risques et charges", "Provisions réglementées", "Réserves",
  "Capital", "Fonds de dotation", "Report à nouveau", "Résultats", "Total",
];

function buildFondsPropres() {
  return `
    <div class="sub-title" style="margin-top:28px">
      <i class="fas fa-coins"></i> Fonds propres
      <span style="font-size:11px;color:var(--text-muted);font-weight:400;margin-left:8px">(Table du rapport — 3.2.4)</span>
    </div>
    <div style="overflow-x:auto">
      <table class="dyn-table" id="tbl-fonds-propres">
        <thead>
          <tr>
            <th>Rubriques</th>
            <th style="width:120px">Période 1</th>
            <th style="width:120px">Période 2</th>
            <th style="width:120px">Période 3</th>
            <th style="width:120px">Période 4</th>
          </tr>
        </thead>
        <tbody>
          ${LIGNES_FONDS_PROPRES.map((l, i) => `
          <tr${l === 'Total' ? ' style="background:#F8FAFC"' : ''}>
            <td style="font-size:12.5px${l === 'Total' ? ';font-weight:700' : ''}">${l}</td>
            <td><input type="text" id="fprop-${i}-p1" style="width:100%;text-align:center"/></td>
            <td><input type="text" id="fprop-${i}-p2" style="width:100%;text-align:center"/></td>
            <td><input type="text" id="fprop-${i}-p3" style="width:100%;text-align:center"/></td>
            <td><input type="text" id="fprop-${i}-p4" style="width:100%;text-align:center"/></td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  `;
}

/* ════════════════════════════════════════════
   SECTION 8 — Politique et structure de l'épargne
   VOLET ÉPARGNE
   (Nouveau modèle : 4 tableaux du canevas)
════════════════════════════════════════════ */
const EPG_NATURE = [
  "Dépôt à vue", "Compte courant", "Dépôt à terme",
  "Dépôt de garantie", "Dépôt plan Épargne",
];

const EPG_TRANCHES = [
  "Inférieur à 50 000", "50 001 à 100 000", "100 001 à 200 000",
  "200 001 à 500 000", "500 001 à 1 000 000", "Plus de 1 000 000",
];

const EPG_ACTIVITE = [
  { lib: "Comptes actifs", groupe: true },
  { lib: "Comptes à solde négatif", sub: true },
  { lib: "Comptes à solde nul", sub: true },
  { lib: "Comptes à solde positif", sub: true },
  { lib: "Comptes inactifs", groupe: true },
  { lib: "Comptes à solde négatif ", sub: true },
  { lib: "Comptes à solde nul ", sub: true },
  { lib: "Comptes à solde positif ", sub: true },
  { lib: "Comptes dormants", groupe: true },
  { lib: "Comptes clôturés", groupe: true },
];

// En-tête à deux niveaux commun aux tableaux de structure de l'épargne
function epgThead() {
  return `
        <thead>
          <tr>
            <th rowspan="2" style="vertical-align:middle">Libellés</th>
            <th colspan="2" style="text-align:center">Nombre de comptes</th>
            <th colspan="2" style="text-align:center">Montant du solde cumulé</th>
          </tr>
          <tr>
            <th style="width:100px;text-align:center">Quantité</th>
            <th style="width:90px;text-align:center">Taux (%)</th>
            <th style="width:150px;text-align:center">Valeur (F CFA)</th>
            <th style="width:90px;text-align:center">Taux (%)</th>
          </tr>
        </thead>`;
}

function epgRow(prefix, i, label, style) {
  return `
          <tr${style || ''}>
            <td style="font-size:12.5px">${label}</td>
            <td><input type="text" id="${prefix}-${i}-qte" style="width:100%;text-align:center"/></td>
            <td><input type="text" id="${prefix}-${i}-tauxq" style="width:100%;text-align:center"/></td>
            <td><input type="text" id="${prefix}-${i}-val" style="width:100%;text-align:right"/></td>
            <td><input type="text" id="${prefix}-${i}-tauxv" style="width:100%;text-align:center"/></td>
          </tr>`;
}

function epgTotalRow(prefix) {
  return `
          <tr style="background:#F8FAFC;font-weight:700">
            <td>Total</td>
            <td><input type="text" id="${prefix}-total-qte" style="width:100%;text-align:center;font-weight:700"/></td>
            <td><input type="text" id="${prefix}-total-tauxq" style="width:100%;text-align:center;font-weight:700"/></td>
            <td><input type="text" id="${prefix}-total-val" style="width:100%;text-align:right;font-weight:700"/></td>
            <td><input type="text" id="${prefix}-total-tauxv" style="width:100%;text-align:center;font-weight:700"/></td>
          </tr>`;
}

function buildStructureEpargne() {
  return `
    <div class="sub-title" style="margin-top:28px">
      <i class="fas fa-file-signature"></i> 8.1 — Politique et procédures de l'épargne
      <span style="font-size:11px;color:var(--text-muted);font-weight:400;margin-left:8px">(Section 8 du rapport)</span>
    </div>
    <div class="form-group-full" style="margin-bottom:16px">
      <label>Politique et procédures de l'épargne</label>
      <textarea id="epg-politique-procedures" rows="3" placeholder="Décrivez la politique et les procédures de collecte de l'épargne…"></textarea>
    </div>

    <!-- Tableau 1 — Structure selon la nature des comptes -->
    <div class="sub-title" style="margin-top:22px">
      <i class="fas fa-piggy-bank"></i> Structure de l'épargne selon la nature des comptes
      <span style="font-size:11px;color:var(--text-muted);font-weight:400;margin-left:8px">(Table du rapport — Situation de l'épargne)</span>
    </div>
    <div style="overflow-x:auto">
      <table class="dyn-table" id="tbl-epg-nature">
        ${epgThead()}
        <tbody>
          ${EPG_NATURE.map((l, i) => epgRow('epgnat', i, l)).join('')}
          ${epgTotalRow('epgnat')}
        </tbody>
      </table>
    </div>
    <div class="form-group-full" style="margin-top:10px">
      <label>Commentaire / analyse</label>
      <textarea id="epgnat-comm" rows="3" placeholder="Analyse de la structure de l'épargne selon la nature des comptes (concentration, risque de liquidité…)"></textarea>
    </div>

    <!-- Tableau 2 — Structure par tranche -->
    <div class="sub-title" style="margin-top:22px">
      <i class="fas fa-layer-group"></i> Structure de l'épargne par tranche
    </div>
    <div style="overflow-x:auto">
      <table class="dyn-table" id="tbl-epg-tranches">
        ${epgThead()}
        <tbody>
          ${EPG_TRANCHES.map((l, i) => epgRow('epgtr', i, l)).join('')}
          ${epgTotalRow('epgtr')}
        </tbody>
      </table>
    </div>
    <div class="form-group-full" style="margin-top:10px">
      <label>Commentaire / analyse</label>
      <textarea id="epgtr-comm" rows="3" placeholder="Analyse de la répartition de l'épargne par tranche (petits épargnants, concentration…)"></textarea>
    </div>

    <!-- Tableau 3 — Situation selon l'activité des comptes -->
    <div class="sub-title" style="margin-top:22px">
      <i class="fas fa-toggle-on"></i> Situation de l'épargne selon l'activité des comptes
    </div>
    <div style="overflow-x:auto">
      <table class="dyn-table" id="tbl-epg-activite">
        ${epgThead()}
        <tbody>
          ${EPG_ACTIVITE.map((l, i) => epgRow('epgact', i, l.sub ? `<em style="padding-left:14px">${l.lib}</em>` : l.lib, l.groupe ? ' style="background:#F8FAFC;font-weight:700"' : '')).join('')}
          ${epgTotalRow('epgact')}
        </tbody>
      </table>
    </div>
    <div class="form-group-full" style="margin-top:10px">
      <label>Commentaire / analyse</label>
      <textarea id="epgact-comm" rows="3" placeholder="Analyse de l'activité des comptes (comptes actifs, soldes nuls, comptes inactifs, clôtures…)"></textarea>
    </div>

    <!-- Tableau 4 — Dix plus gros épargnants -->
    <div class="sub-title" style="margin-top:22px">
      <i class="fas fa-users"></i> Situation des dix plus gros épargnants
    </div>
    <div style="overflow-x:auto">
      <table class="dyn-table" id="tbl-epg-gros">
        <thead>
          <tr>
            <th rowspan="2" style="width:44px;vertical-align:middle;text-align:center">N°</th>
            <th rowspan="2" style="vertical-align:middle">Nom et prénoms / Désignation</th>
            <th colspan="2" style="text-align:center">Épargne</th>
          </tr>
          <tr>
            <th style="width:160px;text-align:center">Montant (F CFA)</th>
            <th style="width:90px;text-align:center">Taux (%)</th>
          </tr>
        </thead>
        <tbody id="tbody-epg-gros">
          ${[0,1,2,3,4,5,6,7,8,9].map(n => `
          <tr>
            <td style="text-align:center">${n + 1}</td>
            <td><input type="text" id="epggros-${n}-nom" placeholder="Nom / désignation…" style="width:100%"/></td>
            <td><input type="text" id="epggros-${n}-mnt" style="width:100%;text-align:right"/></td>
            <td><input type="text" id="epggros-${n}-taux" style="width:100%;text-align:center"/></td>
          </tr>`).join('')}
          <tr style="background:#F8FAFC;font-weight:700">
            <td colspan="2">Encours des 10 plus gros épargnants</td>
            <td><input type="text" id="epggros-enc10-mnt" style="width:100%;text-align:right;font-weight:700"/></td>
            <td><input type="text" id="epggros-enc10-taux" style="width:100%;text-align:center;font-weight:700"/></td>
          </tr>
          <tr style="background:#F8FAFC;font-weight:700">
            <td colspan="2">Encours global de l'épargne</td>
            <td><input type="text" id="epggros-global-mnt" style="width:100%;text-align:right;font-weight:700"/></td>
            <td><input type="text" id="epggros-global-taux" style="width:100%;text-align:center;font-weight:700"/></td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="form-group-full" style="margin-top:10px">
      <label>Commentaire / analyse</label>
      <textarea id="epggros-comm" rows="3" placeholder="Analyse de la concentration de l'épargne sur les plus gros déposants…"></textarea>
    </div>
  `;
}

/* ════════════════════════════════════════════
   9.2 — Analyse des dossiers de crédit
   VOLET CRÉDIT
════════════════════════════════════════════ */
const LIGNES_ANALYSE_CREDIT = [
  "Nombre moyen des prêts octroyés par mois (i) = (a)/(b)",
  "Nombre de prêts octroyés (a)",
  "Nombre de mois d'exercice (b)",
  "Production moyenne de prêts par mois (ii) = (c)/(b)",
  "Production de prêts (c)",
  "Évolution de la production des prêts par mois",
  "Variation du nombre moyen de la production par mois",
];

function buildAnalyseDossiersCredit() {
  return `
    <div class="sub-title" style="margin-top:28px">
      <i class="fas fa-folder-open"></i> Analyse des dossiers de crédit
      <span style="font-size:11px;color:var(--text-muted);font-weight:400;margin-left:8px">(Table du rapport — 9.2)</span>
    </div>
    <div style="overflow-x:auto">
      <table class="dyn-table" id="tbl-analyse-credit">
        <thead><tr><th>Rubriques</th><th style="width:150px">Montant (F CFA)</th></tr></thead>
        <tbody>
          ${LIGNES_ANALYSE_CREDIT.map((l, i) => `
          <tr><td style="font-size:12.5px">${l}</td><td><input type="text" id="anacred-${i}" style="width:100%;text-align:center"/></td></tr>`).join('')}
        </tbody>
      </table>
    </div>
  `;
}

/* ════════════════════════════════════════════
   9.3 — Situation globale du crédit
   VOLET CRÉDIT
════════════════════════════════════════════ */
const LIGNES_SITUATION_CREDIT = [
  { lib: "Encours bruts de crédits (a+b)", total: true },
  { lib: "Crédits sains (a)", groupe: true },
  { lib: "0 jour de retard" },
  { lib: "1 à 30 jours de retard" },
  { lib: "31 à 60 jours de retard" },
  { lib: "61 à 90 jours de retard" },
  { lib: "Créances en souffrance (b)", groupe: true },
  { lib: "Plus 3-6 mois au plus" },
  { lib: "Plus 6-12 mois au plus" },
  { lib: "Plus 12-24 mois au plus" },
  { lib: "Crédit en restructuration" },
];

function buildSituationGlobaleCredit() {
  return `
    <div class="sub-title" style="margin-top:28px">
      <i class="fas fa-chart-pie"></i> Situation globale du crédit
      <span style="font-size:11px;color:var(--text-muted);font-weight:400;margin-left:8px">(Table du rapport — 9.3)</span>
    </div>
    <p style="font-size:12px;color:var(--text-muted);margin-bottom:10px">PAR 30 et PAR 90 : indicateurs de portefeuille à risque à 30 et 90 jours.</p>
    <div style="overflow-x:auto">
      <table class="dyn-table" id="tbl-situation-credit">
        <thead>
          <tr>
            <th>Libellés</th>
            <th style="width:90px">Quantité</th>
            <th style="width:80px">Taux (%)</th>
            <th style="width:120px">Valeur (F CFA)</th>
            <th style="width:80px">Taux (%)</th>
          </tr>
        </thead>
        <tbody>
          ${LIGNES_SITUATION_CREDIT.map((l, i) => `
          <tr${l.groupe || l.total ? ' style="background:#F8FAFC"' : ''}>
            <td style="font-size:12.5px${l.groupe || l.total ? ';font-weight:700' : ''}">${l.lib}</td>
            <td><input type="text" id="sitcred-${i}-qte" style="width:100%;text-align:center"/></td>
            <td><input type="text" id="sitcred-${i}-tauxq" style="width:100%;text-align:center"/></td>
            <td><input type="text" id="sitcred-${i}-val" style="width:100%;text-align:center"/></td>
            <td><input type="text" id="sitcred-${i}-tauxv" style="width:100%;text-align:center"/></td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px">
      <div class="form-group-full"><label>PAR 30 (%)</label><input type="text" id="sitcred-par30"/></div>
      <div class="form-group-full"><label>PAR 90 (%)</label><input type="text" id="sitcred-par90"/></div>
    </div>
  `;
}

/* ════════════════════════════════════════════
   9.4.2 — Suivi des prêts aux dirigeants,
   ex-dirigeants, personnel — VOLET CRÉDIT
════════════════════════════════════════════ */
function buildSuiviPretsPersonnesLiees() {
  function tableDirigeants(id, titre, avecFonction, nbLignes) {
    return `
      <div class="sub-title" style="margin-top:20px">
        <i class="fas fa-user-tie"></i> ${titre}
      </div>
      <div style="overflow-x:auto">
        <table class="dyn-table" id="tbl-${id}">
          <thead>
            <tr>
              <th style="width:40px">N°</th>
              <th>${avecFonction ? 'Titulaire' : 'Emprunteurs'}</th>
              <th>${avecFonction ? 'Fonction' : 'Organes'}</th>
              <th style="width:110px">Montant initial (F CFA)</th>
              <th style="width:110px">Montant restant (F CFA)</th>
              <th style="width:100px">Épargne nantie (F CFA)</th>
              <th style="width:100px">Risque réel (F CFA)</th>
              <th style="width:90px">Retard (jours)</th>
            </tr>
          </thead>
          <tbody id="tbody-${id}">
            ${Array.from({length: nbLignes}, (_, idx) => idx+1).map(n => `
            <tr>
              <td style="text-align:center">${n}</td>
              <td><input type="text" style="width:100%"/></td>
              <td><input type="text" style="width:100%"/></td>
              <td><input type="text" style="width:100%;text-align:center"/></td>
              <td><input type="text" style="width:100%;text-align:center"/></td>
              <td><input type="text" style="width:100%;text-align:center"/></td>
              <td><input type="text" style="width:100%;text-align:center"/></td>
              <td><input type="text" style="width:100%;text-align:center"/></td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
      <button class="add-btn" onclick="ajouterLignePretLie('tbody-${id}')"><i class="fas fa-plus"></i> Ajouter une ligne</button>
    `;
  }

  return `
    <div class="sub-title" style="margin-top:28px">
      <i class="fas fa-users-cog"></i> Suivi des prêts aux dirigeants, ex-dirigeants, personnel et personnes liées
      <span style="font-size:11px;color:var(--text-muted);font-weight:400;margin-left:8px">(Table du rapport — 9.4.2)</span>
    </div>
    ${tableDirigeants('prets-dirigeants', 'Suivi des prêts aux dirigeants (le cas échéant)', true, 9)}
    ${tableDirigeants('prets-ex-dirigeants', 'Suivi des prêts aux ex-dirigeants (le cas échéant)', false, 3)}
    ${tableDirigeants('prets-salaries', 'Suivi des prêts aux salariés', true, 7)}
  `;
}

function ajouterLignePretLie(tbodyId) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;
  const n = tbody.rows.length + 1;
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td style="text-align:center">${n}</td>
    <td><input type="text" style="width:100%"/></td>
    <td><input type="text" style="width:100%"/></td>
    <td><input type="text" style="width:100%;text-align:center"/></td>
    <td><input type="text" style="width:100%;text-align:center"/></td>
    <td><input type="text" style="width:100%;text-align:center"/></td>
    <td><input type="text" style="width:100%;text-align:center"/></td>
    <td><input type="text" style="width:100%;text-align:center"/></td>
  `;
  tbody.appendChild(tr);
}

/* ════════════════════════════════════════════
   9.4.3 — Suivi des 10 plus gros risques +
   Suivi des créances virées en perte
   VOLET CRÉDIT
════════════════════════════════════════════ */
function buildSuivi10PlusGrosRisques() {
  return `
    <div class="sub-title" style="margin-top:28px">
      <i class="fas fa-exclamation-triangle"></i> Suivi des dix (10) plus gros risques
      <span style="font-size:11px;color:var(--text-muted);font-weight:400;margin-left:8px">(Table du rapport — 9.4.3)</span>
    </div>
    <div style="overflow-x:auto">
      <table class="dyn-table" id="tbl-10-gros-risques">
        <thead>
          <tr>
            <th>Emprunteurs</th>
            <th style="width:110px">Montant initial (F CFA)</th>
            <th style="width:110px">Montant restant (F CFA)</th>
            <th style="width:100px">Épargne nantie (F CFA)</th>
            <th style="width:100px">Risque réel (F CFA)</th>
            <th style="width:90px">Jours de retard</th>
          </tr>
        </thead>
        <tbody id="tbody-10-gros-risques">
          ${[1,2,3,4,5,6,7,8,9,10].map(n => `
          <tr>
            <td><input type="text" placeholder="Emprunteur ${n}…" style="width:100%"/></td>
            <td><input type="text" style="width:100%;text-align:center"/></td>
            <td><input type="text" style="width:100%;text-align:center"/></td>
            <td><input type="text" style="width:100%;text-align:center"/></td>
            <td><input type="text" style="width:100%;text-align:center"/></td>
            <td><input type="text" style="width:100%;text-align:center"/></td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>

    <div class="sub-title" style="margin-top:24px">
      <i class="fas fa-file-invoice-dollar"></i> Suivi du recouvrement des créances virées en perte
    </div>
    <div style="overflow-x:auto">
      <table class="dyn-table" id="tbl-creances-perte">
        <thead>
          <tr><th>Rubriques</th><th style="width:110px">Période 1</th><th style="width:110px">Période 2</th><th style="width:110px">Période 3</th><th style="width:110px">Période 4</th></tr>
        </thead>
        <tbody>
          ${[
            "Nombre de crédits virés en perte",
            "Montant des crédits virés en perte (a) (F CFA)",
            "Récupérations sur créances virées en perte (b) (F CFA)",
            "Encours de crédits (c) (F CFA)",
            "Taux de perte sur créances (a)/(c) (%)",
            "Taux de recouvrement sur créances (b)/(a) (%)",
          ].map((l, i) => `
          <tr>
            <td style="font-size:12.5px">${l}</td>
            <td><input type="text" id="crperte-${i}-p1" style="width:100%;text-align:center"/></td>
            <td><input type="text" id="crperte-${i}-p2" style="width:100%;text-align:center"/></td>
            <td><input type="text" id="crperte-${i}-p3" style="width:100%;text-align:center"/></td>
            <td><input type="text" id="crperte-${i}-p4" style="width:100%;text-align:center"/></td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  `;
}

/* ════════════════════════════════════════════
   9.5 — Taux de l'usure
   VOLET CRÉDIT
════════════════════════════════════════════ */
function buildTauxUsure() {
  return `
    <div class="sub-title" style="margin-top:28px">
      <i class="fas fa-percentage"></i> Taux de l'usure
      <span style="font-size:11px;color:var(--text-muted);font-weight:400;margin-left:8px">(Table du rapport — 9.5)</span>
    </div>
    <div style="overflow-x:auto">
      <table class="dyn-table" id="tbl-taux-usure">
        <thead>
          <tr>
            <th>Emprunteurs</th>
            <th style="width:110px">Montant prêt (F CFA)</th>
            <th style="width:90px">Taux annuel (%)</th>
            <th style="width:100px">Nombre d'échéances</th>
            <th style="width:90px">TEG (%)</th>
          </tr>
        </thead>
        <tbody id="tbody-taux-usure">
          ${[1,2,3,4,5,6,7,8,9,10].map(n => `
          <tr>
            <td><input type="text" placeholder="Emprunteur ${n}…" style="width:100%"/></td>
            <td><input type="text" style="width:100%;text-align:center"/></td>
            <td><input type="text" style="width:100%;text-align:center"/></td>
            <td><input type="text" style="width:100%;text-align:center"/></td>
            <td><input type="text" style="width:100%;text-align:center"/></td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
    <button class="add-btn" onclick="ajouterLigneTauxUsure()"><i class="fas fa-plus"></i> Ajouter une ligne</button>
  `;
}

function ajouterLigneTauxUsure() {
  const tbody = document.getElementById('tbody-taux-usure');
  if (!tbody) return;
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td><input type="text" style="width:100%"/></td>
    <td><input type="text" style="width:100%;text-align:center"/></td>
    <td><input type="text" style="width:100%;text-align:center"/></td>
    <td><input type="text" style="width:100%;text-align:center"/></td>
    <td><input type="text" style="width:100%;text-align:center"/></td>
  `;
  tbody.appendChild(tr);
}

/* ════════════════════════════════════════════
   COLLECTE DONNÉES — Tables 2, 3, 14, 25
════════════════════════════════════════════ */
function collecterDonneesRapport() {
  const data = {};

  // Table 2 — Infos générales SFD
  data.infos_sfd = {
    date_constitution: document.getElementById('sfd-date-constitution')?.value || '',
    date_rccm:         document.getElementById('sfd-date-rccm')?.value || '',
    num_rccm:          document.getElementById('sfd-num-rccm')?.value || '',
    date_agrement:     document.getElementById('sfd-date-agrement')?.value || '',
    num_agrement:      document.getElementById('sfd-num-agrement')?.value || '',
    situation_geo:     document.getElementById('sfd-situation-geo')?.value || '',
    date_demarrage:    document.getElementById('sfd-date-demarrage')?.value || '',
    adresse:           document.getElementById('sfd-adresse')?.value || '',
    contacts:          document.getElementById('sfd-contacts')?.value || '',
    nb_points:         document.getElementById('sfd-nb-points')?.value || '',
    activites:         document.getElementById('sfd-activites')?.value || '',
    evaluation_institutionnelle: document.getElementById('sfd-evaluation-institutionnelle')?.value || '',
  };

  // Table 4 — Suivi recommandations précédente mission (chef de mission)
  data.suivi_recommandations_precedentes = [];
  document.querySelectorAll('#tbody-suivi-recomm-prec tr').forEach(tr => {
    const inputs = tr.querySelectorAll('input');
    const select = tr.querySelector('select');
    if (inputs[0]?.value?.trim()) {
      data.suivi_recommandations_precedentes.push({
        recommandation: inputs[0].value.trim(),
        statut: select?.value || '',
        observations: inputs[1]?.value.trim() || '',
      });
    }
  });

  // 3.2.1 — Indicateurs d'activités (chef de mission)
  data.indicateurs_activites = RUBRIQUES_INDICATEURS.map((r, i) => ({
    rubrique: r,
    p1: document.getElementById(`indic-${i}-p1`)?.value || '',
    p2: document.getElementById(`indic-${i}-p2`)?.value || '',
    p3: document.getElementById(`indic-${i}-p3`)?.value || '',
    p4: document.getElementById(`indic-${i}-p4`)?.value || '',
    variation: document.getElementById(`indic-${i}-var`)?.value || '',
  }));

  // Tables 3/11/12/13 — Membres des organes
  const collecterOrgane = (tbodyId) => {
    const membres = [];
    document.querySelectorAll(`#${tbodyId} tr`).forEach(tr => {
      const inputs = tr.querySelectorAll('input');
      const select = tr.querySelector('select');
      if (inputs[0]?.value?.trim()) {
        membres.push({
          nom:       inputs[0].value.trim(),
          fonction:  select?.value.trim() || '',
          debut:     inputs[1]?.value || '',
          fin:       inputs[2]?.value || '',
          profession:inputs[3]?.value.trim() || '',
          contact:   inputs[4]?.value.trim() || '',
        });
      }
    });
    return membres;
  };

  data.organes = {
    ca: collecterOrgane('tbody-ca'),
    cc: collecterOrgane('tbody-cc'),
    cs: collecterOrgane('tbody-cs'),
  };

  // Personnel de l'institution (volet Gouvernance)
  data.personnel = [];
  document.querySelectorAll('#tbody-personnel tr').forEach(tr => {
    const inputs = tr.querySelectorAll('input');
    const select = tr.querySelector('select');
    if (inputs[0]?.value?.trim()) {
      data.personnel.push({
        nom: inputs[0].value.trim(),
        fonction: inputs[1]?.value.trim() || '',
        date_embauche: inputs[2]?.value || '',
        nature_contrat: select?.value || '',
      });
    }
  });

  // Table 14 — Réunions
  const orgNames = ['ag', 'ca', 'cc', 'cs'];
  data.reunions = {
    annees: [
      document.getElementById('reunion-annee1')?.value || '',
      document.getElementById('reunion-annee2')?.value || '',
      document.getElementById('reunion-annee3')?.value || '',
      document.getElementById('reunion-annee4')?.value || '',
    ],
    lignes: [0,1,2,3].map(i => ({
      a1:    document.getElementById(`reunion-${i}-a1`)?.value || '0',
      a2:    document.getElementById(`reunion-${i}-a2`)?.value || '0',
      a3:    document.getElementById(`reunion-${i}-a3`)?.value || '0',
      a4:    document.getElementById(`reunion-${i}-a4`)?.value || '0',
      total: document.getElementById(`reunion-${i}-total`)?.value || '0',
    }))
  };

  // Table 25 — Ratios prudentiels (11, volet Comptabilité et Finance)
  data.ratios = {
    periodes: [
      document.getElementById('ratio-p1')?.value || '',
      document.getElementById('ratio-p2')?.value || '',
      document.getElementById('ratio-p3')?.value || '',
      document.getElementById('ratio-p4')?.value || '',
    ],
    lignes: RATIOS_BCEAO.map(r => ({
      num:     r.num,
      libelle: r.libelle,
      norme:   r.norme,
      p1:      document.getElementById(`ratio-${r.num}-p1`)?.value || '',
      p2:      document.getElementById(`ratio-${r.num}-p2`)?.value || '',
      p3:      document.getElementById(`ratio-${r.num}-p3`)?.value || '',
      p4:      document.getElementById(`ratio-${r.num}-p4`)?.value || '',
      obs:     document.getElementById(`ratio-${r.num}-obs`)?.value || '',
    }))
  };

  // 3.2.2 — Ressources (volet Épargne) / Emplois (volet Crédit)
  data.evolution_ressources = LIGNES_RESSOURCES.filter(l=>!l.groupe && !l.total).map((l, i) => ({
    libelle: l.lib,
    montant: document.getElementById(`ress-${i}-montant`)?.value || '',
    variation: document.getElementById(`ress-${i}-var`)?.value || '',
  }));
  data.evolution_emplois = LIGNES_EMPLOIS.filter(l=>!l.groupe && !l.total).map((l, i) => ({
    libelle: l.lib,
    montant: document.getElementById(`empl-${i}-montant`)?.value || '',
    variation: document.getElementById(`empl-${i}-var`)?.value || '',
  }));

  // 3.2.3 — Résultats / 3.2.4 — Fonds propres (volet Comptabilité et Finance)
  data.resultats = LIGNES_RESULTATS.map((l, i) => ({
    libelle: l,
    montant: document.getElementById(`resu-${i}-montant`)?.value || '',
    variation: document.getElementById(`resu-${i}-var`)?.value || '',
  }));
  data.fonds_propres = LIGNES_FONDS_PROPRES.map((l, i) => ({
    libelle: l,
    p1: document.getElementById(`fprop-${i}-p1`)?.value || '',
    p2: document.getElementById(`fprop-${i}-p2`)?.value || '',
    p3: document.getElementById(`fprop-${i}-p3`)?.value || '',
    p4: document.getElementById(`fprop-${i}-p4`)?.value || '',
  }));

  // Section 8 — Épargne (politique + 4 tableaux du canevas)
  data.epargne_politique_procedures = document.getElementById('epg-politique-procedures')?.value || '';

  const collecterTableEpg = (prefix, libelles) => ({
    lignes: libelles.map((lib, i) => ({
      libelle: typeof lib === 'string' ? lib : lib.lib,
      qte:   document.getElementById(`${prefix}-${i}-qte`)?.value || '',
      tauxq: document.getElementById(`${prefix}-${i}-tauxq`)?.value || '',
      val:   document.getElementById(`${prefix}-${i}-val`)?.value || '',
      tauxv: document.getElementById(`${prefix}-${i}-tauxv`)?.value || '',
    })),
    total: {
      qte:   document.getElementById(`${prefix}-total-qte`)?.value || '',
      tauxq: document.getElementById(`${prefix}-total-tauxq`)?.value || '',
      val:   document.getElementById(`${prefix}-total-val`)?.value || '',
      tauxv: document.getElementById(`${prefix}-total-tauxv`)?.value || '',
    },
    commentaire: document.getElementById(`${prefix}-comm`)?.value || '',
  });

  data.structure_epargne = {
    nature:   collecterTableEpg('epgnat', EPG_NATURE),
    tranches: collecterTableEpg('epgtr',  EPG_TRANCHES),
    activite: collecterTableEpg('epgact', EPG_ACTIVITE),
    gros_epargnants: {
      lignes: [0,1,2,3,4,5,6,7,8,9].map(n => ({
        nom:     document.getElementById(`epggros-${n}-nom`)?.value || '',
        montant: document.getElementById(`epggros-${n}-mnt`)?.value || '',
        taux:    document.getElementById(`epggros-${n}-taux`)?.value || '',
      })),
      encours_10: {
        montant: document.getElementById('epggros-enc10-mnt')?.value || '',
        taux:    document.getElementById('epggros-enc10-taux')?.value || '',
      },
      encours_global: {
        montant: document.getElementById('epggros-global-mnt')?.value || '',
        taux:    document.getElementById('epggros-global-taux')?.value || '',
      },
      commentaire: document.getElementById('epggros-comm')?.value || '',
    },
  };

  // 9.2 — Analyse des dossiers de crédit
  data.analyse_dossiers_credit = LIGNES_ANALYSE_CREDIT.map((l, i) => ({
    libelle: l,
    valeur: document.getElementById(`anacred-${i}`)?.value || '',
  }));

  // 9.3 — Situation globale du crédit
  data.situation_globale_credit = {
    lignes: LIGNES_SITUATION_CREDIT.filter(l=>!l.groupe && !l.total).map((l, i) => ({
      libelle: l.lib,
      quantite: document.getElementById(`sitcred-${i}-qte`)?.value || '',
      taux_qte: document.getElementById(`sitcred-${i}-tauxq`)?.value || '',
      valeur: document.getElementById(`sitcred-${i}-val`)?.value || '',
      taux_val: document.getElementById(`sitcred-${i}-tauxv`)?.value || '',
    })),
    par30: document.getElementById('sitcred-par30')?.value || '',
    par90: document.getElementById('sitcred-par90')?.value || '',
  };

  // 9.4.2 — Prêts dirigeants/ex-dirigeants/salariés
  const collecterPretsLies = (tbodyId) => {
    const lignes = [];
    document.querySelectorAll(`#${tbodyId} tr`).forEach(tr => {
      const inputs = tr.querySelectorAll('input');
      if (inputs[0]?.value?.trim()) {
        lignes.push({
          titulaire: inputs[0].value.trim(),
          fonction_organe: inputs[1]?.value.trim() || '',
          montant_initial: inputs[2]?.value || '',
          montant_restant: inputs[3]?.value || '',
          epargne_nantie: inputs[4]?.value || '',
          risque_reel: inputs[5]?.value || '',
          retard_jours: inputs[6]?.value || '',
        });
      }
    });
    return lignes;
  };
  data.prets_personnes_liees = {
    dirigeants: collecterPretsLies('tbody-prets-dirigeants'),
    ex_dirigeants: collecterPretsLies('tbody-prets-ex-dirigeants'),
    salaries: collecterPretsLies('tbody-prets-salaries'),
  };

  // 9.4.3 — 10 plus gros risques + créances en perte
  data.dix_plus_gros_risques = [];
  document.querySelectorAll('#tbody-10-gros-risques tr').forEach(tr => {
    const inputs = tr.querySelectorAll('input');
    if (inputs[0]?.value?.trim()) {
      data.dix_plus_gros_risques.push({
        emprunteur: inputs[0].value.trim(),
        montant_initial: inputs[1]?.value || '',
        montant_restant: inputs[2]?.value || '',
        epargne_nantie: inputs[3]?.value || '',
        risque_reel: inputs[4]?.value || '',
        retard_jours: inputs[5]?.value || '',
      });
    }
  });
  data.creances_virees_perte = [
    "Nombre de crédits virés en perte","Montant des crédits virés en perte (a)",
    "Récupérations sur créances virées en perte (b)","Encours de crédits (c)",
    "Taux de perte sur créances (a)/(c)","Taux de recouvrement sur créances (b)/(a)",
  ].map((l, i) => ({
    libelle: l,
    p1: document.getElementById(`crperte-${i}-p1`)?.value || '',
    p2: document.getElementById(`crperte-${i}-p2`)?.value || '',
    p3: document.getElementById(`crperte-${i}-p3`)?.value || '',
    p4: document.getElementById(`crperte-${i}-p4`)?.value || '',
  }));

  // 9.5 — Taux de l'usure
  data.taux_usure = [];
  document.querySelectorAll('#tbody-taux-usure tr').forEach(tr => {
    const inputs = tr.querySelectorAll('input');
    if (inputs[0]?.value?.trim()) {
      data.taux_usure.push({
        emprunteur: inputs[0].value.trim(),
        montant_pret: inputs[1]?.value || '',
        taux_annuel: inputs[2]?.value || '',
        nb_echeances: inputs[3]?.value || '',
        teg: inputs[4]?.value || '',
      });
    }
  });

  // Textes narratifs
  data.narratifs = {
    gouvernance: document.getElementById('narr-gouvernance')?.value || '',
    ci:          document.getElementById('narr-ci')?.value || '',
    lbcft:       document.getElementById('narr-lbcft')?.value || '',
    rh:          document.getElementById('narr-rh')?.value || '',
    epargne:     document.getElementById('narr-epargne')?.value || '',
    credit:      document.getElementById('narr-credit')?.value || '',
    compta:      document.getElementById('narr-compta')?.value || '',
    si:          document.getElementById('narr-si')?.value || '',
  };

  return data;




  
}

/* ════════════════════════════════════════════
   FIX — RESTAURATION DES DONNÉES DU RAPPORT
   (symétrique de collecterDonneesRapport)
════════════════════════════════════════════ */
function restaurerDonneesRapport(mission) {
  if (!mission) return;

  // ── Table 2 — Infos générales SFD ──
  const infos = mission.infos_sfd || {};
  const mapInfos = {
    'sfd-date-constitution': infos.date_constitution,
    'sfd-date-rccm':         infos.date_rccm,
    'sfd-num-rccm':          infos.num_rccm,
    'sfd-date-agrement':     infos.date_agrement,
    'sfd-num-agrement':      infos.num_agrement,
    'sfd-situation-geo':     infos.situation_geo,
    'sfd-date-demarrage':    infos.date_demarrage,
    'sfd-adresse':           infos.adresse,
    'sfd-contacts':          infos.contacts,
    'sfd-nb-points':         infos.nb_points,
    'sfd-activites':         infos.activites,
    'sfd-evaluation-institutionnelle': infos.evaluation_institutionnelle,
  };
  Object.entries(mapInfos).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el && val !== undefined && val !== null) el.value = val;
  });

  // ── Tables 3/11/12/13 — Membres des organes ──
  const organes = mission.organes || {};
  const remplirOrgane = (tbodyId, membres) => {
    if (!membres || !membres.length) return;
    while ((document.getElementById(tbodyId)?.rows.length || 0) < membres.length) {
      ajouterMembreOrgane(tbodyId);
    }
    const tbody = document.getElementById(tbodyId);
    membres.forEach((m, i) => {
      const tr = tbody.rows[i];
      if (!tr) return;
      const inputs = tr.querySelectorAll('input');
      const select = tr.querySelector('select');
      if (inputs[0]) inputs[0].value = m.nom || '';
      if (select)    select.value    = m.fonction || '';
      if (inputs[1]) inputs[1].value = m.debut || '';
      if (inputs[2]) inputs[2].value = m.fin || '';
      if (inputs[3]) inputs[3].value = m.profession || '';
      if (inputs[4]) inputs[4].value = m.contact || '';
    });
  };
  remplirOrgane('tbody-ca', organes.ca);
  remplirOrgane('tbody-cc', organes.cc);
  remplirOrgane('tbody-cs', organes.cs);

  // ── Personnel de l'institution ──
  const personnel = mission.personnel || [];
  if (personnel.length) {
    while ((document.getElementById('tbody-personnel')?.rows.length || 0) < personnel.length) {
      ajouterLignePersonnel();
    }
    const tbody = document.getElementById('tbody-personnel');
    personnel.forEach((p, i) => {
      const tr = tbody.rows[i];
      if (!tr) return;
      const inputs = tr.querySelectorAll('input');
      const select = tr.querySelector('select');
      if (inputs[0]) inputs[0].value = p.nom || '';
      if (inputs[1]) inputs[1].value = p.fonction || '';
      if (inputs[2]) inputs[2].value = p.date_embauche || '';
      if (select)    select.value    = p.nature_contrat || '';
    });
  }

  // ── Table 4 — Suivi des recommandations de la précédente mission ──
  const suivi = mission.suivi_recommandations || [];
  if (suivi.length) {
    while ((document.getElementById('tbody-suivi-recomm-prec')?.rows.length || 0) < suivi.length) {
      ajouterLigneRecommPrec();
    }
    const tbody = document.getElementById('tbody-suivi-recomm-prec');
    suivi.forEach((s, i) => {
      const tr = tbody.rows[i];
      if (!tr) return;
      const inputs = tr.querySelectorAll('input');
      const select = tr.querySelector('select');
      if (inputs[0]) inputs[0].value = s.recommandation || '';
      if (select)    select.value    = s.statut || '';
      if (inputs[1]) inputs[1].value = s.observations || '';
    });
  }

  // ── Table 14 — Réunions ──
  const reunions = mission.reunions;
  if (reunions) {
    (reunions.annees || []).forEach((a, i) => {
      const el = document.getElementById(`reunion-annee${i + 1}`);
      if (el && a) el.value = a;
    });
    (reunions.lignes || []).forEach((l, i) => {
      ['a1', 'a2', 'a3', 'a4', 'total'].forEach(k => {
        const el = document.getElementById(`reunion-${i}-${k}`);
        if (el && l[k] !== undefined) el.value = l[k];
      });
    });
  }

  // ── Table 25 — Ratios prudentiels ──
  const ratios = mission.ratios;
  if (ratios) {
    (ratios.periodes || []).forEach((p, i) => {
      const el = document.getElementById(`ratio-p${i + 1}`);
      if (el && p) el.value = p;
    });
    (ratios.lignes || []).forEach(l => {
      ['p1', 'p2', 'p3', 'p4', 'obs'].forEach(k => {
        const el = document.getElementById(`ratio-${l.num}-${k}`);
        if (el && l[k] !== undefined) el.value = l[k];
      });
      if (typeof checkRatioConformite === 'function') checkRatioConformite(l.num);
    });
  }

  // ── "Sac" indicateurs_financiers : toutes les autres tables ──
  const bag = mission.indicateurs_financiers || {};

  (bag.indicateurs_activites || []).forEach((r, i) => {
    ['p1', 'p2', 'p3', 'p4'].forEach(k => {
      const el = document.getElementById(`indic-${i}-${k}`);
      if (el && r[k] !== undefined) el.value = r[k];
    });
    const varEl = document.getElementById(`indic-${i}-var`);
    if (varEl && r.variation !== undefined) varEl.value = r.variation;
  });

  (bag.evolution_ressources || []).forEach((r, i) => {
    const m = document.getElementById(`ress-${i}-montant`);
    const v = document.getElementById(`ress-${i}-var`);
    if (m) m.value = r.montant || '';
    if (v) v.value = r.variation || '';
  });
  (bag.evolution_emplois || []).forEach((r, i) => {
    const m = document.getElementById(`empl-${i}-montant`);
    const v = document.getElementById(`empl-${i}-var`);
    if (m) m.value = r.montant || '';
    if (v) v.value = r.variation || '';
  });

  (bag.resultats || []).forEach((r, i) => {
    const m = document.getElementById(`resu-${i}-montant`);
    const v = document.getElementById(`resu-${i}-var`);
    if (m) m.value = r.montant || '';
    if (v) v.value = r.variation || '';
  });
  (bag.fonds_propres || []).forEach((r, i) => {
    ['p1', 'p2', 'p3', 'p4'].forEach(k => {
      const el = document.getElementById(`fprop-${i}-${k}`);
      if (el && r[k] !== undefined) el.value = r[k];
    });
  });

  const epgEl = document.getElementById('epg-politique-procedures');
  if (epgEl && bag.epargne_politique_procedures) epgEl.value = bag.epargne_politique_procedures;

  // Nouveau format (objet) — les anciennes missions (format tableau) sont ignorées
  if (bag.structure_epargne && !Array.isArray(bag.structure_epargne)) {
    const se = bag.structure_epargne;
    const restaurerTableEpg = (prefix, table) => {
      if (!table) return;
      (table.lignes || []).forEach((r, i) => {
        ['qte', 'tauxq', 'val', 'tauxv'].forEach(k => {
          const el = document.getElementById(`${prefix}-${i}-${k}`);
          if (el && r[k] !== undefined) el.value = r[k];
        });
      });
      if (table.total) {
        ['qte', 'tauxq', 'val', 'tauxv'].forEach(k => {
          const el = document.getElementById(`${prefix}-total-${k}`);
          if (el && table.total[k] !== undefined) el.value = table.total[k];
        });
      }
      const comm = document.getElementById(`${prefix}-comm`);
      if (comm && table.commentaire) comm.value = table.commentaire;
    };
    restaurerTableEpg('epgnat', se.nature);
    restaurerTableEpg('epgtr',  se.tranches);
    restaurerTableEpg('epgact', se.activite);

    if (se.gros_epargnants) {
      (se.gros_epargnants.lignes || []).forEach((r, n) => {
        const nom  = document.getElementById(`epggros-${n}-nom`);
        const mnt  = document.getElementById(`epggros-${n}-mnt`);
        const taux = document.getElementById(`epggros-${n}-taux`);
        if (nom)  nom.value  = r.nom || '';
        if (mnt)  mnt.value  = r.montant || '';
        if (taux) taux.value = r.taux || '';
      });
      const map = {
        'epggros-enc10-mnt':   se.gros_epargnants.encours_10?.montant,
        'epggros-enc10-taux':  se.gros_epargnants.encours_10?.taux,
        'epggros-global-mnt':  se.gros_epargnants.encours_global?.montant,
        'epggros-global-taux': se.gros_epargnants.encours_global?.taux,
      };
      Object.entries(map).forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (el && val !== undefined && val !== null) el.value = val;
      });
      const comm = document.getElementById('epggros-comm');
      if (comm && se.gros_epargnants.commentaire) comm.value = se.gros_epargnants.commentaire;
    }
  }

  (bag.analyse_dossiers_credit || []).forEach((r, i) => {
    const el = document.getElementById(`anacred-${i}`);
    if (el) el.value = r.valeur || '';
  });

  if (bag.situation_globale_credit) {
    (bag.situation_globale_credit.lignes || []).forEach((r, i) => {
      const q  = document.getElementById(`sitcred-${i}-qte`);
      const tq = document.getElementById(`sitcred-${i}-tauxq`);
      const va = document.getElementById(`sitcred-${i}-val`);
      const tv = document.getElementById(`sitcred-${i}-tauxv`);
      if (q)  q.value  = r.quantite  || '';
      if (tq) tq.value = r.taux_qte || '';
      if (va) va.value = r.valeur   || '';
      if (tv) tv.value = r.taux_val || '';
    });
    const par30 = document.getElementById('sitcred-par30');
    const par90 = document.getElementById('sitcred-par90');
    if (par30) par30.value = bag.situation_globale_credit.par30 || '';
    if (par90) par90.value = bag.situation_globale_credit.par90 || '';
  }

  const remplirPretsLies = (tbodyId, lignes) => {
    if (!lignes || !lignes.length) return;
    while ((document.getElementById(tbodyId)?.rows.length || 0) < lignes.length) {
      ajouterLignePretLie(tbodyId);
    }
    const tbody = document.getElementById(tbodyId);
    lignes.forEach((l, i) => {
      const tr = tbody.rows[i];
      if (!tr) return;
      const inputs = tr.querySelectorAll('input');
      if (inputs[0]) inputs[0].value = l.titulaire || '';
      if (inputs[1]) inputs[1].value = l.fonction_organe || '';
      if (inputs[2]) inputs[2].value = l.montant_initial || '';
      if (inputs[3]) inputs[3].value = l.montant_restant || '';
      if (inputs[4]) inputs[4].value = l.epargne_nantie || '';
      if (inputs[5]) inputs[5].value = l.risque_reel || '';
      if (inputs[6]) inputs[6].value = l.retard_jours || '';
    });
  };
  if (bag.prets_personnes_liees) {
    remplirPretsLies('tbody-prets-dirigeants',    bag.prets_personnes_liees.dirigeants);
    remplirPretsLies('tbody-prets-ex-dirigeants', bag.prets_personnes_liees.ex_dirigeants);
    remplirPretsLies('tbody-prets-salaries',      bag.prets_personnes_liees.salaries);
  }

  (bag.dix_plus_gros_risques || []).forEach((r, i) => {
    const tr = document.getElementById('tbody-10-gros-risques')?.rows[i];
    if (!tr) return;
    const inputs = tr.querySelectorAll('input');
    if (inputs[0]) inputs[0].value = r.emprunteur || '';
    if (inputs[1]) inputs[1].value = r.montant_initial || '';
    if (inputs[2]) inputs[2].value = r.montant_restant || '';
    if (inputs[3]) inputs[3].value = r.epargne_nantie || '';
    if (inputs[4]) inputs[4].value = r.risque_reel || '';
    if (inputs[5]) inputs[5].value = r.retard_jours || '';
  });
  (bag.creances_virees_perte || []).forEach((r, i) => {
    ['p1', 'p2', 'p3', 'p4'].forEach(k => {
      const el = document.getElementById(`crperte-${i}-${k}`);
      if (el && r[k] !== undefined) el.value = r[k];
    });
  });

  if (bag.taux_usure && bag.taux_usure.length) {
    while ((document.getElementById('tbody-taux-usure')?.rows.length || 0) < bag.taux_usure.length) {
      ajouterLigneTauxUsure();
    }
    const tbody = document.getElementById('tbody-taux-usure');
    bag.taux_usure.forEach((r, i) => {
      const tr = tbody.rows[i];
      if (!tr) return;
      const inputs = tr.querySelectorAll('input');
      if (inputs[0]) inputs[0].value = r.emprunteur || '';
      if (inputs[1]) inputs[1].value = r.montant_pret || '';
      if (inputs[2]) inputs[2].value = r.taux_annuel || '';
      if (inputs[3]) inputs[3].value = r.nb_echeances || '';
      if (inputs[4]) inputs[4].value = r.teg || '';
    });
  }

  if (bag.narratifs) {
    Object.entries(bag.narratifs).forEach(([key, val]) => {
      const el = document.getElementById(`narr-${key}`);
      if (el && val) el.value = val;
    });
  }
}