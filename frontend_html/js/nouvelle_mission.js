/* ================================================
   DSFD — nouvelle_mission.js
   Logique complète : blocs, drawer, formulaires
   (Version fusionnée : nouvelles activités détaillées
    + correctifs cache volets, accès par lien, rôles,
    inspecteurs, sauvegarde rapport)
   ================================================ */

/* ════════════════════════════════════════════
   DATA — 10 volets de contrôle
════════════════════════════════════════════ */
const BLOCS = [
  {
    id: 'si', index: '7', icon: 'fas fa-server', color: '#3B82F6',
    name: "Système d'information",
    desc: "Fiabilité, sécurité physique & logique, plan de secours, acquisitions SI",
    form: buildSI
  },
  {
    id: 'sfd', index: '11.1', icon: 'fas fa-exclamation-triangle', color: '#EF4444',
    name: "SFD en difficulté",
    desc: "Dispositifs de gestion des risques, procédures collectives, plan de redressement",
    form: buildSFD
  },
  {
    id: 'sec', index: '8', icon: 'fas fa-shield-alt', color: '#8B5CF6',
    name: "Sécurité",
    desc: "Encaisses, coffres, archivage, sécurité incendie et sécurité générale",
    form: buildSecurite
  },
  {
    id: 'rep', index: '10', icon: 'fas fa-chart-bar', color: '#10B981',
    name: "Reporting",
    desc: "Indicateurs périodiques, ratios prudentiels, rapport annuel",
    form: buildReporting
  },
  {
    id: 'fin', index: '6', icon: 'fas fa-calculator', color: '#F59E0B',
    name: "Finance et Comptabilité",
    desc: "Trésorerie, obligations comptables, bilan, charges, produits, consolidation",
    form: buildFinance
  },
  {
    id: 'cred', index: '4', icon: 'fas fa-hand-holding-usd', color: '#06B6D4',
    name: "Crédit",
    desc: "Politique de crédit, étude des dossiers, mise en place, suivi, recouvrement, comptabilisation",
    form: buildCredit
  },
  {
    id: 'autres', index: '9', icon: 'fas fa-ellipsis-h', color: '#6B7280',
    name: "Autres volets",
    desc: "Fonds de sécurité, immobilisations, stocks, personnel, blanchiment, tarification, taux d'usure",
    form: buildAutresVolets
  },
  {
    id: 'gov', index: '2', icon: 'fas fa-university', color: '#EC4899',
    name: "Création et Gouvernance",
    desc: "Constitution, gouvernance, conformité SA/SARL, contrôle externe, organe exécutif, déontologie",
    form: buildGouvernance
  },
  {
    id: 'ci', index: '3', icon: 'fas fa-search', color: '#0EA5E9',
    name: "Contrôle interne",
    desc: "Dispositif de CI, gestion des risques, plan d'affaires, fonction support",
    form: buildControleInterne
  },
  {
    id: 'epg', index: '5', icon: 'fas fa-piggy-bank', color: '#84CC16',
    name: "Épargne",
    desc: "Collecte des ressources, comptabilisation de l'épargne, comptes dormants",
    form: buildEpargne
  },
];

const completed = new Set();

// FIX : cache des données déjà saisies pour chaque volet (clé = volet_code)
window._voletsCache = window._voletsCache || {};

/* ════════════════════════════════════════════
   RENDU GRILLE
════════════════════════════════════════════ */
function renderGrid() {
  const grid = document.getElementById('blocs-grid');
  grid.innerHTML = '';

  BLOCS.forEach((b, i) => {
    const done = completed.has(b.id);
    const card = document.createElement('div');
    card.className = 'bloc-card' + (done ? ' done' : '');
    card.innerHTML = `
      <div class="bloc-top">
        <div class="bloc-icon" style="background:${b.color}18;color:${b.color}">
          <i class="${b.icon}"></i>
        </div>
        <div class="bloc-arrow"><i class="fas fa-arrow-right"></i></div>
      </div>
      <div>
        <div class="bloc-name">${b.name}</div>
        <div class="bloc-desc">${b.desc}</div>
      </div>
      <div class="bloc-status">
        <div class="status-dot"></div>
        ${done ? 'Complété' : 'Non renseigné'}
      </div>
    `;
    card.onclick = () => openBloc(i);
    grid.appendChild(card);
  });

  const pct = Math.round(completed.size / BLOCS.length * 100);
  document.getElementById('ps-fill').style.width = pct + '%';
  document.getElementById('ps-count').textContent = `${completed.size} / ${BLOCS.length} complétés`;
}

/* ════════════════════════════════════════════
   INFOS GÉNÉRALES
════════════════════════════════════════════ */
function syncGlobal() {}

// getGlobal défini plus bas avec support inspecteurs multiples

/* ════════════════════════════════════════════
   DRAWER — ouvrir / fermer / valider
════════════════════════════════════════════ */
let currentBloc = null;

function openBloc(i) {
  const b = BLOCS[i];
  currentBloc = b;

  document.getElementById('dh-title').textContent  = b.name;
  document.getElementById('dh-index').textContent  = b.index !== '—' ? `Index ${b.index}` : 'Volet de contrôle';
  document.getElementById('dh-icon').innerHTML     = `<i class="${b.icon}"></i>`;
  document.getElementById('dh-icon').style.color   = b.color;
  document.getElementById('drawer-body').innerHTML = b.form(b, getGlobal());

  document.getElementById('overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  attachHandlers();

  // ── FIX : restaurer les données déjà saisies pour ce volet, si elles existent ──
  const donneesSauvegardees = window._voletsCache && window._voletsCache[b.id];
  if (donneesSauvegardees && typeof restaurerDonneesDrawer === 'function') {
    restaurerDonneesDrawer(donneesSauvegardees);
  }
}

function closeDrawer(e) {
  if (e && e.target !== document.getElementById('overlay')) return;
  document.getElementById('overlay').classList.remove('open');
  document.body.style.overflow = '';
  currentBloc = null;
}

/* ════════════════════════════════════════════
   COMMENTAIRES GÉNÉRAUX (X.0) — destinés au rapport
   Ces commentaires sont distincts des commentaires
   de sous-section, qui restent sur la plateforme.
════════════════════════════════════════════ */
const COMMENTAIRE_GENERAL_ID = {
  si:     'comm-general-si',
  sfd:    'comm-general-sfd',
  sec:    'comm-general-sec',
  rep:    'comm-general-rep',
  fin:    'comm-general-fin',
  cred:   'comm-general-cred',
  autres: 'comm-general-av',
  gov:    'comm-general-gov',
  ci:     'comm-general-ci',
  epg:    'comm-general-epg',
  lbcft_99:    'comm-general-lbcft',
  cameli_synth: 'comm-general-cameli',
};

function getCommentaireGeneral(blocId) {
  const inputId = COMMENTAIRE_GENERAL_ID[blocId];
  if (!inputId) return '';
  const el = document.getElementById(inputId);
  return el ? el.value.trim() : '';
}

async function validerBloc() {
  if (!currentBloc) return;

  // Sauvegarder les données avant de fermer
  const missionId = new URLSearchParams(window.location.search).get('id');
  if (!missionId) {
    alert("⚠️ Enregistrez d'abord la mission avant de valider un volet.");
    return;
  }

  // Récupère le commentaire général (X.0), à part des commentaires de sous-section
  currentBloc.commentaire_general = getCommentaireGeneral(currentBloc.id);

  const ok = await sauvegarderVolet(currentBloc);
  if (!ok) return;

  completed.add(currentBloc.id);

  // Rester sur la grille du type actif (CAMELI, LBCFT, global...)
  const typeVal = document.getElementById('g-type').value;
  if (typeVal && TYPE_CONFIG[typeVal] && TYPE_CONFIG[typeVal].blocs !== null) {
    renderCustomGrid(TYPE_CONFIG[typeVal].blocs);
  } else {
    renderGrid();
  }

  document.getElementById('overlay').classList.remove('open');
  document.body.style.overflow = '';
  currentBloc = null;
  showToast('Volet validé et sauvegardé ✅');
}

/* ════════════════════════════════════════════
   HANDLERS DYNAMIQUES
════════════════════════════════════════════ */
function attachHandlers() {
  document.querySelectorAll('.radio-pill').forEach(pill => {
    pill.addEventListener('click', function () {
      const name = this.querySelector('input').name;
      document.querySelectorAll(`.radio-pill input[name="${name}"]`).forEach(inp => {
        inp.closest('.radio-pill').classList.remove('on');
      });
      this.classList.add('on');
    });
  });

  document.querySelectorAll('.ctrl-table input[type=radio]').forEach(r => {
    r.addEventListener('change', function () {
      const tr = this.closest('tr');
      tr.style.background =
        this.value === 'eleve'  ? '#FEF2F2' :
        this.value === 'moyen'  ? '#FFFBEB' : '#F0FDF4';
    });
  });
}

/* ════════════════════════════════════════════
   TOAST
════════════════════════════════════════════ */
function showToast(msg) {
  const t = document.getElementById('toast');
  document.getElementById('toast-msg').textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

/* ════════════════════════════════════════════
   UTILITAIRES FORMULAIRES
════════════════════════════════════════════ */
function setLacune(btn, type) {
  btn.closest('.lacune-wrap').querySelectorAll('.lacune-btn').forEach(b => b.classList.remove('oui', 'non'));
  btn.classList.add(type);
}

function addRow(tableId, cellsHtml) {
  const tbody = document.querySelector(`#${tableId} tbody`);
  if (!tbody) return;
  const tr = document.createElement('tr');
  tr.innerHTML = cellsHtml;
  tbody.appendChild(tr);
}

let annCount = 2;
function addAnn() { addAnnTo('ann-list'); }

function annRowHTML(num) {
  return `
    <div class="ann-num">${num}</div>
    <input type="text" placeholder="Référence ou description de l'annexe…"/>
    <label class="ann-file-btn" title="Importer un fichier">
      <i class="fas fa-paperclip"></i>
      <input type="file" style="display:none" onchange="handleAnnFile(this)"/>
    </label>
    <span class="ann-file-name"></span>
    <button class="del-btn" onclick="this.closest('.ann-row').remove()"><i class="fas fa-times"></i></button>
  `;
}

function addAnnTo(listId) {
  annCount++;
  const list = document.getElementById(listId);
  if (!list) return;
  const div = document.createElement('div');
  div.className = 'ann-row';
  div.innerHTML = annRowHTML(String(annCount).padStart(2, '0'));
  list.appendChild(div);
}

function handleAnnFile(input) {
  const file = input.files[0];
  if (!file) return;
  const row = input.closest('.ann-row');
  row.querySelector('.ann-file-name').textContent = file.name;
  const txt = row.querySelector('input[type=text]');
  if (txt && !txt.value) txt.value = file.name;
}

// Générateur bloc annexes réutilisable (avec import fichier dès le départ)
function buildAnnexes(id) {
  return `
    <div class="sub-title" style="margin-top:14px"><i class="fas fa-paperclip"></i> Annexes</div>
    <div class="ann-list" id="ann-${id}">
      <div class="ann-row">${annRowHTML('01')}</div>
      <div class="ann-row">${annRowHTML('02')}</div>
    </div>
    <button class="add-btn" style="margin-top:8px" onclick="addAnnTo('ann-${id}')">
      <i class="fas fa-plus"></i> Ajouter une annexe
    </button>
  `;
}

/* ════════════════════════════════════════════
   BUILDER — Système d'information (Index 7)
════════════════════════════════════════════ */
const SI_CTRL_POINTS = [
  "Adéquation et fiabilité du SIG aux besoins du SFD",
  "Conformité et fiabilité de l'informatique (schéma directeur, RH SI)",
  "Concision et exhaustivité de l'information produite (BCEAO)",
  "Impossibilité de modification d'une journée comptable clôturée",
  "Production automatisée des documents de synthèse (BCEAO)",
  "Production automatisée des états de gestion",
  "Sécurité physique des locaux informatiques",
  "Sécurité logique (accès, mots de passe, habilitations)",
  "Plan de secours (existence, tests, responsable, cellule de crise)",
  "Acquisitions (études, cahier des charges, comité de pilotage, tests)"
];

const SI_ACTES = [
  "Vérifier l'adéquation et la fiabilité du SIG aux besoins du SFD",
  "Évaluer la conformité et la fiabilité de l’informatique — s’assurer de l’existence d’un schéma directeur informatique",
  "Évaluer la conformité et la fiabilité de l’informatique — s’assurer de la qualité et la suffisance en nombre des ressources humaines en charge de la gestion du système d’information ;",
  "Évaluer la conformité et la fiabilité de l’informatique — s’assurer de la concision et de l’exhaustivité de l’information produite pour une identification et un enregistrement des opérations conformes aux instructions BCEAO ;",
  "Évaluer la conformité et la fiabilité de l’informatique — s’assurer de l’impossibilité d’une modification d’une journée comptable clôturée ;  S’assurer de la production automatisée des documents de synthèse suivant les instructions BCEAO ;",
  "Évaluer la conformité et la fiabilité de l’informatique — s’assurer de la production automatisée des états de gestion",
  "Évaluer la sécurité physique — vérifier qu’une liste exhaustive et actuelle des personnes ayant accès aux locaux informatiques est constituée ;",
  "Évaluer la sécurité physique — s’assurer qu’un contrôle d’identité est effectué avant l’accès aux locaux informatiques ;",
  "Évaluer la sécurité physique — s’assurer que les heures d’accès sont dûment stipulées ;",
  "Évaluer la sécurité physique — s’assurer qu’en dehors de ces heures, les personnes présentes dans les locaux informatiques sont munies d’une autorisation spéciale ;",
  "Évaluer la sécurité physique — contrôler l’existence de contrats d’assurance ;",
  "Évaluer la sécurité physique — s’assurer de la présence des protections incendie adéquates (fait sur le même point) ;",
  "Évaluer la sécurité physique — s’assurer que le serveur est placé au centre des locaux l’abritant ;",
  "Évaluer la sécurité physique — s’assurer que les logiciels de base, les applicatifs et les données sont conservés dans des armoires ignifugées ;",
  "Évaluer la sécurité physique — vérifier que les fichiers magnétiques sont identifiés à l’aide d’une étiquette interne ou externe comportant des informations sur l’intitulé et la date de la dernière mise à jour du fichier ;",
  "Évaluer la sécurité physique — s’assurer qu’un double des fichiers est conservé à l’extérieur des locaux informatiques dans des coffres ignifugés et qu’ils pourront être facilement reconstitués ;",
  "Évaluer la sécurité physique — s’assurer que les duplicatas des fichiers sont également mis à jour à chaque modification des fichiers ;",
  "Évaluer la sécurité physique — s’assurer de la qualité des fichiers duplicata et de leurs supports ;",
  "Évaluer la sécurité physique — s’assurer que les fichiers sont conservés sur une durée suffisante conformément aux instructions BCEAO pour faire face à des demandes de justification ;",
  "Évaluer la sécurité physique — veiller au respect de la norme de sécurité relative à la conservation extraterritoriale des fichiers",
  "Évaluer la sécurité logique — s’assurer que l’accès au système informatique est limité aux heures ouvrables stipulées dans les procédures ;",
  "Évaluer la sécurité logique — s’assurer de la traçabilité des accès au système ;",
  "Évaluer la sécurité logique — contrôler que des habilitations spéciales pour un usage en dehors de ces heures sont délivrées ;",
  "Évaluer la sécurité logique — contrôler l’existence d’un mot de passe ou d’un code d’accès au système pour chaque utilisateur ;",
  "Évaluer la sécurité logique — vérifier l’effectivité des habilitations pour chaque catégorie d’opération ;",
  "Évaluer la sécurité logique — s’assurer que les mots de passe sont régulièrement modifiés ;",
  "Évaluer la sécurité logique — s’assurer que le système d’attribution des mots de passe garantit la confidentialité de ceux-ci ;",
  "Évaluer la sécurité logique — s’assurer que le mot de passe limite l’accès de l’employé aux opérations le concernant ;",
  "Évaluer la sécurité logique — s’assurer que lors du départ d’un agent, les habilitations dont il bénéficie sont immédiatement supprimées ;",
  "Évaluer la sécurité logique — s’assurer que l’accès aux applications en exploitation est interdit aux analystes et aux programmeurs sans une autorisation particulière ;",
  "Évaluer la sécurité logique — s’assurer que des procédures formelles garantissent l’intégrité des traitements ;",
  "Évaluer la sécurité logique — vérifier que les procédures d’exploitation sont sous la supervision d’un responsable ;",
  "Évaluer la sécurité logique — s’assurer que la saisie est décentralisée au niveau des utilisateurs et qu’elle ne dépend pas du département informatique ;",
  "Évaluer la sécurité logique — vérifier que la sécurité des systèmes est assurée par un responsable nommément désigné ;",
  "Évaluer la sécurité logique — s’assurer que toutes les modifications de programme sont déclenchées par une demande écrite des utilisateurs après autorisation d’une personne habilitée ;",
  "Évaluer la sécurité logique — vérifier qu’à chaque modification des tests sont effectués et que la documentation du programme et les fichiers de sauvegarde sont complétés et mis à jour ;",
  "Évaluer la sécurité logique — vérifier que le système d’information permet la prise en compte des opérations intervenues après la clôture (journées supplémentaires)",
  "Évaluer la sécurité logique — s’assurer que les états informatiques éditables sont recensés et font l’objet d’édition périodique et de rapprochement avec les données comptables correspondantes",
  "Évaluer le plan de secours — s’assurer de l’existence du plan de secours ;",
  "Évaluer le plan de secours — organiser des tests du plan de secours avec l’entité Responsable ;",
  "Évaluer le plan de secours — vérifier la périodicité des tests du plan de secours ;",
  "Évaluer le plan de secours — s’assurer qu’un responsable de ce plan a été nommément désigné ;",
  "Évaluer le plan de secours — s’assurer qu’une cellule de crise chargée de conduire ce plan a été constituée ;",
  "Évaluer le plan de secours — s’assurer que le plan de secours inclut une génération au support de l’ancien logiciel",
  "Évaluer les acquisitions — s’assurer de l’existence d’une étude d’opportunité préalable pour évaluer l’utilité et la rentabilité du projet ;",
  "Évaluer les acquisitions — s’assurer de l’existence d’un cahier des charges ou d’une expression des besoins formulée par les utilisateurs d’une manière claire, complète ;",
  "Évaluer les acquisitions — s’assurer de l’existence d’un comité de pilotage regroupant les utilisateurs, les informaticiens et les auditeurs pour suivre les projets importants pour les études, réalisations, tests et réception de produits finis ;",
  "Évaluer les acquisitions — s’assurer de la réalisation de tests suffisants permettant de s’assurer que le produit fonctionne correctement et conformément aux spécifications ;",
  "Évaluer les acquisitions — s’assurer que le produit fini est livré avec la documentation adéquate permettant ultérieurement de retrouver les éléments nécessaires, pour modifier ou développer l’application ;",
  "Évaluer les acquisitions — vérifier que des tests suffisants sont réalisés pour s’assurer que le produit fonctionne correctement et conformément à l’expression du besoin du service demandeur et au bon de commande ;",
  "Évaluer les acquisitions — s’assurer que les contrats d’assurance et de maintenance liés aux acquisitions sont suivis et respectés ;",
  "Évaluer les acquisitions — s’assurer que la maintenance du parc informatique est régulière ;",
  "Évaluer les acquisitions — vérifier le respect des autres clauses contractuelles relatives à la gestion du parc informatique",
];

function buildSI(bloc, g) {
  const ctrlRows = SI_CTRL_POINTS.map((pt, i) => `
    <tr>
      <td>${i + 1}. ${pt}</td>
      <td class="eval-cell"><input type="radio" name="ctrl${i}" value="eleve"/></td>
      <td class="eval-cell"><input type="radio" name="ctrl${i}" value="moyen"/></td>
      <td class="eval-cell"><input type="radio" name="ctrl${i}" value="faible"/></td>
    </tr>`).join('');

  const actRows = SI_ACTES.map((a, i) => `<tr>
      <td class="act-num">${i + 1}</td>
      <td>${a}</td>
      <td><input type="text" placeholder="Initiales" style="width:68px;text-align:center"/></td>
      <td>
        <div class="lacune-wrap">
          <button class="lacune-btn" onclick="setLacune(this,'oui')">O</button>
          <button class="lacune-btn" onclick="setLacune(this,'non')">N</button>
        </div>
      </td>
      <td><textarea class="act-comment" rows="1" placeholder="Commentaire…"></textarea></td>
    </tr>`).join('');

  return `
    <div class="sub-title"><i class="fas fa-folder"></i> 7.0 — Fiche de Rubrique</div>

    <div class="info-box">
      <i class="fas fa-info-circle"></i>
      SFD : <strong>${g.sfd || '—'}</strong> &nbsp;|&nbsp;
      Inspecteur : <strong>${g.inspecteur || '—'}</strong> &nbsp;|&nbsp;
      Chef de mission : <strong>${g.chef || '—'}</strong>
    </div>

    <p style="font-size:12px;color:var(--text-muted);margin-bottom:12px">
      Pour chaque point de contrôle, cochez le niveau de risque identifié.
    </p>
    <table class="ctrl-table">
      <thead><tr>
        <th style="width:58%">Point de contrôle</th>
        <th class="eval-cell">Élevé</th>
        <th class="eval-cell">Moyen</th>
        <th class="eval-cell">Faible</th>
      </tr></thead>
      <tbody>${ctrlRows}</tbody>
    </table>

    <div class="sub-title" style="margin-top:22px"><i class="fas fa-chart-line"></i> Évolution depuis la dernière inspection</div>
    <div class="radio-row">
      <label class="radio-pill"><input type="radio" name="evol" value="amelioree"/> <i class="fas fa-arrow-up" style="color:#22C55E"></i> Améliorée</label>
      <label class="radio-pill"><input type="radio" name="evol" value="stable"/> <i class="fas fa-minus" style="color:#F59E0B"></i> Stable</label>
      <label class="radio-pill"><input type="radio" name="evol" value="deterioree"/> <i class="fas fa-arrow-down" style="color:#EF4444"></i> Détériorée</label>
    </div>

    <div class="sub-title" style="margin-top:22px"><i class="fas fa-comment-alt"></i> Commentaires pour le rapport (7.0)</div>
    <div class="form-group-full">
      <textarea rows="3" id="comm-general-si" placeholder="Synthèse à intégrer dans le rapport final…"></textarea>
    </div>

    <div class="sub-title" style="margin-top:28px"><i class="fas fa-file-signature"></i> 7.1 — Feuille de Travail</div>

    <div class="form-group-full" style="margin-bottom:10px">
      <label>Références</label>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <input type="text" placeholder="Référence 1 (ex : Instruction BCEAO n°…)"/>
        <input type="text" placeholder="Référence 2"/>
      </div>
    </div>

    <div style="overflow-x:auto;margin-top:16px">
      <table class="act-table">
        <thead><tr>
          <th style="width:38px">N°</th>
          <th>Activités</th>
          <th style="width:82px;text-align:center">Paraphe</th>
          <th style="width:90px;text-align:center">Lacune</th>
          <th>Commentaire</th>
        </tr></thead>
        <tbody>${actRows}</tbody>
      </table>
    </div>

    <div class="sub-title" style="margin-top:22px"><i class="fas fa-clock"></i> Suivis</div>
    <table class="dyn-table" id="suivi-tbl">
      <thead><tr>
        <th>Point</th><th>Suivi</th><th>Responsable</th><th style="width:120px">Échéance</th>
      </tr></thead>
      <tbody>
        <tr>
          <td><input type="text" placeholder="Point…"/></td>
          <td><input type="text" placeholder="Action…"/></td>
          <td><input type="text" placeholder="Responsable…"/></td>
          <td><input type="date"/></td>
        </tr>
      </tbody>
    </table>
    <button class="add-btn" onclick="addRow('suivi-tbl','<td><input type=text placeholder=Point…/></td><td><input type=text placeholder=Action…/></td><td><input type=text placeholder=Responsable…/></td><td><input type=date/></td>')">
      <i class="fas fa-plus"></i> Ajouter une ligne
    </button>

    <div class="sub-title" style="margin-top:22px"><i class="fas fa-exclamation-triangle"></i> Constats et Recommandations</div>
    <table class="dyn-table" id="const-tbl">
      <thead><tr><th style="width:70px">Point</th><th>Constats</th><th>Recommandations</th></tr></thead>
      <tbody>
        <tr>
          <td><input type="text" placeholder="Réf…"/></td>
          <td><textarea rows="2" placeholder="Décrivez le constat…"></textarea></td>
          <td><textarea rows="2" placeholder="Recommandation…"></textarea></td>
        </tr>
      </tbody>
    </table>
    <button class="add-btn" onclick="addRow('const-tbl','<td><input type=text placeholder=Réf…/></td><td><textarea rows=2 placeholder=Décrivez le constat…></textarea></td><td><textarea rows=2 placeholder=Recommandation…></textarea></td>')">
      <i class="fas fa-plus"></i> Ajouter une ligne
    </button>

    <div class="sub-title" style="margin-top:22px"><i class="fas fa-comment-alt"></i> Commentaires</div>
    <div class="form-group-full">
      <textarea rows="3" placeholder="Commentaires à intégrer dans le rapport final…"></textarea>
    </div>

    <div class="sub-title" style="margin-top:22px"><i class="fas fa-paperclip"></i> Annexes</div>
    <div class="ann-list" id="ann-list">
      <div class="ann-row">
        <div class="ann-num">01</div>
        <input type="text" placeholder="Référence ou description de l'annexe…"/>
        <label class="ann-file-btn" title="Importer un fichier">
          <i class="fas fa-paperclip"></i>
          <input type="file" style="display:none" onchange="handleAnnFile(this)"/>
        </label>
        <span class="ann-file-name"></span>
        <button class="del-btn" onclick="this.closest('.ann-row').remove()"><i class="fas fa-times"></i></button>
      </div>
      <div class="ann-row">
        <div class="ann-num">02</div>
        <input type="text" placeholder="Référence ou description de l'annexe…"/>
        <label class="ann-file-btn" title="Importer un fichier">
          <i class="fas fa-paperclip"></i>
          <input type="file" style="display:none" onchange="handleAnnFile(this)"/>
        </label>
        <span class="ann-file-name"></span>
        <button class="del-btn" onclick="this.closest('.ann-row').remove()"><i class="fas fa-times"></i></button>
      </div>
    </div>
    <button class="add-btn" style="margin-top:8px" onclick="addAnn()">
      <i class="fas fa-plus"></i> Ajouter une annexe
    </button>
  `;
}

/* ════════════════════════════════════════════
   BUILDER — SFD en difficulté (Index 11.1)
════════════════════════════════════════════ */
function buildSFD(bloc, g) {
  return `
    <div class="info-box">
      <i class="fas fa-info-circle"></i>
      SFD : <strong>${g.sfd || '—'}</strong> &nbsp;|&nbsp;
      Inspecteur : <strong>${g.inspecteur || '—'}</strong> &nbsp;|&nbsp;
      Chef de mission : <strong>${g.chef || '—'}</strong>
    </div>

    <div class="sub-title"><i class="fas fa-info-circle"></i> Identification</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
      <div class="form-group-full">
        <label>Réviseur</label>
        <input type="text" placeholder="Nom du réviseur"/>
      </div>
      <div class="form-group-full">
        <label>Date</label>
        <input type="date"/>
      </div>
    </div>

    <div class="info-box" style="background:#F0FDF4;border-color:#86EFAC;color:#166534">
      <i class="fas fa-bullseye" style="color:#16A34A"></i>
      <span><strong>Objectif :</strong> S'assurer de la mise en place de dispositifs pour gérer les risques liés aux SFD en difficulté.</span>
    </div>

    <div class="sub-title" style="margin-top:20px"><i class="fas fa-book"></i> Références</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:4px">
      <div class="form-group-full">
        <label>Référence 1</label>
        <input type="text" placeholder="Ex : Instruction BCEAO n°…"/>
      </div>
      <div class="form-group-full">
        <label>Référence 2</label>
        <input type="text" placeholder="Ex : Loi OHADA, article…"/>
      </div>
    </div>

    <div class="sub-title" style="margin-top:22px"><i class="fas fa-clipboard-list"></i> Notes — Activités de contrôle</div>
    <p style="font-size:12px;color:var(--text-muted);margin-bottom:10px">
      Apposez votre paraphe et indiquez si une lacune a été détectée.
    </p>

    <table class="act-table">
      <thead>
        <tr>
          <th style="width:38px">N°</th>
          <th>Activités</th>
          <th style="width:82px;text-align:center">Paraphe</th>
          <th style="width:90px;text-align:center">Lacune</th>
          <th>Commentaire</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="act-num">1</td>
          <td>
            <strong>SFD en difficulté avant les procédures collectives</strong>
            <ul>
              <li>Mettre en œuvre des méthodes de prévisions basées sur des indicateurs d'alerte</li>
              <li>Définir les actions à engager en fonction du niveau d'alerte</li>
              <li>Suivre de façon rapprochée les mesures prises et les rapports produits par les SFD en difficulté</li>
            </ul>
          </td>
          <td><input type="text" placeholder="Initiales" style="width:68px;text-align:center"/></td>
          <td>
            <div class="lacune-wrap">
              <button class="lacune-btn" onclick="setLacune(this,'oui')">O</button>
              <button class="lacune-btn" onclick="setLacune(this,'non')">N</button>
            </div>
          </td>
          <td><textarea class="act-comment" rows="1" placeholder="Commentaire…"></textarea></td>
        </tr>
        <tr>
          <td class="act-num">2</td>
          <td>
            <strong>SFD soumis aux procédures collectives</strong>
            <ul>
              <li>Vérifier la mise en œuvre du plan de redressement et son adéquation</li>
              <li>Échanger avec le Commissaire aux Comptes sur la continuité de l'exploitation et la procédure d'alerte</li>
              <li>Mettre un accent particulier sur l'analyse financière (ratios de solvabilité, liquidité, couverture des emplois stables)</li>
              <li>Vérifier les recours du SFD auprès du fonds de solidarité pour les SFD constitués en réseau</li>
              <li>S'assurer que l'institution a mis en place un système d'indicateurs permettant de détecter les problèmes de trésorerie</li>
              <li>Apporter une attention particulière aux opérations pouvant affecter l'égalité des actionnaires</li>
              <li>Vérifier l'assurance des actifs</li>
              <li>Vérifier le niveau des pertes</li>
              <li>S'assurer que les capitaux propres sont inférieurs à la moitié du capital social</li>
              <li>Évaluer la gouvernance</li>
              <li>S'assurer qu'il n'y a pas de conflit avec le personnel</li>
              <li>Vérifier les paiements de dettes antérieures à la décision de cessation des paiements</li>
              <li>Vérifier que l'Administrateur provisoire a présenté tous les trois mois un rapport au ministre sur les opérations accomplies et l'évolution de la situation financière</li>
              <li>Vérifier si l'administrateur a respecté le délai d'une période n'excédant pas une année pour présenter un rapport précisant la nature, l'origine et l'importance des difficultés</li>
              <li>S'assurer qu'en cas de désignation d'un administrateur provisoire par le Ministre, le syndic nommé par la juridiction compétente ne surveille pas les opérations de gestion (art. 52 al. 2 Acte Uniforme OHADA)</li>
              <li>Vérifier que le syndic désigné par la juridiction ne procède pas aux opérations de liquidation portant sur le fonds de commerce ni à des licenciements</li>
              <li>Vérifier que le syndic a établi le relevé de tous les créanciers</li>
              <li>S'assurer que les titulaires des comptes sont remboursés immédiatement après les créanciers de frais de justice</li>
              <li>S'assurer qu'un compte spécial a été ouvert par le liquidateur pour y verser toute somme reçue</li>
            </ul>
          </td>
          <td><input type="text" placeholder="Initiales" style="width:68px;text-align:center"/></td>
          <td>
            <div class="lacune-wrap">
              <button class="lacune-btn" onclick="setLacune(this,'oui')">O</button>
              <button class="lacune-btn" onclick="setLacune(this,'non')">N</button>
            </div>
          </td>
          <td><textarea class="act-comment" rows="1" placeholder="Commentaire…"></textarea></td>
        </tr>
      </tbody>
    </table>

    <div class="sub-title" style="margin-top:22px"><i class="fas fa-clock"></i> Suivis</div>
    <table class="dyn-table" id="suivi-tbl">
      <thead><tr>
        <th>Point</th><th>Suivi</th><th>Responsable</th><th style="width:120px">Échéance</th>
      </tr></thead>
      <tbody>
        <tr>
          <td><input type="text" placeholder="Point…"/></td>
          <td><input type="text" placeholder="Action de suivi…"/></td>
          <td><input type="text" placeholder="Responsable…"/></td>
          <td><input type="date"/></td>
        </tr>
      </tbody>
    </table>
    <button class="add-btn" onclick="addRow('suivi-tbl','<td><input type=text placeholder=Point…/></td><td><input type=text placeholder=Action…/></td><td><input type=text placeholder=Responsable…/></td><td><input type=date/></td>')">
      <i class="fas fa-plus"></i> Ajouter une ligne
    </button>

    <div class="sub-title" style="margin-top:22px"><i class="fas fa-exclamation-triangle"></i> Constats et Recommandations</div>
    <table class="dyn-table" id="const-tbl">
      <thead><tr><th style="width:70px">Point</th><th>Constats</th><th>Recommandations</th></tr></thead>
      <tbody>
        <tr>
          <td><input type="text" placeholder="Réf…"/></td>
          <td><textarea rows="2" placeholder="Décrivez le constat…"></textarea></td>
          <td><textarea rows="2" placeholder="Recommandation…"></textarea></td>
        </tr>
      </tbody>
    </table>
    <button class="add-btn" onclick="addRow('const-tbl','<td><input type=text placeholder=Réf…/></td><td><textarea rows=2 placeholder=Décrivez le constat…></textarea></td><td><textarea rows=2 placeholder=Recommandation…></textarea></td>')">
      <i class="fas fa-plus"></i> Ajouter une ligne
    </button>

    <div class="sub-title" style="margin-top:22px"><i class="fas fa-comment-alt"></i> Commentaires pour le rapport</div>
    <div class="form-group-full">
      <textarea rows="4" id="comm-general-sfd" placeholder="Synthèse à intégrer dans le rapport final…"></textarea>
    </div>

    <div class="sub-title" style="margin-top:22px"><i class="fas fa-paperclip"></i> Annexes</div>
    <div class="ann-list" id="ann-list">
      <div class="ann-row">
        <div class="ann-num">01</div>
        <input type="text" placeholder="Référence ou description de l'annexe…"/>
        <label class="ann-file-btn" title="Importer un fichier">
          <i class="fas fa-paperclip"></i>
          <input type="file" style="display:none" onchange="handleAnnFile(this)"/>
        </label>
        <span class="ann-file-name"></span>
        <button class="del-btn" onclick="this.closest('.ann-row').remove()"><i class="fas fa-times"></i></button>
      </div>
      <div class="ann-row">
        <div class="ann-num">02</div>
        <input type="text" placeholder="Référence ou description de l'annexe…"/>
        <label class="ann-file-btn" title="Importer un fichier">
          <i class="fas fa-paperclip"></i>
          <input type="file" style="display:none" onchange="handleAnnFile(this)"/>
        </label>
        <span class="ann-file-name"></span>
        <button class="del-btn" onclick="this.closest('.ann-row').remove()"><i class="fas fa-times"></i></button>
      </div>
    </div>
    <button class="add-btn" style="margin-top:8px" onclick="addAnn()">
      <i class="fas fa-plus"></i> Ajouter une annexe
    </button>
  `;
}

/* ════════════════════════════════════════════
   BUILDER — Sécurité (Index 8)
════════════════════════════════════════════ */
function buildSecurite(bloc, g) {
  return `
    <div class="info-box">
      <i class="fas fa-info-circle"></i>
      SFD : <strong>${g.sfd || '—'}</strong> &nbsp;|&nbsp;
      Inspecteur : <strong>${g.inspecteur || '—'}</strong> &nbsp;|&nbsp;
      Chef de mission : <strong>${g.chef || '—'}</strong>
    </div>

    <!-- 8.0 Fiche de rubrique -->
    <div class="sub-title"><i class="fas fa-folder"></i> 8.0 — Fiche de Rubrique</div>
    <p style="font-size:12px;color:var(--text-muted);margin-bottom:12px">
      Pour chaque point de contrôle, cochez le niveau de risque identifié.
    </p>
    <table class="ctrl-table">
      <thead><tr>
        <th style="width:58%">Point de contrôle</th>
        <th class="eval-cell">Élevé</th>
        <th class="eval-cell">Moyen</th>
        <th class="eval-cell">Faible</th>
      </tr></thead>
      <tbody>
        ${[
          "Sécurité des encaisses et coffres",
          "Classement et archivage",
          "Sécurité incendie",
          "Sécurité générale",
        ].map((pt, i) => `
        <tr>
          <td>${i + 1}. ${pt}</td>
          <td class="eval-cell"><input type="radio" name="sec_ctrl${i}" value="eleve"/></td>
          <td class="eval-cell"><input type="radio" name="sec_ctrl${i}" value="moyen"/></td>
          <td class="eval-cell"><input type="radio" name="sec_ctrl${i}" value="faible"/></td>
        </tr>`).join('')}
      </tbody>
    </table>

    <div class="sub-title" style="margin-top:22px"><i class="fas fa-chart-line"></i> Évolution depuis la dernière inspection</div>
    <div class="radio-row">
      <label class="radio-pill"><input type="radio" name="sec_evol" value="amelioree"/> <i class="fas fa-arrow-up" style="color:#22C55E"></i> Améliorée</label>
      <label class="radio-pill"><input type="radio" name="sec_evol" value="stable"/> <i class="fas fa-minus" style="color:#F59E0B"></i> Stable</label>
      <label class="radio-pill"><input type="radio" name="sec_evol" value="deterioree"/> <i class="fas fa-arrow-down" style="color:#EF4444"></i> Détériorée</label>
    </div>

    <div class="sub-title" style="margin-top:22px"><i class="fas fa-comment-alt"></i> Commentaires pour le rapport (8.0)</div>
    <div class="form-group-full">
      <textarea rows="3" id="comm-general-sec" placeholder="Synthèse à intégrer dans le rapport final…"></textarea>
    </div>

    <!-- 8.1 Feuille de travail -->
    <div class="sub-title" style="margin-top:28px"><i class="fas fa-file-signature"></i> 8.1 — Feuille de Travail</div>

    <div class="info-box" style="background:#F0FDF4;border-color:#86EFAC;color:#166534">
      <i class="fas fa-bullseye" style="color:#16A34A"></i>
      <span><strong>Objectif :</strong> S'assurer de la mise en place de dispositifs de gestion des risques liés à la sécurité.</span>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
      <div class="form-group-full">
        <label>Réviseur</label>
        <input type="text" placeholder="Nom du réviseur"/>
      </div>
      <div class="form-group-full">
        <label>Date</label>
        <input type="date"/>
      </div>
    </div>

    <div class="sub-title"><i class="fas fa-book"></i> Références</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:4px">
      <div class="form-group-full">
        <label>Référence 1</label>
        <input type="text" placeholder="Ex : Instruction BCEAO n°…"/>
      </div>
      <div class="form-group-full">
        <label>Référence 2</label>
        <input type="text" placeholder="Ex : Manuel des procédures…"/>
      </div>
    </div>

    <div class="sub-title" style="margin-top:22px"><i class="fas fa-clipboard-list"></i> Notes — Activités de contrôle</div>
    <p style="font-size:12px;color:var(--text-muted);margin-bottom:10px">
      Apposez votre paraphe et indiquez si une lacune a été détectée.
    </p>

    <table class="act-table">
      <thead>
        <tr>
          <th style="width:38px">N°</th>
          <th>Activités</th>
          <th style="width:82px;text-align:center">Paraphe</th>
          <th style="width:90px;text-align:center">Lacune</th>
          <th>Commentaire</th>
        </tr>
      </thead>
      <tbody>

        <tr>
          <td class="act-num">1</td>
          <td>
            <strong>Évaluation de la sécurité des encaisses et coffres</strong>
            <ul>
              <li>S'assurer que la caisse est suffisamment protégée contre les agressions externes</li>
              <li>S'assurer que le personnel connaît bien les consignes précises en cas d'agression</li>
              <li>S'assurer que la caisse contient des billets pièges traçables par leur numéro en cas de vol</li>
              <li>S'assurer que l'encaisse est réduite au minimum et conforme au montant couvert par l'assurance</li>
              <li>S'assurer que les valeurs sont protégées contre le vol et l'incendie</li>
              <li>S'assurer que l'accès aux coffres est réservé uniquement aux personnes habilitées</li>
              <li>S'assurer que l'ouverture du coffre est faite en présence de deux personnes, chacune titulaire d'une clé ou d'une partie de la combinaison</li>
              <li>S'assurer que la clé du coffre est enfermée chaque soir dans un coffre ou endroit connu du Responsable</li>
              <li>S'assurer que la combinaison n'est connue que des personnes habilitées</li>
              <li>S'assurer que le double de la clé est sous la responsabilité d'une personne habilitée et enfermé dans un autre coffre</li>
              <li>S'assurer que le double de la combinaison est contenu dans une enveloppe scellée, sous la responsabilité d'une personne habilitée</li>
              <li>S'assurer que les coffres de service ne contiennent que des valeurs nécessaires au travail courant</li>
              <li>S'assurer que le contenu de chaque coffre est inventorié dans des documents conservés ailleurs, pour permettre leur reconstitution en cas de vol ou de destruction</li>
            </ul>
          </td>
          <td><input type="text" placeholder="Initiales" style="width:68px;text-align:center"/></td>
          <td>
            <div class="lacune-wrap">
              <button class="lacune-btn" onclick="setLacune(this,'oui')">O</button>
              <button class="lacune-btn" onclick="setLacune(this,'non')">N</button>
            </div>
          </td>
          <td><textarea class="act-comment" rows="1" placeholder="Commentaire…"></textarea></td>
        </tr>

        <tr>
          <td class="act-num">2</td>
          <td>
            <strong>Classement et archivage</strong>
            <ul>
              <li>S'assurer du respect de la durée de conservation légale et prévue par les instructions BCEAO des documents internes et externes</li>
              <li>S'assurer de la rationalité du système d'archivage</li>
              <li>S'assurer que l'accès au système est limité aux personnes habilitées et que la communication des documents est faite aux seules personnes autorisées</li>
              <li>Examiner le contrat de sous-traitance de l'archivage pour s'assurer du sérieux et de l'honorabilité de tout prestataire externe</li>
              <li>S'assurer que la police d'assurance du SFD couvre les risques liés à l'archivage</li>
            </ul>
          </td>
          <td><input type="text" placeholder="Initiales" style="width:68px;text-align:center"/></td>
          <td>
            <div class="lacune-wrap">
              <button class="lacune-btn" onclick="setLacune(this,'oui')">O</button>
              <button class="lacune-btn" onclick="setLacune(this,'non')">N</button>
            </div>
          </td>
          <td><textarea class="act-comment" rows="1" placeholder="Commentaire…"></textarea></td>
        </tr>

        <tr>
          <td class="act-num">3</td>
          <td>
            <strong>Sécurité incendie</strong>
            <ul>
              <li>S'assurer que les systèmes d'alarme, de prévention et de lutte contre l'incendie sont adéquats</li>
              <li>S'assurer de l'existence d'un « plan incendie » comportant un responsable et un suppléant par localisation</li>
              <li>S'assurer de l'existence de consignes claires affichées à l'attention du personnel et de la clientèle en cas d'incendie</li>
              <li>S'assurer que les responsables incendie ont reçu des formations adéquates et régulières</li>
              <li>S'assurer que des tests d'évacuation sont régulièrement effectués et les résultats matérialisés et conservés</li>
              <li>S'assurer que le contrat d'assistance incendie est régulièrement exécuté et correctement suivi</li>
            </ul>
          </td>
          <td><input type="text" placeholder="Initiales" style="width:68px;text-align:center"/></td>
          <td>
            <div class="lacune-wrap">
              <button class="lacune-btn" onclick="setLacune(this,'oui')">O</button>
              <button class="lacune-btn" onclick="setLacune(this,'non')">N</button>
            </div>
          </td>
          <td><textarea class="act-comment" rows="1" placeholder="Commentaire…"></textarea></td>
        </tr>

        <tr>
          <td class="act-num">4</td>
          <td>
            <strong>Sécurité générale</strong>
            <ul>
              <li>S'assurer que les mesures de protection sont prises et fonctionnelles : vitres de protection, sas de sécurité, portes avec serrures de sécurité, caméras vidéo, système d'alarme, caisses escamotables, coffres forts</li>
              <li>S'assurer de l'omniprésence du système de gardiennage pour filtrer les entrées dans le SFD</li>
              <li>S'assurer que les risques importants sont couverts par l'assurance</li>
              <li>S'assurer du respect du budget en matière d'assurance</li>
            </ul>
          </td>
          <td><input type="text" placeholder="Initiales" style="width:68px;text-align:center"/></td>
          <td>
            <div class="lacune-wrap">
              <button class="lacune-btn" onclick="setLacune(this,'oui')">O</button>
              <button class="lacune-btn" onclick="setLacune(this,'non')">N</button>
            </div>
          </td>
          <td><textarea class="act-comment" rows="1" placeholder="Commentaire…"></textarea></td>
        </tr>

      </tbody>
    </table>

    <div class="sub-title" style="margin-top:22px"><i class="fas fa-clock"></i> Suivis</div>
    <table class="dyn-table" id="suivi-tbl">
      <thead><tr>
        <th>Point</th><th>Suivi</th><th>Responsable</th><th style="width:120px">Échéance</th>
      </tr></thead>
      <tbody>
        <tr>
          <td><input type="text" placeholder="Point…"/></td>
          <td><input type="text" placeholder="Action de suivi…"/></td>
          <td><input type="text" placeholder="Responsable…"/></td>
          <td><input type="date"/></td>
        </tr>
      </tbody>
    </table>
    <button class="add-btn" onclick="addRow('suivi-tbl','<td><input type=text placeholder=Point…/></td><td><input type=text placeholder=Action…/></td><td><input type=text placeholder=Responsable…/></td><td><input type=date/></td>')">
      <i class="fas fa-plus"></i> Ajouter une ligne
    </button>

    <div class="sub-title" style="margin-top:22px"><i class="fas fa-exclamation-triangle"></i> Constats et Recommandations</div>
    <table class="dyn-table" id="const-tbl">
      <thead><tr><th style="width:70px">Point</th><th>Constats</th><th>Recommandations</th></tr></thead>
      <tbody>
        <tr>
          <td><input type="text" placeholder="Réf…"/></td>
          <td><textarea rows="2" placeholder="Décrivez le constat…"></textarea></td>
          <td><textarea rows="2" placeholder="Recommandation…"></textarea></td>
        </tr>
      </tbody>
    </table>
    <button class="add-btn" onclick="addRow('const-tbl','<td><input type=text placeholder=Réf…/></td><td><textarea rows=2 placeholder=Décrivez le constat…></textarea></td><td><textarea rows=2 placeholder=Recommandation…></textarea></td>')">
      <i class="fas fa-plus"></i> Ajouter une ligne
    </button>

    <div class="sub-title" style="margin-top:22px"><i class="fas fa-comment-alt"></i> Commentaires</div>
    <div class="form-group-full">
      <textarea rows="4" placeholder="Synthèse à intégrer dans le rapport final…"></textarea>
    </div>

    <div class="sub-title" style="margin-top:22px"><i class="fas fa-paperclip"></i> Annexes</div>
    <div class="ann-list" id="ann-list">
      <div class="ann-row">
        <div class="ann-num">01</div>
        <input type="text" placeholder="Référence ou description de l'annexe…"/>
        <label class="ann-file-btn" title="Importer un fichier">
          <i class="fas fa-paperclip"></i>
          <input type="file" style="display:none" onchange="handleAnnFile(this)"/>
        </label>
        <span class="ann-file-name"></span>
        <button class="del-btn" onclick="this.closest('.ann-row').remove()"><i class="fas fa-times"></i></button>
      </div>
      <div class="ann-row">
        <div class="ann-num">02</div>
        <input type="text" placeholder="Référence ou description de l'annexe…"/>
        <label class="ann-file-btn" title="Importer un fichier">
          <i class="fas fa-paperclip"></i>
          <input type="file" style="display:none" onchange="handleAnnFile(this)"/>
        </label>
        <span class="ann-file-name"></span>
        <button class="del-btn" onclick="this.closest('.ann-row').remove()"><i class="fas fa-times"></i></button>
      </div>
    </div>
    <button class="add-btn" style="margin-top:8px" onclick="addAnn()">
      <i class="fas fa-plus"></i> Ajouter une annexe
    </button>
  `;
}

/* ════════════════════════════════════════════
   BUILDER — Reporting (Index 10)
════════════════════════════════════════════ */
function buildReporting(bloc, g) {

  const act101 = [
    "S'assurer que les SFD communiquent mensuellement ou trimestriellement, dans un délai de 30 jours à la fin du mois ou du trimestre concerné, les indicateurs au Ministère chargé des finances, à la BCEAO et à la Commission Bancaire",
    "S'assurer de la transmission des indicateurs sous format électronique ou à défaut, pour les SFD non soumis à l'Article 44, sous format papier avec la signature d'une personne habilitée à engager le SFD",
    "Recalculer les indicateurs financiers sur la base des codes postes du Référentiel concernés et précisés dans les instructions",
    "Recalculer les indicateurs financiers sur la base des autres informations statistiques obtenues pour le ratio de productivité des agents de crédit, de productivité du personnel",
    "Nombre de membres, bénéficiaires ou clients — Sur la base du nombre de comptes ouverts, identifier le genre des personnes physiques et la forme juridique des personnes morales ainsi que le genre des groupements membres sur la période",
    "Effectif des dirigeants et du personnel — Sur la base des PV des organes et des statuts, compter le nombre de membres de chaque organe ; sur la base de la liste du personnel et du livre de paie, compter le nombre de dirigeants et autres employés en précisant le caractère du contrat de travail",
    "Nombre de déposants — Sur la base du registre des adhésions et du nombre de comptes ouverts, identifier le genre des personnes physiques et la forme juridique des personnes morales déposantes non membres sur la période",
    "Nombre de crédits en cours — Sur la base du suivi extra comptable ou de l'extrait des comptes du poste 20, identifier le nombre de crédits distribués sur la période selon le genre du bénéficiaire",
    "Répartition des crédits selon leur objet — Sur la base des attributs mis en place, identifier la valeur des crédits distribués : immobiliers, équipements, consommation, trésorerie et autres ; contrôler la cohérence du montant total avec les mouvements du poste 20",
    "Nombre de crédits en souffrance — Sur base du suivi extracomptable, compter le nombre de crédits concernés et identifier le genre de la personne ou la forme juridique de la personne morale",
    "Indicateurs sur la surveillance — S'assurer du nombre d'institutions affiliées ; comparer le nombre de rapports de contrôle par rapport au nombre d'institutions affiliées ; contrôler le nombre d'actions engagées par rapport aux recommandations des rapports de contrôle de la faîtière",
  ];

  const act102 = [
    "Vérifier la réalité du résultat de l'exercice",
    "Déterminer le montant des provisions complémentaires à effectuer",
    "Procéder à une revue analytique des ratios prudentiels portant sur leur évolution d'une période à l'autre",
    "Vérifier le bon report des chiffres des documents comptables aux différentes rubriques des ratios",
    "S'assurer de la cohérence entre les éléments du numérateur et du dénominateur avec les états annexés concernés de la situation comptable",
    "S'assurer de l'exhaustivité des éléments pris en compte",
    "S'assurer que les ratios sont transmis à la Banque Centrale un mois après leur élaboration",
    "A1 — Fonds propres : s'assurer que tous les éléments constitutifs ont bien été pris en compte et que les coefficients de pondération retenus sont justifiés",
    "A2 — Limitations des prêts aux dirigeants et au personnel : s'assurer de l'exhaustivité des prêts déclarés, vérifier la liste des personnes susvisées, comparer le résultat recalculé avec celui du SFD (norme : 10% maximum)",
    "Norme de capitalisation — Vérifier numérateur (fonds propres) et dénominateur (total actif nets) ; s'assurer que les montants pris en compte au dénominateur sont des montants nets",
    "Limitation des prises de participation — Vérifier que le montant des titres de participation n'inclut pas des titres dans des établissements de crédit ou des SFD",
    "Limitation des risques pris sur une seule signature — S'assurer que les prêts pris en compte concernent uniquement des encours résiduels",
    "Financement des immobilisations et participations — S'assurer que sont incluses les immobilisations acquises par réalisation de garantie (déduction faite de celles acquises depuis moins de 2 ans)",
    "Limitation des risques auxquels est exposée une institution — S'assurer que pour le numérateur, les risques sont nets des provisions et des dépôts de garantie",
    "Coefficient de liquidité — Vérifier que seules les exigibilités et disponibilités de 3 mois maximum sont prises en compte ; s'assurer que les éléments sont pris en compte sur la base des durées restant à courir",
    "Couverture des emplois à moyen et long terme par des ressources stables — S'assurer qu'il est utilisé les durées restant à courir et non les durées initiales",
    "Réserve générale — Vérifier que la dotation est effectuée quel que soit le niveau atteint, que les sommes mises en réserve n'ont pas été distribuées, et que la périodicité de production est respectée",
    "Limitation des opérations autres que les activités d'épargne et de crédit — Vérifier que les montants des risques sont nets des provisions et des dépôts de garantie",
  ];

  const act103 = [
    "Vérifier la conformité du format par rapport aux dispositions réglementaires : forme combinée pour les unions/fédérations/confédérations ; disponibilité des rapports annuels des SFD affiliés ; forme consolidée pour les SFD non mutualistes",
    "Vérifier le délai et le mode de transmission du rapport annuel aux autorités de contrôle : délai de 6 mois après clôture ; support électronique pour les SFD art. 44, support papier pour les autres",
    "Vérifier la certification des états financiers par un commissaire aux comptes et leur approbation en AG : rapport de certification, rapport spécial sur les conventions réglementées, PV d'approbation AG",
    "Vérifier la conformité du contenu du rapport annuel : historique, environnement socio-économique, gouvernance, évolution financière, prestations offertes, changements organisationnels, difficultés, relations avec les autorités, partenaires, perspectives, statistiques affiliations",
    "Vérifier et retraiter les éléments de calcul des ratios prudentiels : limitation des risques, couverture des emplois MLT, limitation des prêts aux dirigeants, coefficient de liquidité, réserve générale, norme de capitalisation, financement des immobilisations et participations",
  ];

  function actRows(acts, prefix) {
    return acts.map((a, i) => `
      <tr>
        <td class="act-num">${i + 1}</td>
        <td>${a}</td>
        <td><input type="text" placeholder="Initiales" style="width:68px;text-align:center"/></td>
        <td>
          <div class="lacune-wrap">
            <button class="lacune-btn" onclick="setLacune(this,'oui')">O</button>
            <button class="lacune-btn" onclick="setLacune(this,'non')">N</button>
          </div>
        </td>
        <td><textarea class="act-comment" rows="1" placeholder="Commentaire…"></textarea></td>
      </tr>`).join('');
  }

  return `
    <div class="info-box">
      <i class="fas fa-info-circle"></i>
      SFD : <strong>${g.sfd || '—'}</strong> &nbsp;|&nbsp;
      Inspecteur : <strong>${g.inspecteur || '—'}</strong> &nbsp;|&nbsp;
      Chef de mission : <strong>${g.chef || '—'}</strong>
    </div>

    <!-- 10.0 Fiche de rubrique -->
    <div class="sub-title"><i class="fas fa-folder"></i> 10.0 — Fiche de Rubrique</div>
    <p style="font-size:12px;color:var(--text-muted);margin-bottom:12px">
      Pour chaque point de contrôle, cochez le niveau de risque identifié.
    </p>
    <table class="ctrl-table">
      <thead><tr>
        <th style="width:58%">Point de contrôle</th>
        <th class="eval-cell">Élevé</th>
        <th class="eval-cell">Moyen</th>
        <th class="eval-cell">Faible</th>
      </tr></thead>
      <tbody>
        ${["Indicateurs périodiques", "Ratios prudentiels", "Rapport annuel"].map((pt, i) => `
        <tr>
          <td>${i + 1}. ${pt}</td>
          <td class="eval-cell"><input type="radio" name="rep_ctrl${i}" value="eleve"/></td>
          <td class="eval-cell"><input type="radio" name="rep_ctrl${i}" value="moyen"/></td>
          <td class="eval-cell"><input type="radio" name="rep_ctrl${i}" value="faible"/></td>
        </tr>`).join('')}
      </tbody>
    </table>

    <div class="sub-title" style="margin-top:22px"><i class="fas fa-chart-line"></i> Évolution depuis la dernière inspection</div>
    <div class="radio-row">
      <label class="radio-pill"><input type="radio" name="rep_evol" value="amelioree"/> <i class="fas fa-arrow-up" style="color:#22C55E"></i> Améliorée</label>
      <label class="radio-pill"><input type="radio" name="rep_evol" value="stable"/> <i class="fas fa-minus" style="color:#F59E0B"></i> Stable</label>
      <label class="radio-pill"><input type="radio" name="rep_evol" value="deterioree"/> <i class="fas fa-arrow-down" style="color:#EF4444"></i> Détériorée</label>
    </div>

    <div class="sub-title" style="margin-top:22px"><i class="fas fa-comment-alt"></i> Commentaires pour le rapport (10.0)</div>
    <div class="form-group-full">
      <textarea rows="3" id="comm-general-rep" placeholder="Synthèse à intégrer dans le rapport final…"></textarea>
    </div>

    <!-- 10.1 Indicateurs périodiques -->
    <div class="sub-title" style="margin-top:28px"><i class="fas fa-file-signature"></i> 10.1 — Indicateurs périodiques</div>

    <div class="info-box" style="background:#F0FDF4;border-color:#86EFAC;color:#166534">
      <i class="fas fa-bullseye" style="color:#16A34A"></i>
      <span><strong>Objectif :</strong> S'assurer du respect des dispositions réglementaires relatives aux indicateurs périodiques.</span>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
      <div class="form-group-full"><label>Réviseur</label><input type="text" placeholder="Nom du réviseur"/></div>
      <div class="form-group-full"><label>Date</label><input type="date"/></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
      <div class="form-group-full"><label>Référence 1</label><input type="text" placeholder="Ex : Instruction BCEAO n°…"/></div>
      <div class="form-group-full"><label>Référence 2</label><input type="text" placeholder=""/></div>
    </div>

    <table class="act-table">
      <thead><tr>
        <th style="width:38px">N°</th><th>Activités</th>
        <th style="width:82px;text-align:center">Paraphe</th>
        <th style="width:90px;text-align:center">Lacune</th>
          <th>Commentaire</th>
      </tr></thead>
      <tbody>${actRows(act101, '101')}</tbody>
    </table>

    <div class="sub-title" style="margin-top:16px"><i class="fas fa-clock"></i> Suivis (10.1)</div>
    <table class="dyn-table" id="suivi-101">
      <thead><tr><th>Point</th><th>Suivi</th><th>Responsable</th><th style="width:120px">Échéance</th></tr></thead>
      <tbody><tr>
        <td><input type="text" placeholder="Point…"/></td>
        <td><input type="text" placeholder="Action…"/></td>
        <td><input type="text" placeholder="Responsable…"/></td>
        <td><input type="date"/></td>
      </tr></tbody>
    </table>
    <button class="add-btn" onclick="addRow('suivi-101','<td><input type=text placeholder=Point…/></td><td><input type=text placeholder=Action…/></td><td><input type=text placeholder=Responsable…/></td><td><input type=date/></td>')">
      <i class="fas fa-plus"></i> Ajouter une ligne
    </button>

    <div class="sub-title" style="margin-top:16px"><i class="fas fa-exclamation-triangle"></i> Constats et Recommandations (10.1)</div>
    <table class="dyn-table" id="const-101">
      <thead><tr><th style="width:70px">Point</th><th>Constats</th><th>Recommandations</th></tr></thead>
      <tbody><tr>
        <td><input type="text" placeholder="Réf…"/></td>
        <td><textarea rows="2" placeholder="Décrivez le constat…"></textarea></td>
        <td><textarea rows="2" placeholder="Recommandation…"></textarea></td>
      </tr></tbody>
    </table>
    <button class="add-btn" onclick="addRow('const-101','<td><input type=text placeholder=Réf…/></td><td><textarea rows=2 placeholder=Décrivez le constat…></textarea></td><td><textarea rows=2 placeholder=Recommandation…></textarea></td>')">
      <i class="fas fa-plus"></i> Ajouter une ligne
    </button>

    <div class="sub-title" style="margin-top:16px"><i class="fas fa-comment-alt"></i> Commentaires</div>
    <div class="form-group-full"><textarea rows="3" placeholder="Commentaires…"></textarea></div>

    <div class="sub-title" style="margin-top:16px"><i class="fas fa-paperclip"></i> Annexes (10.1)</div>
    <div class="ann-list" id="ann-101">
      <div class="ann-row"><div class="ann-num">01</div><input type="text" placeholder="Référence…"/><label class="ann-file-btn" title="Importer un fichier"><i class="fas fa-paperclip"></i><input type="file" style="display:none" onchange="handleAnnFile(this)"/></label><span class="ann-file-name"></span><button class="del-btn" onclick="this.closest('.ann-row').remove()"><i class="fas fa-times"></i></button></div>
      <div class="ann-row"><div class="ann-num">02</div><input type="text" placeholder="Référence…"/><label class="ann-file-btn" title="Importer un fichier"><i class="fas fa-paperclip"></i><input type="file" style="display:none" onchange="handleAnnFile(this)"/></label><span class="ann-file-name"></span><button class="del-btn" onclick="this.closest('.ann-row').remove()"><i class="fas fa-times"></i></button></div>
    </div>
    <button class="add-btn" style="margin-top:8px" onclick="addAnnTo('ann-101')"><i class="fas fa-plus"></i> Ajouter une annexe</button>

    <!-- 10.2 Ratios prudentiels -->
    <div class="sub-title" style="margin-top:32px"><i class="fas fa-file-signature"></i> 10.2 — Ratios prudentiels</div>

    <div class="info-box" style="background:#F0FDF4;border-color:#86EFAC;color:#166534">
      <i class="fas fa-bullseye" style="color:#16A34A"></i>
      <span><strong>Objectif :</strong> S'assurer du respect des dispositions réglementaires relatives aux ratios prudentiels.</span>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
      <div class="form-group-full"><label>Réviseur</label><input type="text" placeholder="Nom du réviseur"/></div>
      <div class="form-group-full"><label>Date</label><input type="date"/></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
      <div class="form-group-full"><label>Référence 1</label><input type="text" placeholder="Ex : Instruction BCEAO n°…"/></div>
      <div class="form-group-full"><label>Référence 2</label><input type="text" placeholder=""/></div>
    </div>

    <table class="act-table">
      <thead><tr>
        <th style="width:38px">N°</th><th>Activités</th>
        <th style="width:82px;text-align:center">Paraphe</th>
        <th style="width:90px;text-align:center">Lacune</th>
          <th>Commentaire</th>
      </tr></thead>
      <tbody>${actRows(act102, '102')}</tbody>
    </table>

    <div class="sub-title" style="margin-top:16px"><i class="fas fa-clock"></i> Suivis (10.2)</div>
    <table class="dyn-table" id="suivi-102">
      <thead><tr><th>Point</th><th>Suivi</th><th>Responsable</th><th style="width:120px">Échéance</th></tr></thead>
      <tbody><tr>
        <td><input type="text" placeholder="Point…"/></td>
        <td><input type="text" placeholder="Action…"/></td>
        <td><input type="text" placeholder="Responsable…"/></td>
        <td><input type="date"/></td>
      </tr></tbody>
    </table>
    <button class="add-btn" onclick="addRow('suivi-102','<td><input type=text placeholder=Point…/></td><td><input type=text placeholder=Action…/></td><td><input type=text placeholder=Responsable…/></td><td><input type=date/></td>')">
      <i class="fas fa-plus"></i> Ajouter une ligne
    </button>

    <div class="sub-title" style="margin-top:16px"><i class="fas fa-exclamation-triangle"></i> Constats et Recommandations (10.2)</div>
    <table class="dyn-table" id="const-102">
      <thead><tr><th style="width:70px">Point</th><th>Constats</th><th>Recommandations</th></tr></thead>
      <tbody><tr>
        <td><input type="text" placeholder="Réf…"/></td>
        <td><textarea rows="2" placeholder="Décrivez le constat…"></textarea></td>
        <td><textarea rows="2" placeholder="Recommandation…"></textarea></td>
      </tr></tbody>
    </table>
    <button class="add-btn" onclick="addRow('const-102','<td><input type=text placeholder=Réf…/></td><td><textarea rows=2 placeholder=Décrivez le constat…></textarea></td><td><textarea rows=2 placeholder=Recommandation…></textarea></td>')">
      <i class="fas fa-plus"></i> Ajouter une ligne
    </button>

    <div class="sub-title" style="margin-top:16px"><i class="fas fa-comment-alt"></i> Commentaires</div>
    <div class="form-group-full"><textarea rows="3" placeholder="Commentaires…"></textarea></div>

    <div class="sub-title" style="margin-top:16px"><i class="fas fa-paperclip"></i> Annexes (10.2)</div>
    <div class="ann-list" id="ann-102">
      <div class="ann-row"><div class="ann-num">01</div><input type="text" placeholder="Référence…"/><label class="ann-file-btn" title="Importer un fichier"><i class="fas fa-paperclip"></i><input type="file" style="display:none" onchange="handleAnnFile(this)"/></label><span class="ann-file-name"></span><button class="del-btn" onclick="this.closest('.ann-row').remove()"><i class="fas fa-times"></i></button></div>
      <div class="ann-row"><div class="ann-num">02</div><input type="text" placeholder="Référence…"/><label class="ann-file-btn" title="Importer un fichier"><i class="fas fa-paperclip"></i><input type="file" style="display:none" onchange="handleAnnFile(this)"/></label><span class="ann-file-name"></span><button class="del-btn" onclick="this.closest('.ann-row').remove()"><i class="fas fa-times"></i></button></div>
    </div>
    <button class="add-btn" style="margin-top:8px" onclick="addAnnTo('ann-102')"><i class="fas fa-plus"></i> Ajouter une annexe</button>

    <!-- 10.3 Rapport annuel -->
    <div class="sub-title" style="margin-top:32px"><i class="fas fa-file-signature"></i> 10.3 — Rapport annuel</div>

    <div class="info-box" style="background:#F0FDF4;border-color:#86EFAC;color:#166534">
      <i class="fas fa-bullseye" style="color:#16A34A"></i>
      <span><strong>Objectif :</strong> S'assurer de l'élaboration et de la transmission conformément aux dispositions légales et réglementaires.</span>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
      <div class="form-group-full"><label>Réviseur</label><input type="text" placeholder="Nom du réviseur"/></div>
      <div class="form-group-full"><label>Date</label><input type="date"/></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
      <div class="form-group-full"><label>Référence 1</label><input type="text" placeholder="Ex : Instruction BCEAO n°…"/></div>
      <div class="form-group-full"><label>Référence 2</label><input type="text" placeholder=""/></div>
    </div>

    <table class="act-table">
      <thead><tr>
        <th style="width:38px">N°</th><th>Activités</th>
        <th style="width:82px;text-align:center">Paraphe</th>
        <th style="width:90px;text-align:center">Lacune</th>
          <th>Commentaire</th>
      </tr></thead>
      <tbody>${actRows(act103, '103')}</tbody>
    </table>

    <div class="sub-title" style="margin-top:16px"><i class="fas fa-clock"></i> Suivis (10.3)</div>
    <table class="dyn-table" id="suivi-103">
      <thead><tr><th>Point</th><th>Suivi</th><th>Responsable</th><th style="width:120px">Échéance</th></tr></thead>
      <tbody><tr>
        <td><input type="text" placeholder="Point…"/></td>
        <td><input type="text" placeholder="Action…"/></td>
        <td><input type="text" placeholder="Responsable…"/></td>
        <td><input type="date"/></td>
      </tr></tbody>
    </table>
    <button class="add-btn" onclick="addRow('suivi-103','<td><input type=text placeholder=Point…/></td><td><input type=text placeholder=Action…/></td><td><input type=text placeholder=Responsable…/></td><td><input type=date/></td>')">
      <i class="fas fa-plus"></i> Ajouter une ligne
    </button>

    <div class="sub-title" style="margin-top:16px"><i class="fas fa-exclamation-triangle"></i> Constats et Recommandations (10.3)</div>
    <table class="dyn-table" id="const-103">
      <thead><tr><th style="width:70px">Point</th><th>Constats</th><th>Recommandations</th></tr></thead>
      <tbody><tr>
        <td><input type="text" placeholder="Réf…"/></td>
        <td><textarea rows="2" placeholder="Décrivez le constat…"></textarea></td>
        <td><textarea rows="2" placeholder="Recommandation…"></textarea></td>
      </tr></tbody>
    </table>
    <button class="add-btn" onclick="addRow('const-103','<td><input type=text placeholder=Réf…/></td><td><textarea rows=2 placeholder=Décrivez le constat…></textarea></td><td><textarea rows=2 placeholder=Recommandation…></textarea></td>')">
      <i class="fas fa-plus"></i> Ajouter une ligne
    </button>

    <div class="sub-title" style="margin-top:16px"><i class="fas fa-comment-alt"></i> Commentaires</div>
    <div class="form-group-full"><textarea rows="3" placeholder="Commentaires…"></textarea></div>

    <div class="sub-title" style="margin-top:16px"><i class="fas fa-paperclip"></i> Annexes (10.3)</div>
    <div class="ann-list" id="ann-103">
      <div class="ann-row"><div class="ann-num">01</div><input type="text" placeholder="Référence…"/><label class="ann-file-btn" title="Importer un fichier"><i class="fas fa-paperclip"></i><input type="file" style="display:none" onchange="handleAnnFile(this)"/></label><span class="ann-file-name"></span><button class="del-btn" onclick="this.closest('.ann-row').remove()"><i class="fas fa-times"></i></button></div>
      <div class="ann-row"><div class="ann-num">02</div><input type="text" placeholder="Référence…"/><label class="ann-file-btn" title="Importer un fichier"><i class="fas fa-paperclip"></i><input type="file" style="display:none" onchange="handleAnnFile(this)"/></label><span class="ann-file-name"></span><button class="del-btn" onclick="this.closest('.ann-row').remove()"><i class="fas fa-times"></i></button></div>
    </div>
    <button class="add-btn" style="margin-top:8px" onclick="addAnnTo('ann-103')"><i class="fas fa-plus"></i> Ajouter une annexe</button>
  `;
}

/* ════════════════════════════════════════════
   BUILDER — Épargne (Index 5)
════════════════════════════════════════════ */
function buildEpargne(bloc, g) {

  const act51 = [
    "Vérifier l'existence d'une politique générale de collecte de l'épargne au sein de l'institution. Celle-ci doit être mise à jour périodiquement, être à la disposition du personnel et comprendre les conditions d'ouverture et les règles de fonctionnement",
    "S'assurer que les conditions de fonctionnement des comptes et de rémunération des dépôts sont largement diffusées",
    "Contrôler le respect des règles de gestion administrative des comptes en vérifiant que : le dossier du client comprend la justification de son identité, son domicile et son activité ; les dossiers sont correctement classés et protégés contre les risques de perte, vol, incendie et indiscrétion",
    "S'assurer de la préservation de la communication avec les clients en vérifiant le traitement des réclamations",
    "Contrôler la surveillance des comptes à risque (comptes dormants, comptes du personnel) en s'assurant qu'ils font l'objet d'une procédure spécifique",
    "S'assurer que la fermeture de compte est autorisée par le titulaire et que ses engagements envers le SFD ont été remplis avant la fermeture",
    "Vérifier si la restitution des dépôts a été faite au bénéfice des personnes appropriées, en s'assurant de leur identité mentionnée sur la fiche de restitution",
    "Vérifier les séries de bordereaux de dépôt par guichet pour chacun des trimestres de la période sous inspection",
    "Procéder à l'analyse des fiches individuelles de dépôts des dirigeants et des salariés et des comptes des personnes physiques ou morales qui leur sont liées",
    "Dans le cas des personnes apparentées, vérifier les taux d'intérêt appliqués sur épargne",
    "Contrôler que toutes les actions de prise de contact ont été menées auprès des membres avant de catégoriser les comptes comme dormants",
    "S'assurer du respect des textes liés au traitement des comptes dormants en termes de durée d'inactivité notamment",
    "S'assurer que toutes les actions menées sur les comptes jugés « dormants » sont formalisées et correctement conservées pour justification",
  ];

  const act52 = [
    "F1A — Comptes ordinaires créditeurs : analyser l'évolution annuelle de la structure des dépôts ; contrôler la réalité, la justification et la bonne classification des comptes par confirmation directe/sondage ; contrôler les arrêtés des comptes (taux, agios) et la correcte classification des charges ; faire la revue analytique du compte de résultat ; identifier les comptes et transactions à risques (personnes morales, comptes dormants, comptes ouverts par des intermédiaires) ; contrôler l'effectivité et la conformité du dispositif de Lutte Anti-Blanchiment ; contrôler les systèmes et moyens de paiement (virements, prélèvements, cartes, porte-monnaie électroniques)",
    "F2A — Autres comptes de dépôts créditeurs : s'assurer de l'existence et de l'exactitude des soldes des comptes ; s'assurer que les intérêts sont correctement calculés et comptabilisés à la date d'arrêté ; s'assurer que les comptes sont correctement présentés dans les états financiers ; s'assurer de la justification des « valeurs non imputées » et « autres sommes dues » ; contrôler les arrêtés des comptes (taux, agios) et la correcte classification des comptes de charges",
    "G10 — Comptes ordinaires créditeurs : analyser l'évolution annuelle de la structure des dépôts ; contrôler la réalité, la justification et la bonne classification des comptes par confirmation directe/sondage ; contrôler les arrêtés des comptes (taux, agios) ; faire la revue analytique du compte de résultat et le contrôle de l'indépendance des exercices ; identifier les comptes et transactions à risques (personnel, clientèle occasionnelle ou non résidente, personnes morales, PPE, comptes dormants) ; contrôler l'effectivité et la conformité du dispositif de Lutte Anti-Blanchiment ; contrôler les systèmes et moyens de paiement (effets, virements, prélèvements, cartes, porte-monnaie électroniques)",
    "G15/G2A — Autres comptes des membres, bénéficiaires ou clients : s'assurer de l'existence et de l'exactitude des soldes des comptes ; s'assurer que les intérêts créditeurs sont correctement calculés et comptabilisés à la date d'arrêté ; s'assurer que les comptes sont correctement présentés dans les états financiers ; contrôler les arrêtés des comptes (taux) et la correcte classification des comptes ; faire la revue analytique du compte de résultat et le contrôle de l'indépendance des exercices",
  ];

  function actRows(acts) {
    return acts.map((a, i) => `
      <tr>
        <td class="act-num">${i + 1}</td>
        <td>${a}</td>
        <td><input type="text" placeholder="Initiales" style="width:68px;text-align:center"/></td>
        <td>
          <div class="lacune-wrap">
            <button class="lacune-btn" onclick="setLacune(this,'oui')">O</button>
            <button class="lacune-btn" onclick="setLacune(this,'non')">N</button>
          </div>
        </td>
        <td><textarea class="act-comment" rows="1" placeholder="Commentaire…"></textarea></td>
      </tr>`).join('');
  }

  return `
    <div class="info-box">
      <i class="fas fa-info-circle"></i>
      SFD : <strong>${g.sfd || '—'}</strong> &nbsp;|&nbsp;
      Inspecteur : <strong>${g.inspecteur || '—'}</strong> &nbsp;|&nbsp;
      Chef de mission : <strong>${g.chef || '—'}</strong>
    </div>

    <!-- 5.0 Fiche de rubrique -->
    <div class="sub-title"><i class="fas fa-folder"></i> 5.0 — Fiche de Rubrique</div>
    <p style="font-size:12px;color:var(--text-muted);margin-bottom:12px">
      Pour chaque point de contrôle, cochez le niveau de risque identifié.
    </p>
    <table class="ctrl-table">
      <thead><tr>
        <th style="width:58%">Point de contrôle</th>
        <th class="eval-cell">Élevé</th>
        <th class="eval-cell">Moyen</th>
        <th class="eval-cell">Faible</th>
      </tr></thead>
      <tbody>
        ${["Collecte des ressources", "Comptabilisation de l'épargne"].map((pt, i) => `
        <tr>
          <td>${i + 1}. ${pt}</td>
          <td class="eval-cell"><input type="radio" name="epg_ctrl${i}" value="eleve"/></td>
          <td class="eval-cell"><input type="radio" name="epg_ctrl${i}" value="moyen"/></td>
          <td class="eval-cell"><input type="radio" name="epg_ctrl${i}" value="faible"/></td>
        </tr>`).join('')}
      </tbody>
    </table>

    <div class="sub-title" style="margin-top:22px"><i class="fas fa-chart-line"></i> Évolution depuis la dernière inspection</div>
    <div class="radio-row">
      <label class="radio-pill"><input type="radio" name="epg_evol" value="amelioree"/> <i class="fas fa-arrow-up" style="color:#22C55E"></i> Améliorée</label>
      <label class="radio-pill"><input type="radio" name="epg_evol" value="stable"/> <i class="fas fa-minus" style="color:#F59E0B"></i> Stable</label>
      <label class="radio-pill"><input type="radio" name="epg_evol" value="deterioree"/> <i class="fas fa-arrow-down" style="color:#EF4444"></i> Détériorée</label>
    </div>

    <div class="sub-title" style="margin-top:22px"><i class="fas fa-comment-alt"></i> Commentaires pour le rapport (5.0)</div>
    <div class="form-group-full">
      <textarea rows="3" id="comm-general-epg" placeholder="Synthèse à intégrer dans le rapport final…"></textarea>
    </div>

    <!-- 5.1 Collecte des ressources -->
    <div class="sub-title" style="margin-top:28px"><i class="fas fa-file-signature"></i> 5.1 — Collecte des ressources</div>

    <div class="info-box" style="background:#F0FDF4;border-color:#86EFAC;color:#166534">
      <i class="fas fa-bullseye" style="color:#16A34A"></i>
      <span><strong>Objectif :</strong> S'assurer du respect des dispositions légales et réglementaires relatives à la collecte des ressources, à la liquidité ainsi qu'au blanchiment des capitaux et au financement du terrorisme.</span>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
      <div class="form-group-full"><label>Réviseur</label><input type="text" placeholder="Nom du réviseur"/></div>
      <div class="form-group-full"><label>Date</label><input type="date"/></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
      <div class="form-group-full"><label>Référence 1</label><input type="text" placeholder="Ex : Instruction BCEAO n°…"/></div>
      <div class="form-group-full"><label>Référence 2</label><input type="text" placeholder=""/></div>
    </div>

    <table class="act-table">
      <thead><tr>
        <th style="width:38px">N°</th><th>Activités</th>
        <th style="width:82px;text-align:center">Paraphe</th>
        <th style="width:90px;text-align:center">Lacune</th>
          <th>Commentaire</th>
      </tr></thead>
      <tbody>${actRows(act51)}</tbody>
    </table>

    <div class="sub-title" style="margin-top:16px"><i class="fas fa-clock"></i> Suivis (5.1)</div>
    <table class="dyn-table" id="suivi-51">
      <thead><tr><th>Point</th><th>Suivi</th><th>Responsable</th><th style="width:120px">Échéance</th></tr></thead>
      <tbody><tr>
        <td><input type="text" placeholder="Point…"/></td>
        <td><input type="text" placeholder="Action…"/></td>
        <td><input type="text" placeholder="Responsable…"/></td>
        <td><input type="date"/></td>
      </tr></tbody>
    </table>
    <button class="add-btn" onclick="addRow('suivi-51','<td><input type=text placeholder=Point…/></td><td><input type=text placeholder=Action…/></td><td><input type=text placeholder=Responsable…/></td><td><input type=date/></td>')">
      <i class="fas fa-plus"></i> Ajouter une ligne
    </button>

    <div class="sub-title" style="margin-top:16px"><i class="fas fa-exclamation-triangle"></i> Constats et Recommandations (5.1)</div>
    <table class="dyn-table" id="const-51">
      <thead><tr><th style="width:70px">Point</th><th>Constats</th><th>Recommandations</th></tr></thead>
      <tbody><tr>
        <td><input type="text" placeholder="Réf…"/></td>
        <td><textarea rows="2" placeholder="Décrivez le constat…"></textarea></td>
        <td><textarea rows="2" placeholder="Recommandation…"></textarea></td>
      </tr></tbody>
    </table>
    <button class="add-btn" onclick="addRow('const-51','<td><input type=text placeholder=Réf…/></td><td><textarea rows=2 placeholder=Décrivez le constat…></textarea></td><td><textarea rows=2 placeholder=Recommandation…></textarea></td>')">
      <i class="fas fa-plus"></i> Ajouter une ligne
    </button>

    <div class="sub-title" style="margin-top:16px"><i class="fas fa-comment-alt"></i> Commentaires</div>
    <div class="form-group-full"><textarea rows="3" placeholder="Commentaires…"></textarea></div>

    <div class="sub-title" style="margin-top:16px"><i class="fas fa-paperclip"></i> Annexes (5.1)</div>
    <div class="ann-list" id="ann-51">
      <div class="ann-row"><div class="ann-num">01</div><input type="text" placeholder="Référence…"/><label class="ann-file-btn" title="Importer un fichier"><i class="fas fa-paperclip"></i><input type="file" style="display:none" onchange="handleAnnFile(this)"/></label><span class="ann-file-name"></span><button class="del-btn" onclick="this.closest('.ann-row').remove()"><i class="fas fa-times"></i></button></div>
      <div class="ann-row"><div class="ann-num">02</div><input type="text" placeholder="Référence…"/><label class="ann-file-btn" title="Importer un fichier"><i class="fas fa-paperclip"></i><input type="file" style="display:none" onchange="handleAnnFile(this)"/></label><span class="ann-file-name"></span><button class="del-btn" onclick="this.closest('.ann-row').remove()"><i class="fas fa-times"></i></button></div>
    </div>
    <button class="add-btn" style="margin-top:8px" onclick="addAnnTo('ann-51')"><i class="fas fa-plus"></i> Ajouter une annexe</button>

    <!-- 5.2 Comptabilisation de l'épargne -->
    <div class="sub-title" style="margin-top:32px"><i class="fas fa-file-signature"></i> 5.2 — Comptabilisation de l'épargne</div>

    <div class="info-box" style="background:#F0FDF4;border-color:#86EFAC;color:#166534">
      <i class="fas fa-bullseye" style="color:#16A34A"></i>
      <span><strong>Objectif :</strong> S'assurer du respect des dispositions du référentiel comptable spécifique des SFD et de la mise en place d'un dispositif pour gérer les risques opérationnels.</span>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
      <div class="form-group-full"><label>Réviseur</label><input type="text" placeholder="Nom du réviseur"/></div>
      <div class="form-group-full"><label>Date</label><input type="date"/></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
      <div class="form-group-full"><label>Référence 1</label><input type="text" placeholder="Ex : Instruction BCEAO n°…"/></div>
      <div class="form-group-full"><label>Référence 2</label><input type="text" placeholder=""/></div>
    </div>

    <table class="act-table">
      <thead><tr>
        <th style="width:38px">N°</th><th>Activités</th>
        <th style="width:82px;text-align:center">Paraphe</th>
        <th style="width:90px;text-align:center">Lacune</th>
          <th>Commentaire</th>
      </tr></thead>
      <tbody>${actRows(act52)}</tbody>
    </table>

    <div class="sub-title" style="margin-top:16px"><i class="fas fa-clock"></i> Suivis (5.2)</div>
    <table class="dyn-table" id="suivi-52">
      <thead><tr><th>Point</th><th>Suivi</th><th>Responsable</th><th style="width:120px">Échéance</th></tr></thead>
      <tbody><tr>
        <td><input type="text" placeholder="Point…"/></td>
        <td><input type="text" placeholder="Action…"/></td>
        <td><input type="text" placeholder="Responsable…"/></td>
        <td><input type="date"/></td>
      </tr></tbody>
    </table>
    <button class="add-btn" onclick="addRow('suivi-52','<td><input type=text placeholder=Point…/></td><td><input type=text placeholder=Action…/></td><td><input type=text placeholder=Responsable…/></td><td><input type=date/></td>')">
      <i class="fas fa-plus"></i> Ajouter une ligne
    </button>

    <div class="sub-title" style="margin-top:16px"><i class="fas fa-exclamation-triangle"></i> Constats et Recommandations (5.2)</div>
    <table class="dyn-table" id="const-52">
      <thead><tr><th style="width:70px">Point</th><th>Constats</th><th>Recommandations</th></tr></thead>
      <tbody><tr>
        <td><input type="text" placeholder="Réf…"/></td>
        <td><textarea rows="2" placeholder="Décrivez le constat…"></textarea></td>
        <td><textarea rows="2" placeholder="Recommandation…"></textarea></td>
      </tr></tbody>
    </table>
    <button class="add-btn" onclick="addRow('const-52','<td><input type=text placeholder=Réf…/></td><td><textarea rows=2 placeholder=Décrivez le constat…></textarea></td><td><textarea rows=2 placeholder=Recommandation…></textarea></td>')">
      <i class="fas fa-plus"></i> Ajouter une ligne
    </button>

    <div class="sub-title" style="margin-top:16px"><i class="fas fa-comment-alt"></i> Commentaires</div>
    <div class="form-group-full"><textarea rows="3" placeholder="Commentaires…"></textarea></div>

    <div class="sub-title" style="margin-top:16px"><i class="fas fa-paperclip"></i> Annexes (5.2)</div>
    <div class="ann-list" id="ann-52">
      <div class="ann-row"><div class="ann-num">01</div><input type="text" placeholder="Référence…"/><label class="ann-file-btn" title="Importer un fichier"><i class="fas fa-paperclip"></i><input type="file" style="display:none" onchange="handleAnnFile(this)"/></label><span class="ann-file-name"></span><button class="del-btn" onclick="this.closest('.ann-row').remove()"><i class="fas fa-times"></i></button></div>
      <div class="ann-row"><div class="ann-num">02</div><input type="text" placeholder="Référence…"/><label class="ann-file-btn" title="Importer un fichier"><i class="fas fa-paperclip"></i><input type="file" style="display:none" onchange="handleAnnFile(this)"/></label><span class="ann-file-name"></span><button class="del-btn" onclick="this.closest('.ann-row').remove()"><i class="fas fa-times"></i></button></div>
    </div>
    <button class="add-btn" style="margin-top:8px" onclick="addAnnTo('ann-52')"><i class="fas fa-plus"></i> Ajouter une annexe</button>

    <!-- Section 8 — Politique et structure de l'épargne -->
    ${buildStructureEpargne()}

    <!-- 3.2.2 — Évolution des activités : Ressources -->
    ${buildEvolutionRessources()}
  `;
}

/* ════════════════════════════════════════════
   BUILDER — Finance et Comptabilité (Index 6)
════════════════════════════════════════════ */
function buildFinance(bloc, g) {

  // Données par sous-section
  const SECTIONS = [
    {
      id: '61', index: '6.1', titre: 'Trésorerie',
      objectif: "S'assurer du respect des dispositions relatives à la lutte contre le blanchiment des capitaux et le financement du terrorisme et de la mise en place d'un dispositif pour limiter les risques opérationnels et protéger les déposants.",
      acts: [
        "S'assurer qu'il existe des responsables de caisse et identifier leurs rôles",
        "Identifier les personnes qui procèdent aux arrêtés de caisse et déterminer la périodicité",
        "S'assurer que les PV de caisse sont signés par toutes les personnes désignées à cet effet",
        "Vérifier si la production des détails d'encaisse est journalière et si la rédaction est adéquate (signature, exactitude des soldes, composition des valeurs déclarées)",
        "Évaluer les procédures de transferts de fonds en interne (entre la caisse et le coffre fort ou entre le caissier, le comptable, le responsable financier ou le gérant)",
        "Examiner les transactions de dépôt et de retrait aux comptes bancaires afin de s'assurer que les opérations inscrites aux relevés de compte et au grand-livre sont conformes",
        "Vérifier l'existence de la confirmation des soldes en fin d'année des comptes bancaires maintenus par le SFD",
        "Analyser le montant de numéraire conservé au local afin de vérifier si le SFD maintient des montants disproportionnés par rapport à ses besoins",
        "Vérifier la conservation sécuritaire de l'encaisse au coffre-fort et dans les tiroirs des caissiers",
        "Vérifier si les suspens anciens sont bien suivis",
        "S'assurer que les provisions nécessaires ont été constituées pour les suspens de plus d'un an",
      ]
    },
    {
      id: '62', index: '6.2', titre: 'Comptabilisation des liquidités',
      objectif: "Veiller à la bonne gestion de la trésorerie.",
      acts: [
        "A10 Valeur en caisse — contrôler physiquement la caisse, en dressant le procès-verbal d’inventaire et s’assurer de la séparation selon la monnaie ;",
        "A10 Valeur en caisse — contrôler sur la base des procès-verbaux d’inventaire de caisse disponibles de l’organisation régulière des contrôles physiques ;",
        "A10 Valeur en caisse — contrôler la conformité entre l’encaisse physique et le solde en comptabilité (extrait du compte caisse) et le brouillard de caisse le cas échéant ;",
        "A10 Valeur en caisse — contrôler les opérations en monnaie locale et en devises sur pièces ;",
        "A10 Valeur en caisse — contrôler l’encaisse eu égard au plafond prévu dans les procédures et au montant assuré",
        "A12 Comptes ordinaires débiteurs — s’assurer de l’existence des états de rapprochement, contrôler ces états et analyser les éventuels suspens ;",
        "A12 Comptes ordinaires débiteurs — analyser l’évolution annuelle de la structure des dépôts afin d’identifier les classer par contrepartie, par affectation, durée initiale et durée résiduelle ;",
        "A12 Comptes ordinaires débiteurs — contrôler la réalité, la justification et la bonne classification des comptes par confirmation directe/Sondage ;",
        "A12 Comptes ordinaires débiteurs — contrôler l’effectivité et la conformité du dispositif de Lutte Anti Blanchiment ;",
        "A12 Comptes ordinaires débiteurs — contrôler les systèmes de paiement et moyens de paiement (effets, virements et prélèvements, cartes de paiement ou de débit et les porte- monnaies électroniques) :",
        "A12 Comptes ordinaires débiteurs — justification,",
        "A12 Comptes ordinaires débiteurs — réalité et classification des comptes de liaison, d’attente et d’encaissement",
        "A2A Autres comptes de dépôts débiteurs — s'assurer de l'existence et de l'exactitude des soldes des comptes des institutions financières;",
        "A2A Autres comptes de dépôts débiteurs — s'assurer que les intérêts créditeurs et débiteurs sont correctement calculés et comptabilisés à la date d’arrêté;",
        "A2A Autres comptes de dépôts débiteurs — s'assurer que les comptes des institutions financières sont correctement présentés dans les états financiers;",
        "A2A Autres comptes de dépôts débiteurs — s’assurer de la justification des « valeurs non imputées » et « autres sommes dues »;",
        "A2A Autres comptes de dépôts débiteurs — contrôler les arrêtés des comptes (taux, agios) et la correcte classification des comptes de charges et produits",
      ]
    },
    {
      id: '63', index: '6.3', titre: 'Obligations comptables',
      objectif: "S'assurer de l'application des dispositions prévues par le référentiel comptable spécifique des SFD.",
      acts: [
        "Vérifier le respect des méthodes et règles comptables prévues par le référentiel comptable spécifique des SFD",
        "Vérifier l'existence d'une piste d'audit de manière transversale à l'organisation comptable",
        "Vérifier la concordance de la balance avec les documents de synthèse",
        "S'assurer que le SFD remplit les obligations comptables suivantes : disponibilité d'un manuel de procédures administratives, comptables et financières ; existence et fonctionnalité d'un système de traitement des opérations comptables ; respect du cadre comptable prévu par le référentiel ; établissement de comptes consolidés et combinés le cas échéant ; tenue effective de tous les documents requis",
        "S'assurer de la disponibilité des documents de conception, de réalisation et de mise en œuvre des applications informatiques et de l'application de règles strictes d'interdiction d'insertion",
        "Contrôler la conservation des documents conformément aux dispositions réglementaires",
      ]
    },
    {
      id: '64', index: '6.4', titre: 'Transmission des documents de synthèse',
      objectif: "S'assurer du respect des dispositions légales et réglementaires de production et de transmission des documents de synthèse.",
      acts: [
        // Contrôler l’exhaustivité des documents de synthèse
        "Contrôler l’exhaustivité des documents de synthèse — s’assurer que les documents de synthèse comprennent : Bilan, Hors bilan, Compte de résultat, soldes intermédiaires de gestion et annexes",
        "Contrôler l’exhaustivité des documents de synthèse — s’assurer du respect des principes comptables et des règles de regroupement sécurisées et fiables des comptes en codes postes pour l’établissement des documents de synthèse (voir les tableaux de correspondance du Référentiel)",
        "Contrôler la conformité de la forme des documents de synthèse par rapport aux modèles présentés dans le Nouveau Référentiel Comptable",
        "Contrôler le respect des normes d’établissement — s’assurer que les documents de synthèse sont arrêtés le 31 décembre de chaque année ;",
        "Contrôler le respect des normes d’établissement — s’assurer que les SFD de l’article 44 de la loi présentent leurs comptes suivant la version développée ;",
        "Contrôler le respect des normes d’établissement — s’assurer que les autres SFD adoptent la version allégée ;",
        "Contrôler le respect des normes d’établissement — s’assurer que les Unions, Fédérations et Confédérations produisent les états financiers sur une base combinée, regroupant leurs institutions de base ;",
        "Contrôler le respect des normes d’établissement — s’assurer que les Unions, Fédérations et Confédérations produisent les états financiers en consolidant selon le mode approprié les filiales détenues ;",
        "Contrôler le respect des normes d’établissement — s’assurer que les SFD non mutualistes ou non coopératives présentent des comptes sur base consolidée regroupant les filiales",
        "Contrôler le respect les modalités de transmission et de conservation — s’assurer que les SFD transmettent des documents de synthèse arrêtés par le Conseil d’Administration et approuvés par l’Assemblée Générale",
        "Contrôler le respect les modalités de transmission et de conservation — s’assurer pour les SFD de l’article 44 que les documents de synthèse ont fait l’objet de travaux de certification par les Commissaires aux comptes ;",
        "Contrôler le respect les modalités de transmission et de conservation — s’assurer  pour les SFD visés à l’article 44 que les documents de synthèse  sont transmis en cinq (5) exemplaires au Ministère chargé des Finances, et en deux (2) exemplaires à la BCEAO et à la Commission Bancaire, un délai de six (6) mois après la clôture de l’exercice ;",
        "Contrôler le respect les modalités de transmission et de conservation — s’assurer pour les autres SFD que les documents de synthèse  sont transmis en cinq (5)  exemplaires au Ministère chargé des finances, dans un délai de six (6)  mois après la clôture de l’exercice ;",
        "Contrôler le respect les modalités de transmission et de conservation — s’assurer que les documents de synthèse sont transmis sous format papier au Ministère chargé des Finances, à la BCEAO et à la Commission Bancaire, sous la signature d’une personne habilitée par la structure ou d’un commissaire aux comptes ;",
        "Contrôler le respect les modalités de transmission et de conservation — s’assurer que les documents de synthèse sont transmis sous format électronique bien que cette condition ne soit obligatoire pour les SFD de l’entité ;",
        "Contrôler le respect les modalités de transmission et de conservation — s’assurer que les documents de synthèse sont conservés durant 10 ans et les conditions de conservation sont satisfaisant",
        "Contrôler la cohérence entre les documents de synthèse et leur conformité aux principes comptables — s’assurer de l’intangibilité du bilan d’ouverture ;",
        "Contrôler la cohérence entre les documents de synthèse et leur conformité aux principes comptables — s’assurer de l’égalité du résultat figurant au bilan et du résultat du compte de résultat ;",
        "Contrôler la cohérence entre les documents de synthèse et leur conformité aux principes comptables — s’assurer de la cohérence entre les provisions et amortissements au bilan et leur contrepartie au compte de résultat ;",
        "Contrôler la cohérence entre les documents de synthèse et leur conformité aux principes comptables — s’assurer du contrôle arithmétique exact des différents documents ;",
        "Contrôler la cohérence entre les documents de synthèse et leur conformité aux principes comptables — s’assurer de la prise en compte effective et correcte des décisions des organes dans les comptes",
      ]
    },
    {
      id: '65', index: '6.5', titre: 'Bilan (Actif)',
      objectif: "S'assurer du respect des dispositions légales et réglementaires relatives à la comptabilité des SFD, notamment le RCSSFD.",
      acts: [
        "A10 Valeur en caisse — contrôler physiquement la caisse, en dressant le procès-verbal d’inventaire et s’assurer de la séparation selon la monnaie ;",
        "A10 Valeur en caisse — contrôler sur la base des procès-verbaux d’inventaire de caisse disponibles de l’organisation régulière des contrôles physiques ;",
        "A10 Valeur en caisse — contrôler la conformité entre l’encaisse physique et le solde en comptabilité (extrait du compte caisse) et le brouillard de caisse le cas échéant ;",
        "A10 Valeur en caisse — contrôler les opérations en monnaie locale et devises sur pièces ;",
        "A10 Valeur en caisse — contrôler l’encaisse eu égard au plafond prévu dans les procédures et/ou assuré",
        "A12 Comptes ordinaires débiteurs — s’assurer de l’existence des états de rapprochement, contrôler ces états et analyser les éventuels suspens ;",
        "A12 Comptes ordinaires débiteurs — analyser l’évolution annuelle de la structure des dépôts afin d’identifier les classer par contrepartie, par affectation, durée initiale et durée résiduelle ;",
        "A12 Comptes ordinaires débiteurs — contrôler la réalité, la justification et la bonne classification des comptes par confirmation directe/Sondage ;",
        "A12 Comptes ordinaires débiteurs — contrôler l’effectivité et la conformité du dispositif de Lutte Anti Blanchiment ;",
        "A12 Comptes ordinaires débiteurs — contrôler les systèmes de paiement et moyens de paiement (effets, virements et prélèvements, cartes de paiement ou de débit et les porte-monnaies électroniques) :",
        "A12 Comptes ordinaires débiteurs — justification,",
        "A12 Comptes ordinaires débiteurs — réalité et classification des comptes de liaison, d’attente et d’encaissement",
        "A2A Autres comptes de dépôts débiteurs — s'assurer de l'existence et de l'exactitude des soldes des comptes des correspondants ;",
        "A2A Autres comptes de dépôts débiteurs — s'assurer que les intérêts créditeurs et débiteurs sont correctement calculés et comptabilisés à la date d’arrêté ;",
        "A2A Autres comptes de dépôts débiteurs — s'assurer que les comptes correspondants sont correctement présentés dans les états financiers ;",
        "A2A Autres comptes de dépôts débiteurs — s’assurer de la justification des « valeurs non imputées » et « autres sommes dues » ;",
        "A2A Autres comptes de dépôts débiteurs — contrôler les arrêtés des comptes (taux, agios) et la correcte classification des comptes de charges et produits",
        "A3A Comptes de prêts /A70Comptes de prêts en souffrance — pour les crédits aux institutions financières, procéder à la justification de la réalité et à la correcte classification ;",
        "A3A Comptes de prêts /A70Comptes de prêts en souffrance — contrôler la correcte classification des Créances en souffrance et des provisions liées",
        "A3A Comptes de prêts /A70Comptes de prêts en souffrance — pour les crédits aux particuliers et entreprises, procéder à la justification de la réalité et à la correcte classification ;",
        "A3A Comptes de prêts /A70Comptes de prêts en souffrance — pour les engagements par signature, s’assurer de l’exhaustivité des enregistrements et paiements et de la perception des commissions",
        "A60 Créances rattachées/ Institutions financières — rapprocher les pièces justificatives des montants comptabilisés et les analyser conjointement avec les produits;",
        "A60 Créances rattachées/ Institutions financières — refaire les calculs par sondage;",
        "A60 Créances rattachées/ Institutions financières — s'assurer que le SFD dispose d'outils adéquats pour déterminer avec exactitude les intérêts courus pour tous les types de compte d'actif concernés",
        "B2D, B30, B40 Crédits, B70 Comptes de crédits en souffrance — pour les crédits aux particuliers et entreprises, procéder à la justification de la réalité et à la correcte classification;",
        "B2D, B30, B40 Crédits, B70 Comptes de crédits en souffrance — pour les engagements par signature s’assurer de l’exhaustivité des enregistrements et paiements et de la perception des commissions ;",
        "B2D, B30, B40 Crédits, B70 Comptes de crédits en souffrance — contrôler la correcte classification des créances en souffrance et des provisions liées ;",
        "B2D, B30, B40 Crédits, B70 Comptes de crédits en souffrance — faire la revue analytique et l’historique des provisions (méthode, taux, justification) ;",
        "B2D, B30, B40 Crédits, B70 Comptes de crédits en souffrance — s’assurer que l'ensemble des lignes de crédit et des cautions accordées existent et sont comptabilisées avec exactitude ;",
        "B2D, B30, B40 Crédits, B70 Comptes de crédits en souffrance — s’assurer que l'ensemble des dossiers fait l'objet d'un suivi régulier et les provisions afférentes sont correctement évaluées ;",
        "B2D, B30, B40 Crédits, B70 Comptes de crédits en souffrance — s’assurer que l'ensemble des prêts et autres types de crédit est comptabilisé sur le correct exercice ;",
        "B2D, B30, B40 Crédits, B70 Comptes de crédits en souffrance — s’assurer que l'ensemble des prêts et autres types de crédit fait l'objet d'une correcte classification comptable dans les états financiers;",
        "B2D, B30, B40 Crédits, B70 Comptes de crédits en souffrance — s’assurer de la justification des comptes en confrontant les soldes aux sommes des contrats en cours ;",
        "B2D, B30, B40 Crédits, B70 Comptes de crédits en souffrance — s’assurer de l’exactitude et de la réalité des soldes par confirmation directe",
        "B2D, B30, B40 Crédits, B70 Comptes de crédits en souffrance — s’assurer de la correcte classification des opérations ;",
        "B2D, B30, B40 Crédits, B70 Comptes de crédits en souffrance — s’assurer de l’existence d’une convention avec la contrepartie",
        "B65 Créances rattachées/ Membres ou clients — rapprocher le solde comptable et l'analyse des comptes ;",
        "B65 Créances rattachées/ Membres ou clients — justifier ces différentes analyses ;",
        "B65 Créances rattachées/ Membres ou clients — vérifier les différents calculs (sondage) ;",
        "B65 Créances rattachées/ Membres ou clients — s'assurer que le SFD dispose d'outils adéquats pour déterminer avec exactitude les intérêts courus pour tous les types de comptes d'actif concernés",
        "C10 Titres de placement — s’assurer de la justification, de la réalité et de la bonne classification ;",
        "C10 Titres de placement — contrôler les acquisitions et cessions ;",
        "C10 Titres de placement — contrôler l’exhaustivité des enregistrements des titres en hors bilan ;",
        "C10 Titres de placement — s’assurer de leur correcte évaluation et de l’exactitude de l’information dans l’annexe et le rapport de gestion et du respect du principe d’indépendance des exercices ;",
        "C10 Titres de placement — s’assurer que les titres enregistrés dans les états financiers existent et font l'objet d'une comptabilisation exhaustive et exacte ;",
        "C10 Titres de placement — s’assurer que les titres enregistrés dans les états financiers font l'objet d'une correcte classification selon les instructions de la BCEAO ;",
        "C10 Titres de placement — s’assurer que les titres sont correctement valorisés compte tenu de leur classification ;",
        "C10 Titres de placement — s’assurer que les titres font l'objet d'un correct provisionnement compte tenu de leur classification et des couvertures (si elles existent) qui leurs sont associées",
        "C10 Titres de placement — s’assurer que les opérations sur titres font l'objet d'un correct traitement comptable",
        "C10 Titres de placement — s’assurer que les plus et moins-values ont été correctement comptabilisées ;",
        "C10 Titres de placement — s’assurer que les provisions éventuellement constituées ont été reprises pour les titres cédés",
        "C30 Les comptes de stocks — vérifier la classification, l’évaluation et l’existence des stocks ;",
        "C30 Les comptes de stocks — s’assurer que les stocks sont correctement appréhendés et comptabilisés, existent, appartiennent à l’institution ;",
        "C30 Les comptes de stocks — s’assurer que la valorisation des stocks est correctement calculée, à l'aide d'une méthode admise par les normes comptables en vigueur (FIFO, PUMP);",
        "C30 Les comptes de stocks — s’assurer que les chevauchements de fin de période sont correctement appréhendés;",
        "C30 Les comptes de stocks — s’assurer que l'évaluation des stocks est justifiée : les provisions pour dépréciation estimées nécessaires sont comptabilisées",
        "C56 Valeurs à l’encaissement — par sondage, procéder à la justification des comptes ;",
        "C56 Valeurs à l’encaissement — vérifier les dates de remise à l’encaissement, contrôler les valeurs en suspens (pièce, apurement, encaissement)",
        "C56 Valeurs à l’encaissement — contrôler les montants en attente importants et l’ancienneté des suspens",
        "C59 valeurs à rejeter — par sondage, procéder à la justification des comptes ;",
        "C59 valeurs à rejeter — vérifier les dates de remise à l’encaissement, contrôler les valeurs en suspens (pièce, apurement, encaissement) ;",
        "C59 valeurs à rejeter — contrôler les montants en attente importants et l’ancienneté des suspens",
        "D50 Crédit-bail et opérations assimilées — pour le crédit-bail, contrôler la comptabilité financière et sociale et faire une revue comparative des paiements de loyers, identifier les impayés et contrôler la provision et la réserve latente ;",
        "D50 Crédit-bail et opérations assimilées — s’assurer de la correcte classification des biens selon la nature du contrat, l’objet du bien et l’actualité du contrat ;",
        "D50 Crédit-bail et opérations assimilées — obtenir le tableau d’amortissement et contrôler la réalité et l’exactitude des paiements",
        "B2N comptes ordinaires débiteurs — s’assurer de la réalité et de la correcte classification des dépôts des membres, bénéficiaires ou clients ;",
        "B2N comptes ordinaires débiteurs — analyser l’évolution annuelle de la structure des dépôts ;",
        "B2N comptes ordinaires débiteurs — contrôler la réalité, la justification et la bonne classification des comptes par confirmation directe/Sondage ;",
        "B2N comptes ordinaires débiteurs — contrôler les arrêtés des comptes (taux, agios) et la correcte classification des comptes de charges et produits",
        "B2N comptes ordinaires débiteurs — identifier les comptes et transactions à risques : personnel, clientèle occasionnelle ou non résidente, personnes morales, PPE, comptes dormants, ouverts par des intermédiaires, comptes fréquemment débiteurs …",
        "B2N comptes ordinaires débiteurs — contrôler l’effectivité et la conformité du dispositif de Lutte Anti Blanchiment ;",
        "B2N comptes ordinaires débiteurs — contrôler les systèmes de paiement et moyens de paiement (effets, virements et prélèvements, cartes de paiement ou de débit et les portes monnaies électroniques) :",
        "B2N comptes ordinaires débiteurs — justification,",
        "B2N comptes ordinaires débiteurs — réalité et classification des comptes de liaison, d’attente et d’encaissement",
        "C40 Débiteurs divers — faire la revue analytique des comptes débiteurs et créditeurs divers ;",
        "C40 Débiteurs divers — vérifier la correcte classification ;",
        "C40 Débiteurs divers — contrôler par sondage la justification des comptes ;",
        "C40 Débiteurs divers — contrôler l’absence d’opérations avec les Membres, bénéficiaires ou clients ou les Institutions financières ;",
        "C40 Débiteurs divers — par sondage vérifier les comptes avec le personnel, avec l’État, les fournisseurs, les autres débiteurs ;",
        "C40 Débiteurs divers — s’assurer que les sommes non versées à la fin de chaque période sont comptabilisées ;",
        "C40 Débiteurs divers — s’assurer que les montants comptabilisés sont justes, compte tenu des engagements vis-à-vis des salariés",
        "C40 Débiteurs divers — s’assurer que la comptabilisation des coûts sociaux est en adéquation avec les normes comptables en vigueur ;",
        "C40 Débiteurs divers — s’assurer que les décaissements sont conformes aux salaires nets figurant sur les états de paie et les déclarations fiscales et sociales",
        "C6A Comptes d’ordre et divers : pour les opérations en devises — justifier les comptes en devises ;",
        "C6A Comptes d’ordre et divers : pour les opérations en devises — contrôler le résultat de change et comparer avec la période précédente et s’assurer du respect de la séparation d’exercices ;",
        "C6A Comptes d’ordre et divers : pour les opérations en devises — s’assurer de l’exactitude, de l’existence et de l’exhaustivité des comptes libellés en devises et donc de la position de change ;",
        "C6A Comptes d’ordre et divers : pour les opérations en devises — s’assurer que les opérations de change sont correctement présentées dans les états financiers ;",
        "C6A Comptes d’ordre et divers : pour les opérations en devises — s’assurer de l’exactitude du résultat de change ;",
        "C6A Comptes d’ordre et divers : pour les opérations en devises — examiner les comptes « gains et pertes de change » ;",
        "C6A Comptes d’ordre et divers : pour les opérations en devises — comparer le résultat de change avec les résultats calculés par les cambistes et avec les résultats budgétés et les résultats de l’exercice précédent ;",
        "C6A Comptes d’ordre et divers : pour les opérations en devises — contrôler l’exactitude des cours de réévaluation utilisés ;",
        "C6A Comptes d’ordre et divers : pour les opérations en devises — s’assurer que toutes les positions de change sont prises en compte ;",
        "C6A Comptes d’ordre et divers : pour les opérations en devises — s’assurer de la justification de tous les comptes en devises, en particulier les comptes de correspondants, les engagements au comptant à terme ferme ou optionnels (hors bilan), les comptes d’ajustement en devises ;",
        "C6A Comptes d’ordre et divers : pour les opérations en devises — rapprocher la position de change cambiste de la position de change comptable ;",
        "C6A Comptes d’ordre et divers : pour les opérations en devises — s’assurer du respect de l’indépendance des exercices en vérifiant que la comptabilisation des opérations et du résultat de change a été faite à la bonne date",
        "C6A Comptes d’ordre et divers : pour les opérations en devises — s’assurer de la correcte classification et de la justification en fin d’année et du solde des comptes à l’ouverture des comptes des comptes de régularisation actif",
        "D01 Valeurs immobilisées — vérifier l’existence des immobilisations en inventoriant un échantillon et en confrontant fichier des immobilisations et extraits de comptes ;",
        "D01 Valeurs immobilisées — vérifier l’exactitude de l’évaluation des immobilisations notamment avec les provisions constituées sur les immobilisations incorporelles et les titres ;",
        "D01 Valeurs immobilisées — s’assurer que les productions de l’institution pour elle-même sont comptabilisées en fin d’exercice en production en cours ;",
        "D01 Valeurs immobilisées — s’assurer de l’exhaustivité de la documentation justifiant les immobilisations en cours et de leur correcte évaluation ;",
        "D01 Valeurs immobilisées — s’assurer que les immobilisations incorporelles ne nécessitent pas la constitution de provision ;",
        "D01 Valeurs immobilisées — s’assurer que les immobilisations acquises suite à des garanties ont fait l’objet de la procédure de réalisation avant comptabilisation ;",
        "D01 Valeurs immobilisées — contrôler par sondage des acquisitions, cessions ou autres sorties de l’exercice ;",
        "D01 Valeurs immobilisées — contrôler par sondage le calcul des amortissements",
        "D01 Valeurs immobilisées — s’assurer que les immobilisations comptabilisées existent et appartiennent à l’institution et sont utilisées dans le cadre de l’activité financière (immobilisation d’exploitation) et de l’activité non financière (immobilisation hors exploitation) ;",
        "D01 Valeurs immobilisées — s’assurer que les éléments qui doivent être immobilisés le sont, les cessions et autres mouvements de sortie sont tous comptabilisés ainsi que les plus ou moins-values qu'ils ont générées;",
        "D01 Valeurs immobilisées — s’assurer de la réalité des plus-values par la justification documentaire des cessions;",
        "D01 Valeurs immobilisées — s’assurer de la justification et de la conformité des immobilisations acquises suite à la réalisation des garanties;",
        "D01 Valeurs immobilisées — s’assurer que les montants immobilisés sont justes et ne comprennent pas d'éléments devant être comptabilisés en charges;",
        "D01 Valeurs immobilisées — s’assurer que tous les dividendes, intérêts et autres produits portant sur des immobilisations financières sont comptabilisés;",
        "D01 Valeurs immobilisées — s’assurer que la valorisation des opérations et la présentation des comptes sont correctes et en adéquation avec les normes comptables en vigueur;",
        "D01 Valeurs immobilisées — s’assurer du paiement à date et à bonne valeur des versements restant à effectuer",
      ]
    },
    {
      id: '66', index: '6.6', titre: 'Bilan (Passif)',
      objectif: "S'assurer du respect des dispositions légales et réglementaires relatives à la comptabilité des SFD, notamment le RCSSFD.",
      acts: [
        "F1A — Comptes ordinaires créditeurs : états de rapprochement, classification, Lutte Anti-Blanchiment, systèmes de paiement",
        "F2A — Autres comptes de dépôts créditeurs : exactitude des soldes, intérêts, présentation dans les états financiers, justification des valeurs non imputées",
        "F3A / G60 — Comptes d'emprunts : justification des soldes aux contrats en cours, confirmation directe, classification, existence d'une convention avec la contrepartie",
        "F60 — Dettes rattachées / Institutions financières : vérification des montants, exhaustivité des dettes rattachées dans le résultat, outils fiables de calcul",
        "F50 / G70 — Autres sommes dues aux institutions financières / membres ou clients : exhaustivité et correcte évaluation des provisions, justification des valeurs non imputées",
        "G10 — Comptes ordinaires créditeurs membres : évolution annuelle des dépôts, classification, Lutte Anti-Blanchiment, systèmes de paiement",
        "G15 / G2A / G30 / G35 — Autres comptes des membres, bénéficiaires ou clients : exactitude des soldes, intérêts créditeurs, présentation dans les états financiers, arrêtés des comptes",
        "G90 — Dettes rattachées / Membres ou clients : vérification des montants, exhaustivité, outils fiables de calcul",
        "H40 — Créditeurs divers : revue analytique, classification, justification par sondage, charges sociales, conformité des décaissements aux états de paie",
        "H6A — Comptes d'ordre et divers en devises : justification, résultat de change, exactitude des cours de réévaluation, indépendance des exercices",
        "E01 — Actionnaires, associés ou membres : vérification que les comptes ne sont pas débiteurs, justification des soldes, soldement suite aux libérations de capital",
        "E05 / L75-L82 — Excédent des charges sur les produits : réalité et justification des comptes de résultat eu égard aux décisions des organes",
        "L01 — Subvention d'investissement : classification, réalité, amortissement de l'immobilisation subventionnée",
        "L20 — Fonds affectés : classification, utilisation conforme aux objets des conventions, restitution si applicable",
        "L30 — Provisions pour risques et charges : examen analytique, justification, exhaustivité, réalité de l'information en annexe",
        "L35 — Provisions réglementées : examen analytique, justification, conformité aux règles fiscales",
        "L41 / L43 — Emprunts et titres subordonnés : exactitude des opérations, réalité par confirmation directe, évaluation",
        "L45 — Fonds pour risques financiers généraux : examen analytique, justification, exhaustivité",
        "L50 — Primes liées au capital : utilisation uniquement par les SFD sous forme de sociétés, justification des opérations, exactitude du calcul des primes",
        "L55 — Réserves : comptes de résultat eu égard aux décisions des organes, correcte classification selon nature et objet",
        "L59 — Écart de réévaluation des immobilisations : respect des principes de réévaluation, justification, exactitude du calcul",
        "L60 — Capital : vérification aux décisions des organes, correcte classification des étapes de constitution du capital",
        "L65 — Fonds de dotation : classification, justification des éléments en compte",
        "L70 — Report à nouveau : vérification aux décisions des organes, justification des éléments en lien avec les comptes de capital et de réserves",
      ]
    },
    {
      id: '67', index: '6.7', titre: 'Engagements hors bilan',
      objectif: "S'assurer du respect des dispositions légales et réglementaires relatives à la comptabilité des SFD, notamment le RCSSFD.",
      acts: [
        "N1A / N1J — Engagements de financement donnés (institutions financières / membres ou clients) : contrôler les pièces justificatives et le caractère irrévocable ; s'assurer du solde des comptes une fois les opérations enregistrées au bilan",
        "N1H / N1K — Engagements de financement reçus (institutions financières / membres ou clients) : contrôler les pièces justificatives ; s'assurer du solde des comptes une fois les opérations effectuées et enregistrées au bilan",
        "N2A / N2J — Engagements de garantie donnés (institutions financières / membres ou clients) : contrôler les pièces justificatives ; s'assurer de la reprise de la provision si l'exécution est effective ou si le client a réglé",
        "N2H / N2M — Engagements de garantie reçus (institutions financières / membres ou clients) : contrôler les pièces justificatives ; s'assurer du solde des comptes une fois les opérations enregistrées au bilan",
        "N3A — Titres à livrer : justification en nombre et en valeur ; solde des comptes une fois les titres livrés et enregistrés au bilan",
        "N3E — Titres à recevoir : justification en nombre et en valeur ; solde des comptes une fois les titres acquis et enregistrés au bilan",
        "Opérations de change au comptant : contrôler les pièces justificatives ; s'assurer qu'il ne s'agit que d'opérations avec délai d'usance",
        "Opérations de change à terme : contrôler les pièces justificatives ; contrôler le calcul des déports et reports sur la base des conditions contractuelles",
        "Prêts et emprunts en devises : contrôler les pièces justificatives ; s'assurer du solde des comptes dès la réalisation au bilan",
        "Autres engagements : contrôler les pièces justificatives ; s'assurer de la correcte évaluation des garanties",
        "Opérations effectuées pour le compte de tiers : contrôler la correcte comptabilisation des crédits sur ressources affectées en lien avec les postes 18 et 20 ; s'assurer de la correcte comptabilisation des opérations consortiales",
        "N90 — Engagement douteux : contrôler les pièces justificatives ; s'assurer de la réalité et de l'exactitude de la provision ; s'assurer de la reprise de la provision si l'exécution est effective",
      ]
    },
    {
      id: '68', index: '6.8', titre: 'Comptes de gestion – Charges',
      objectif: "S'assurer du respect des dispositions légales et réglementaires relatives à la comptabilité des SFD, notamment le RCSSFD.",
      acts: [
        "R1A — Intérêts sur comptes ordinaires créditeurs : revue analytique, justification des opérations, recalcul par sondage",
        "R1L — Intérêts sur autres comptes de dépôts créditeurs : revue analytique, justification, recalcul par sondage eu égard à la spécificité des conventions",
        "R2A — Intérêts sur comptes d'emprunts : revue analytique des intérêts, comparaison avec les données des emprunts contractés, contrôle sur la base des tableaux de remboursement",
        "R2R — Autres intérêts : revue analytique, justification des opérations, recalcul par sondage",
        "R3C — Intérêts sur comptes des membres, bénéficiaires ou clients : revue analytique, justification, recalcul par sondage eu égard aux conventions et termes des dépôts",
        "R3T — Commissions : revue analytique, justification des opérations, recalcul par sondage",
        "R4B — Charges sur opérations sur titres et opérations diverses : correct calcul en lien avec les comptes de la classe 3, justification des opérations",
        "R5B — Charges sur immobilisations financières : correct calcul en lien avec les comptes de la classe 4, justification des opérations",
        "R5E — Charges sur crédit-bail et opérations assimilées : correct calcul en lien avec les comptes de la classe 4, justification des opérations",
        "R6A — Charges sur opérations de change : correct calcul en lien avec les comptes de classe 1 et 3 sur les opérations en devises",
        "R6F — Charges sur opérations hors bilan : correct calcul en lien avec les comptes de la classe 9, justification des opérations",
        "R6V — Charges sur prestations de services financiers : correct calcul basé sur les documents liés aux comptes et conventions, justification",
        "R6X — Autres charges sur prestations de services financiers : correct calcul en lien avec les cessions d'actifs, justification",
        "S02 — Frais de personnel : correcte comptabilisation en lien avec les comptes de personnel ; conformité des déclarations de salaires et des obligations de cotisation retraite et sécurité sociale",
        "S1A — Impôts et taxes : respect des obligations fiscales selon la forme juridique ; exactitude des impôts calculés et versés en lien avec les comptes de charges de personnel",
        "S2B — Services extérieurs : correct calcul des loyers et redevances ; correcte comptabilisation des dépenses d'entretien et réparations ; étalement des primes d'assurance ; respect du principe de séparation des exercices",
        "S3A — Autres services extérieurs : réalité des charges aux prestataires ; correcte classification ; respect du principe de séparation des exercices",
        "S4A — Charges diverses d'exploitation : correct calcul des redevances, indemnités de fonction, frais d'assemblées, résultat sur cession négatif des immobilisations",
        "T50 — Dotations au fonds pour risques financiers généraux : correct calcul des montants de reprise",
        "T51 — Dotations aux amortissements et provisions sur immobilisations : contrôle en lien avec les comptes d'immobilisations, exhaustivité et réalité des informations pour les reprises de provisions",
        "T6B — Dotations aux provisions et pertes sur créances irrécouvrables : enregistrement des provisions conformément aux règles de déclassement ; passation en pertes pour les créances provisionnées à 100% ayant atteint 24 mois d'impayés",
        "T80 — Charges exceptionnelles : caractère exceptionnel de la charge, séparation des exercices, réalité au support de pièces",
        "T81 — Pertes sur exercices antérieurs : caractère antérieur de la charge, séparation des exercices, réalité au support de pièces",
        "T82 — Impôts sur les excédents : correct calcul des résultats sur activité microfinance et autres activités ; conformité des déclarations d'impôts ; réalité des paiements",
      ]
    },
    {
      id: '69', index: '6.9', titre: 'Comptes de gestion – Produits',
      objectif: "S'assurer du respect des dispositions légales et réglementaires relatives à la comptabilité des SFD, notamment le RCSSFD.",
      acts: [
        "V1A — Intérêts sur comptes débiteurs : revue analytique, justification des opérations, recalcul par sondage",
        "V1L — Intérêts sur autres comptes de dépôts débiteurs : revue analytique, justification, recalcul par sondage eu égard aux conventions et termes des dépôts",
        "V2A — Intérêts sur comptes de prêt : revue analytique, correct calcul des intérêts et cessation pour les prêts en souffrance ; recouvrements post déclassement enregistrés en produits exceptionnels",
        "V2Q — Autres intérêts : revue analytique, justification des opérations, recalcul par sondage",
        "V2T — Commissions : revue analytique, justification des opérations, recalcul par sondage",
        "V3B — Intérêts sur prêts aux membres, bénéficiaires ou clients : revue analytique, correct calcul, cessation pour les prêts en souffrance, recouvrements post déclassement enregistrés en produits exceptionnels",
        "V3R — Autres intérêts : revue analytique, justification, recalcul par sondage",
        "V3X — Commissions : revue analytique, justification, s'assurer que les droits d'adhésion sont enregistrés dans ces comptes, recalcul par sondage",
        "V4B — Produits sur opérations sur titres et opérations diverses : correct calcul en lien avec les comptes de la classe 3, justification",
        "V5B — Produits sur immobilisations financières : correct calcul en lien avec les comptes de la classe 4, justification",
        "V5G — Produits sur opérations de crédit-bail et opérations assimilées : correct calcul en lien avec les comptes de la classe 4, justification",
        "V6A — Produits sur opérations de change : correct calcul en lien avec les comptes de classe 1 et 3, justification",
        "V6F — Produits sur opérations hors bilan : correct calcul en lien avec les comptes de la classe 9, justification",
        "V6U — Produits sur prestations de services financiers : correct calcul basé sur les documents liés aux comptes et conventions, justification",
        "V7A — Autres produits d'exploitation financière : correct calcul en lien avec les cessions d'actifs, justification",
        "W4A — Produits divers d'exploitation : correct calcul des redevances, indemnités de fonction reçues, justification",
        "W50 — Production immobilisée : enregistrement des immobilisations en cours en fin d'exercice, évaluation exacte selon le Référentiel",
        "W53 — Subvention d'exploitation : conformité de la nature de la subvention selon le Référentiel, justification de toutes les opérations",
        "X50 — Reprise du fonds pour risques financiers généraux : correct calcul des montants de reprise dès la réévaluation du risque",
        "X51 — Reprise d'amortissements et provisions sur immobilisations : contrôle en lien avec les comptes d'immobilisations, justification des reprises",
        "X6B — Reprise de provisions et récupérations sur créances amorties : enregistrement de toutes les créances ayant fait l'objet de provisions et de passation en pertes",
        "X80 — Produits exceptionnels : caractère exceptionnel du produit, séparation des exercices, réalité au support de pièces",
        "X81 — Profits sur exercices antérieurs : caractère antérieur du produit, séparation des exercices, réalité au support de pièces",
      ]
    },
    {
      id: '610', index: '6.10', titre: 'Consolidation et combinaison',
      objectif: "S'assurer du respect des dispositions légales et réglementaires (notamment le RCSSFD) relatives à la combinaison et consolidation.",
      acts: [
        "S'assurer pour chaque faîtière mutualiste ou coopérative de l'espace UEMOA de l'établissement de comptes combinés intégrant les SFD ayant des liens d'unicité et de cohésion, partageant une direction commune et constituant un ensemble homogène",
        "S'assurer pour chaque SFD ayant une prise de participation dans une autre société de l'établissement de comptes consolidés suivant les techniques comptables appropriées en fonction du taux et du mode de contrôle exercé sur la filiale",
        "S'assurer de l'établissement de comptes consolidés même si les entreprises considérées isolément ne présentent pas un caractère significatif mais que leur consolidation présente un intérêt au regard de l'image fidèle",
        "S'assurer de la justification matérielle de toute exclusion du périmètre de consolidation/combinaison (remise en cause du contrôle, actions détenues en vue de cession, impossibilité d'obtenir les informations nécessaires sans frais excessifs)",
        "S'assurer de la justification de toute exclusion facultative (entreprises dont total bilan ≤ 2% du total bilan de l'entreprise mère)",
        "S'assurer de l'existence de procédures internes de consolidation/combinaison, de l'existence juridique de toute entité incluse dans le champ, de la permanence des méthodes, et de l'existence d'un journal comptable spécifique",
        "S'assurer de l'élimination des comptes réciproques : actif/passif et produits/charges (comptes de dépôts, prêts, emprunts, créances rattachées, titres de participation, charges et produits relatifs au fonctionnement des comptes de la structure faîtière)",
        "Procéder aux contrôles : harmonisation des méthodes d'évaluation ; élimination des incidences fiscales ; enregistrement des impôts différés ; vérification des capitaux propres, capital, et résultats combinés",
      ]
    },
    {
      id: '611', index: '6.11', titre: 'Qualité des réserves de liquidité',
      objectif: "S'assurer que le SFD a accès à des sources additionnelles de liquidité.",
      acts: [
        "Vérifier si l'institution a un accès effectif et direct ou indirect à un refinancement de la part de la BCEAO (avec ou sans mise en garantie d'actifs acceptés par la banque centrale)",
        "Vérifier si le SFD a des accords de crédit avec des banques et identifier à quelle hauteur des dépôts à vue (DAV)",
      ]
    },
  ];

  // Générateur de lignes d'activités
  function actRows(acts) {
    return acts.map((a, i) => `
      <tr>
        <td class="act-num">${i + 1}</td>
        <td>${a}</td>
        <td><input type="text" placeholder="Initiales" style="width:68px;text-align:center"/></td>
        <td>
          <div class="lacune-wrap">
            <button class="lacune-btn" onclick="setLacune(this,'oui')">O</button>
            <button class="lacune-btn" onclick="setLacune(this,'non')">N</button>
          </div>
        </td>
        <td><textarea class="act-comment" rows="1" placeholder="Commentaire…"></textarea></td>
      </tr>`).join('');
  }

  // Générateur d'une sous-section complète
  function buildSection(s) {
    return `
      <div class="sub-title" style="margin-top:32px"><i class="fas fa-file-signature"></i> ${s.index} — ${s.titre}</div>
      <div class="info-box" style="background:#F0FDF4;border-color:#86EFAC;color:#166534">
        <i class="fas fa-bullseye" style="color:#16A34A"></i>
        <span><strong>Objectif :</strong> ${s.objectif}</span>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
        <div class="form-group-full"><label>Réviseur</label><input type="text" placeholder="Nom du réviseur"/></div>
        <div class="form-group-full"><label>Date</label><input type="date"/></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
        <div class="form-group-full"><label>Référence 1</label><input type="text" placeholder="Ex : RCSSFD, Instruction BCEAO n°…"/></div>
        <div class="form-group-full"><label>Référence 2</label><input type="text" placeholder=""/></div>
      </div>
      <table class="act-table">
        <thead><tr>
          <th style="width:38px">N°</th><th>Activités</th>
          <th style="width:82px;text-align:center">Paraphe</th>
          <th style="width:90px;text-align:center">Lacune</th>
          <th>Commentaire</th>
        </tr></thead>
        <tbody>${actRows(s.acts)}</tbody>
      </table>
      <div class="sub-title" style="margin-top:14px"><i class="fas fa-clock"></i> Suivis (${s.index})</div>
      <table class="dyn-table" id="suivi-${s.id}">
        <thead><tr><th>Point</th><th>Suivi</th><th>Responsable</th><th style="width:120px">Échéance</th></tr></thead>
        <tbody><tr>
          <td><input type="text" placeholder="Point…"/></td>
          <td><input type="text" placeholder="Action…"/></td>
          <td><input type="text" placeholder="Responsable…"/></td>
          <td><input type="date"/></td>
        </tr></tbody>
      </table>
      <button class="add-btn" onclick="addRow('suivi-${s.id}','<td><input type=text placeholder=Point…/></td><td><input type=text placeholder=Action…/></td><td><input type=text placeholder=Responsable…/></td><td><input type=date/></td>')">
        <i class="fas fa-plus"></i> Ajouter une ligne
      </button>
      <div class="sub-title" style="margin-top:14px"><i class="fas fa-exclamation-triangle"></i> Constats et Recommandations (${s.index})</div>
      <table class="dyn-table" id="const-${s.id}">
        <thead><tr><th style="width:70px">Point</th><th>Constats</th><th>Recommandations</th></tr></thead>
        <tbody><tr>
          <td><input type="text" placeholder="Réf…"/></td>
          <td><textarea rows="2" placeholder="Décrivez le constat…"></textarea></td>
          <td><textarea rows="2" placeholder="Recommandation…"></textarea></td>
        </tr></tbody>
      </table>
      <button class="add-btn" onclick="addRow('const-${s.id}','<td><input type=text placeholder=Réf…/></td><td><textarea rows=2 placeholder=Décrivez le constat…></textarea></td><td><textarea rows=2 placeholder=Recommandation…></textarea></td>')">
        <i class="fas fa-plus"></i> Ajouter une ligne
      </button>
      <div class="sub-title" style="margin-top:14px"><i class="fas fa-comment-alt"></i> Commentaires</div>
      <div class="form-group-full"><textarea rows="3" placeholder="Commentaires…"></textarea></div>
      <div class="sub-title" style="margin-top:14px"><i class="fas fa-paperclip"></i> Annexes (${s.index})</div>
      <div class="ann-list" id="ann-${s.id}">
        <div class="ann-row"><div class="ann-num">01</div><input type="text" placeholder="Référence…"/><label class="ann-file-btn" title="Importer un fichier"><i class="fas fa-paperclip"></i><input type="file" style="display:none" onchange="handleAnnFile(this)"/></label><span class="ann-file-name"></span><button class="del-btn" onclick="this.closest('.ann-row').remove()"><i class="fas fa-times"></i></button></div>
        <div class="ann-row"><div class="ann-num">02</div><input type="text" placeholder="Référence…"/><label class="ann-file-btn" title="Importer un fichier"><i class="fas fa-paperclip"></i><input type="file" style="display:none" onchange="handleAnnFile(this)"/></label><span class="ann-file-name"></span><button class="del-btn" onclick="this.closest('.ann-row').remove()"><i class="fas fa-times"></i></button></div>
      </div>
      <button class="add-btn" style="margin-top:8px" onclick="addAnnTo('ann-${s.id}')"><i class="fas fa-plus"></i> Ajouter une annexe</button>
    `;
  }

  const ctrlPoints = [
    "Trésorerie", "Comptabilisation de la liquidité", "Obligations comptables",
    "Respect des obligations légales et réglementaires de production et de transmission des documents de synthèse",
    "Bilan (actif)", "Bilan (passif)", "Engagements hors bilan",
    "Comptes de gestion (charges)", "Comptes de gestion (produits)",
    "Consolidation et combinaison", "Qualité des réserves de liquidité"
  ];

  return `
    <div class="info-box">
      <i class="fas fa-info-circle"></i>
      SFD : <strong>${g.sfd || '—'}</strong> &nbsp;|&nbsp;
      Inspecteur : <strong>${g.inspecteur || '—'}</strong> &nbsp;|&nbsp;
      Chef de mission : <strong>${g.chef || '—'}</strong>
    </div>

    <!-- 6.0 Fiche de rubrique -->
    <div class="sub-title"><i class="fas fa-folder"></i> 6.0 — Fiche de Rubrique</div>
    <p style="font-size:12px;color:var(--text-muted);margin-bottom:12px">
      Pour chaque point de contrôle, cochez le niveau de risque identifié.
    </p>
    <table class="ctrl-table">
      <thead><tr>
        <th style="width:58%">Point de contrôle</th>
        <th class="eval-cell">Élevé</th>
        <th class="eval-cell">Moyen</th>
        <th class="eval-cell">Faible</th>
      </tr></thead>
      <tbody>
        ${ctrlPoints.map((pt, i) => `
        <tr>
          <td>${i + 1}. ${pt}</td>
          <td class="eval-cell"><input type="radio" name="fin_ctrl${i}" value="eleve"/></td>
          <td class="eval-cell"><input type="radio" name="fin_ctrl${i}" value="moyen"/></td>
          <td class="eval-cell"><input type="radio" name="fin_ctrl${i}" value="faible"/></td>
        </tr>`).join('')}
      </tbody>
    </table>

    <div class="sub-title" style="margin-top:22px"><i class="fas fa-chart-line"></i> Évolution depuis la dernière inspection</div>
    <div class="radio-row">
      <label class="radio-pill"><input type="radio" name="fin_evol" value="amelioree"/> <i class="fas fa-arrow-up" style="color:#22C55E"></i> Améliorée</label>
      <label class="radio-pill"><input type="radio" name="fin_evol" value="stable"/> <i class="fas fa-minus" style="color:#F59E0B"></i> Stable</label>
      <label class="radio-pill"><input type="radio" name="fin_evol" value="deterioree"/> <i class="fas fa-arrow-down" style="color:#EF4444"></i> Détériorée</label>
    </div>

    <div class="sub-title" style="margin-top:22px"><i class="fas fa-comment-alt"></i> Commentaires pour le rapport (6.0)</div>
    <div class="form-group-full">
      <textarea rows="3" id="comm-general-fin" placeholder="Synthèse à intégrer dans le rapport final…"></textarea>
    </div>

    <!-- Sous-sections 6.1 à 6.11 -->
    ${SECTIONS.map(s => buildSection(s)).join('')}

    <!-- 3.2.3 — Résultats -->
    ${buildResultats()}

    <!-- 3.2.4 — Fonds propres -->
    ${buildFondsPropres()}

    <!-- 11 — Ratios prudentiels -->
    ${buildRatiosPrudentiels()}
  `;
}

/* ════════════════════════════════════════════
   BUILDER — Crédit (Index 4)
════════════════════════════════════════════ */
function buildCredit(bloc, g) {

  const SECTIONS = [
    {
      id: '41', index: '4.1', titre: 'Politique de crédit',
      objectif: "S'assurer de la définition d'une politique prudente de crédit conforme aux dispositions législatives et réglementaires et permettant d'éviter les risques liés aux prêts.",
      acts: [
        "Vérifier la mise en place d'une politique en matière de crédit avec : des procédures écrites où la politique est clairement définie ; des objectifs en conformité avec la réglementation des SFD ; une procédure d'évaluation de la qualité des emprunteurs ; un système interne clair et précis de délégation pour l'octroi des crédits ; une procédure indiquant clairement qui autorise le crédit, son montant et les conditions",
        "Vérifier que la politique de crédit respecte les limites fixées par les normes en matière de couverture et de division des risques : risque maximal sur un client ; limites des prêts aux dirigeants, au personnel et aux personnes liées",
        "Contrôler l'existence dans la politique de crédit d'un système de séparation des tâches qui assure que : le déblocage des crédits est effectué par une personne différente de celle qui l'autorise ; avant le déblocage, les contrôles suivants sont réalisés : existence d'un dossier complet, existence des garanties prévues, seuls les crédits autorisés peuvent être débloqués",
        "Contrôler les opérations du SFD avec les personnes apparentées : s'assurer que ces opérations sont conformes aux dispositions légales et réglementaires ; s'assurer que le SFD a produit tous les registres et formulaires requis ; vérifier la liste des comptes et les prêts accordés aux personnes apparentées",
      ]
    },
    {
      id: '42', index: '4.2', titre: 'Étude des dossiers de crédit',
      objectif: "S'assurer que les demandes de prêt font l'objet d'une étude en vue de limiter l'exposition aux risques de crédit ainsi qu'aux risques réglementaires.",
      acts: [
        "S'assurer que les dossiers de crédit sont suffisamment structurés, documentés et clairs ; contiennent des informations suffisantes permettant de porter une appréciation objective sur la qualité du risque ; sont conservés dans des conditions de sécurité acceptables",
      ]
    },
    {
      id: '43', index: '4.3', titre: 'Mise en place des crédits',
      objectif: "S'assurer du respect des conditions débitrices, de la loi sur le taux d'usure et des ratios prudentiels (division des risques, crédit aux dirigeants et au personnel, couverture des engagements à LMT, etc.).",
      acts: [
        "Vérifier la mise en place d'un dispositif qui assure le respect des dispositions légales en matière d'octroi de crédit : l'objet du crédit et la source de remboursement ; l'intégrité de l'emprunteur et sa réputation concernant le respect de ses engagements ; la capacité de remboursement de l'emprunteur (présente et à venir) ; la qualité des garanties ; la nature des affaires de l'emprunteur ; les aptitudes de l'emprunteur à gérer son entreprise commerciale",
        "S'assurer du respect de la loi sur le taux d'usure et des conditions débitrices",
      ]
    },
    {
      id: '44', index: '4.4', titre: 'Suivi et recouvrement des crédits',
      objectif: "S'assurer que les crédits mis en place sont suivis dans l'optique de limiter les risques.",
      acts: [
        "Vérifier que le suivi des risques permet : d'identifier les crédits dont la date de remboursement a expiré ; de centraliser et traiter régulièrement les impayés ; de détecter d'éventuelles anomalies dans les mouvements de comptes de crédit",
        "Identifier si la variation du volume des prêts en souffrance est principalement causée par : la conjoncture économique en général ; des événements survenus dans la région ; une faiblesse dans un des processus de gestion",
        "Analyser les mécanismes de suivi et les mesures de recouvrement (voir fiche 4.4.1)",
        "Évaluer si des actions suffisantes ont été menées en temps opportun",
        "S'assurer que les critères de déclassement des crédits en souffrance et les règles concernant la provision sont respectés",
        "S'assurer que les intérêts cessent d'être comptabilisés dès lors qu'un crédit est déclassé en crédit en souffrance",
        "Vérifier que : la définition des fonctions 'exploitation' et 'contentieux' est suffisamment claire ; une procédure pour les créances douteuses est disponible ; les dossiers contentieux ou litigieux sont promptement transmis au contentieux ; il existe une politique claire en matière de classification des créances douteuses",
      ]
    },
    {
      id: '45', index: '4.5', titre: 'Comptabilisation des opérations de crédit',
      objectif: "S'assurer que les opérations de crédit sont comptabilisées selon les dispositions du référentiel comptable des SFD et de la mise en place d'un dispositif pour gérer les risques opérationnels.",
      acts: [
        "A3A / A70 — Comptes de prêts / Comptes de prêts en souffrance : justification de la réalité et correcte classification des crédits aux institutions financières ; contrôle de la correcte classification des créances en souffrance et des provisions liées",
        "A60 — Créances rattachées / Institutions financières : rapprocher les pièces justificatives des montants comptabilisés et les analyser conjointement avec les produits ; refaire les calculs par sondage ; s'assurer que le SFD dispose d'outils adéquats pour déterminer avec exactitude les intérêts courus",
        "B65 — Créances rattachées / Membres ou clients : rapprocher le solde comptable et l'analyse des comptes ; justifier les différentes analyses ; vérifier les calculs par sondage ; s'assurer que le SFD dispose d'outils adéquats pour déterminer les intérêts courus",
        "B2D / B30 / B40 / B70 — Crédits / Comptes de crédits en souffrance : justification de la réalité et correcte classification ; exhaustivité des enregistrements et paiements des engagements par signature ; revue analytique et historique des provisions (méthode, taux, justification) ; suivi régulier des dossiers et correcte évaluation des provisions ; comptabilisation sur le correct exercice ; justification des comptes en confrontant les soldes aux contrats en cours ; exactitude et réalité des soldes par confirmation directe ; existence d'une convention avec la contrepartie",
      ]
    },
  ];

  function actRows(acts) {
    return acts.map((a, i) => `
      <tr>
        <td class="act-num">${i + 1}</td>
        <td>${a}</td>
        <td><input type="text" placeholder="Initiales" style="width:68px;text-align:center"/></td>
        <td>
          <div class="lacune-wrap">
            <button class="lacune-btn" onclick="setLacune(this,'oui')">O</button>
            <button class="lacune-btn" onclick="setLacune(this,'non')">N</button>
          </div>
        </td>
        <td><textarea class="act-comment" rows="1" placeholder="Commentaire…"></textarea></td>
      </tr>`).join('');
  }

  function buildSection(s) {
    return `
      <div class="sub-title" style="margin-top:32px"><i class="fas fa-file-signature"></i> ${s.index} — ${s.titre}</div>
      <div class="info-box" style="background:#F0FDF4;border-color:#86EFAC;color:#166534">
        <i class="fas fa-bullseye" style="color:#16A34A"></i>
        <span><strong>Objectif :</strong> ${s.objectif}</span>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
        <div class="form-group-full"><label>Réviseur</label><input type="text" placeholder="Nom du réviseur"/></div>
        <div class="form-group-full"><label>Date</label><input type="date"/></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
        <div class="form-group-full"><label>Référence 1</label><input type="text" placeholder="Ex : Instruction BCEAO n°…"/></div>
        <div class="form-group-full"><label>Référence 2</label><input type="text" placeholder=""/></div>
      </div>
      <table class="act-table">
        <thead><tr>
          <th style="width:38px">N°</th><th>Activités</th>
          <th style="width:82px;text-align:center">Paraphe</th>
          <th style="width:90px;text-align:center">Lacune</th>
          <th>Commentaire</th>
        </tr></thead>
        <tbody>${actRows(s.acts)}</tbody>
      </table>
      <div class="sub-title" style="margin-top:14px"><i class="fas fa-clock"></i> Suivis (${s.index})</div>
      <table class="dyn-table" id="suivi-${s.id}">
        <thead><tr><th>Point</th><th>Suivi</th><th>Responsable</th><th style="width:120px">Échéance</th></tr></thead>
        <tbody><tr>
          <td><input type="text" placeholder="Point…"/></td>
          <td><input type="text" placeholder="Action…"/></td>
          <td><input type="text" placeholder="Responsable…"/></td>
          <td><input type="date"/></td>
        </tr></tbody>
      </table>
      <button class="add-btn" onclick="addRow('suivi-${s.id}','<td><input type=text placeholder=Point…/></td><td><input type=text placeholder=Action…/></td><td><input type=text placeholder=Responsable…/></td><td><input type=date/></td>')">
        <i class="fas fa-plus"></i> Ajouter une ligne
      </button>
      <div class="sub-title" style="margin-top:14px"><i class="fas fa-exclamation-triangle"></i> Constats et Recommandations (${s.index})</div>
      <table class="dyn-table" id="const-${s.id}">
        <thead><tr><th style="width:70px">Point</th><th>Constats</th><th>Recommandations</th></tr></thead>
        <tbody><tr>
          <td><input type="text" placeholder="Réf…"/></td>
          <td><textarea rows="2" placeholder="Décrivez le constat…"></textarea></td>
          <td><textarea rows="2" placeholder="Recommandation…"></textarea></td>
        </tr></tbody>
      </table>
      <button class="add-btn" onclick="addRow('const-${s.id}','<td><input type=text placeholder=Réf…/></td><td><textarea rows=2 placeholder=Décrivez le constat…></textarea></td><td><textarea rows=2 placeholder=Recommandation…></textarea></td>')">
        <i class="fas fa-plus"></i> Ajouter une ligne
      </button>
      <div class="sub-title" style="margin-top:14px"><i class="fas fa-comment-alt"></i> Commentaires</div>
      <div class="form-group-full"><textarea rows="3" placeholder="Commentaires…"></textarea></div>
      <div class="sub-title" style="margin-top:14px"><i class="fas fa-paperclip"></i> Annexes (${s.index})</div>
      <div class="ann-list" id="ann-${s.id}">
        <div class="ann-row"><div class="ann-num">01</div><input type="text" placeholder="Référence…"/><label class="ann-file-btn" title="Importer un fichier"><i class="fas fa-paperclip"></i><input type="file" style="display:none" onchange="handleAnnFile(this)"/></label><span class="ann-file-name"></span><button class="del-btn" onclick="this.closest('.ann-row').remove()"><i class="fas fa-times"></i></button></div>
        <div class="ann-row"><div class="ann-num">02</div><input type="text" placeholder="Référence…"/><label class="ann-file-btn" title="Importer un fichier"><i class="fas fa-paperclip"></i><input type="file" style="display:none" onchange="handleAnnFile(this)"/></label><span class="ann-file-name"></span><button class="del-btn" onclick="this.closest('.ann-row').remove()"><i class="fas fa-times"></i></button></div>
      </div>
      <button class="add-btn" style="margin-top:8px" onclick="addAnnTo('ann-${s.id}')"><i class="fas fa-plus"></i> Ajouter une annexe</button>
    `;
  }

  // Grille d'analyse dossier de crédit (4.3.1)
  const grille431 = `
    <div class="sub-title" style="margin-top:32px"><i class="fas fa-table"></i> 4.3.1 — Grille d'analyse des dossiers de crédit</div>
    <div class="info-box" style="background:#F0FDF4;border-color:#86EFAC;color:#166534">
      <i class="fas fa-bullseye" style="color:#16A34A"></i>
      <span><strong>Objectif :</strong> S'assurer du respect de la politique de crédit et de la réglementation en vigueur. À compléter pour chaque dossier de crédit analysé.</span>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
      <div class="form-group-full"><label>Nom de l'agent de crédit</label><input type="text" placeholder="Nom…"/></div>
      <div class="form-group-full"><label>Réviseur</label><input type="text" placeholder="Nom du réviseur"/></div>
    </div>

    <p style="font-size:12px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.4px;margin-bottom:10px">1.1 — Renseignements sur l'emprunteur et sur le crédit</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px">
      <div class="form-group-full"><label>Compte</label><input type="text" placeholder="N° de compte"/></div>
      <div class="form-group-full"><label>Nom de l'emprunteur</label><input type="text" placeholder="Nom…"/></div>
      <div class="form-group-full"><label>Nature des activités</label><input type="text" placeholder=""/></div>
      <div class="form-group-full"><label>But du crédit</label><input type="text" placeholder=""/></div>
      <div class="form-group-full"><label>Montant du crédit</label><input type="text" placeholder="FCFA"/></div>
      <div class="form-group-full"><label>Solde (encours)</label><input type="text" placeholder="FCFA"/></div>
      <div class="form-group-full"><label>Garanties (nature, valeur)</label><input type="text" placeholder=""/></div>
      <div class="form-group-full"><label>Revenus totaux de l'emprunteur</label><input type="text" placeholder="FCFA"/></div>
      <div class="form-group-full"><label>Ratio ATD (engagements mensuels / revenus mensuels)</label><input type="text" placeholder="%"/></div>
      <div class="form-group-full"><label>Taux d'intérêt</label><input type="text" placeholder="%"/></div>
    </div>

    <p style="font-size:12px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.4px;margin:14px 0 10px">Situation du crédit à la date de l'inspection</p>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:10px">
      ${['À jour','< 30 jours','30–90 jours','91–180 jours','181–365 jours','366–720 jours','> 720 jours'].map(lbl => `
      <div class="form-group-full"><label>${lbl}</label><input type="text" placeholder="nb échéances"/></div>`).join('')}
    </div>

    <p style="font-size:12px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.4px;margin:14px 0 10px">1.2 & 1.3 — Caution et garanties</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">
      <div class="form-group-full"><label>Compte de la caution</label><input type="text" placeholder=""/></div>
      <div class="form-group-full"><label>Nom de la caution</label><input type="text" placeholder=""/></div>
      <div class="form-group-full"><label>Profession / métier de la caution</label><input type="text" placeholder=""/></div>
    </div>

    <table class="ctrl-table" style="margin-bottom:12px">
      <thead><tr><th style="width:70%">Évaluation des cautions et garanties</th><th class="eval-cell">Oui</th><th class="eval-cell">Lacune</th><th class="eval-cell">N/A</th></tr></thead>
      <tbody>
        <tr><td>a) Solvabilité de la caution : l'institution a validé et analysé les informations justifiant la légitimité du cautionnement et la capacité de payer de la caution</td>
          <td class="eval-cell"><input type="radio" name="cred_caut_a" value="oui"/></td>
          <td class="eval-cell"><input type="radio" name="cred_caut_a" value="lacune"/></td>
          <td class="eval-cell"><input type="radio" name="cred_caut_a" value="na"/></td></tr>
        <tr><td>b) Valeurs des garanties : les garanties ont été évaluées à leur juste valeur par l'institution</td>
          <td class="eval-cell"><input type="radio" name="cred_caut_b" value="oui"/></td>
          <td class="eval-cell"><input type="radio" name="cred_caut_b" value="lacune"/></td>
          <td class="eval-cell"><input type="radio" name="cred_caut_b" value="na"/></td></tr>
      </tbody>
    </table>

    <p style="font-size:12px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.4px;margin:14px 0 10px">2 — Gestion du crédit</p>
    <table class="ctrl-table" style="margin-bottom:12px">
      <thead><tr><th style="width:70%">Critères</th><th class="eval-cell">Oui</th><th class="eval-cell">Lacune</th><th class="eval-cell">N/A</th></tr></thead>
      <tbody>
        ${[
          ['cred_g1','2.1 — Informations complètes à la demande d\'emprunt'],
          ['cred_g2','2.1 — Analyse et validation suffisantes (qualité de l\'emprunteur, capacité de remboursement, photos si immeuble, titre de propriété…)'],
          ['cred_g3','2.1 — Recommandation claire et autorisation obtenue par le niveau requis'],
          ['cred_g4','2.1 — Constitution de l\'épargne bloquée et des autres obligations'],
          ['cred_g5','2.2 — Conformité de la documentation (tous les documents requis, conditions clairement explicites)'],
          ['cred_g6','2.2 — Signatures à la demande d\'emprunt, au contrat de crédit, à la mise en garantie'],
          ['cred_g7','2.2 — Certificat de propriété foncière / Attestation de propriété / Contrat de location'],
          ['cred_g8','2.3 — Débours à l\'épargne de l\'emprunteur (compte d\'épargne, chèque ou virement au fournisseur)'],
          ['cred_g9','2.3 — Suivi du débours (l\'utilisation des fonds a été vérifiée)'],
          ['cred_g10','2.3 — Comptabilisation du prêt et des frais de dossier aux livres : journal, grand-livre, fiche de l\'emprunteur'],
        ].map(([name, label]) => `
        <tr><td>${label}</td>
          <td class="eval-cell"><input type="radio" name="${name}" value="oui"/></td>
          <td class="eval-cell"><input type="radio" name="${name}" value="lacune"/></td>
          <td class="eval-cell"><input type="radio" name="${name}" value="na"/></td></tr>`).join('')}
      </tbody>
    </table>

    <p style="font-size:12px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.4px;margin:14px 0 10px">3 — Risque de crédit</p>
    <div class="radio-row" style="margin-bottom:12px">
      <label class="radio-pill"><input type="radio" name="cred_risque" value="eleve"/> <span style="color:#EF4444">●</span> Élevé</label>
      <label class="radio-pill"><input type="radio" name="cred_risque" value="moyen"/> <span style="color:#F59E0B">●</span> Moyen</label>
      <label class="radio-pill"><input type="radio" name="cred_risque" value="faible"/> <span style="color:#22C55E">●</span> Faible</label>
    </div>
    <div class="form-group-full"><label>Commentaires si le risque est élevé</label><textarea rows="2" placeholder="Commentaires…"></textarea></div>

    <p style="font-size:12px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.4px;margin:14px 0 10px">4 — Réglementation</p>
    <table class="ctrl-table" style="margin-bottom:12px">
      <thead><tr><th style="width:70%">Critères</th><th class="eval-cell">Oui</th><th class="eval-cell">Lacune</th></tr></thead>
      <tbody>
        ${[
          ['cred_r1','Respect de la politique de crédit'],
          ['cred_r2','Respect des conditions d\'octroi du crédit'],
          ['cred_r3','Niveau d\'autorisation respecté'],
          ['cred_r4','Limites de crédit respectées (limites réglementaires et limites de gestion fixées par le CA ou la DG)'],
          ['cred_r5','Taux d\'intérêt conforme'],
          ['cred_r6','Frais de services conformes (pas de crédit usuraire, respect de la politique en matière de frais)'],
        ].map(([name, label]) => `
        <tr><td>${label}</td>
          <td class="eval-cell"><input type="radio" name="${name}" value="oui"/></td>
          <td class="eval-cell"><input type="radio" name="${name}" value="lacune"/></td></tr>`).join('')}
      </tbody>
    </table>

    <p style="font-size:12px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.4px;margin:14px 0 10px">5 — Autres commentaires</p>
    <table class="ctrl-table" style="margin-bottom:12px">
      <thead><tr><th style="width:70%">Critère</th><th class="eval-cell">Oui</th><th class="eval-cell">Lacune</th></tr></thead>
      <tbody>
        <tr><td>Le dossier est conservé de façon sécuritaire et confidentielle</td>
          <td class="eval-cell"><input type="radio" name="cred_sec" value="oui"/></td>
          <td class="eval-cell"><input type="radio" name="cred_sec" value="lacune"/></td></tr>
      </tbody>
    </table>
    <div class="form-group-full"><label>Autres commentaires relatifs à ce crédit</label><textarea rows="2" placeholder="Commentaires…"></textarea></div>
  `;

  // Grille d'analyse crédits en souffrance (4.4.1)
  const grille441 = `
    <div class="sub-title" style="margin-top:32px"><i class="fas fa-table"></i> 4.4.1 — Grille d'analyse des crédits en souffrance</div>
    <div class="info-box" style="background:#FEF2F2;border-color:#FCA5A5;color:#991B1B">
      <i class="fas fa-bullseye" style="color:#EF4444"></i>
      <span><strong>Objectif :</strong> S'assurer du respect de la politique de recouvrement des crédits et de la réglementation en vigueur. Analyser les 10 plus vieux crédits en souffrance. Une fiche par dossier.</span>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">
      <div class="form-group-full"><label>Compte</label><input type="text" placeholder="N° de compte"/></div>
      <div class="form-group-full"><label>Nom de l'emprunteur</label><input type="text" placeholder="Nom…"/></div>
      <div class="form-group-full"><label>Nature des activités</label><input type="text" placeholder=""/></div>
      <div class="form-group-full"><label>But du crédit</label><input type="text" placeholder=""/></div>
      <div class="form-group-full"><label>Montant du crédit</label><input type="text" placeholder="FCFA"/></div>
      <div class="form-group-full"><label>Date du crédit</label><input type="date"/></div>
      <div class="form-group-full"><label>Date de dernière échéance</label><input type="date"/></div>
      <div class="form-group-full"><label>Solde (encours)</label><input type="text" placeholder="FCFA"/></div>
      <div class="form-group-full"><label>Garanties (nature, valeur)</label><input type="text" placeholder=""/></div>
    </div>

    <table class="ctrl-table" style="margin-bottom:12px">
      <thead><tr><th style="width:70%">a) Processus de recouvrement</th><th class="eval-cell">Oui</th><th class="eval-cell">Lacune</th><th class="eval-cell">N/A</th></tr></thead>
      <tbody>
        ${[
          ['cred_rec1','Démarches entreprises promptement'],
          ['cred_rec2','Révision de la situation financière de l\'emprunteur / des cautions'],
          ['cred_rec3','Garanties réévaluées (existence, valeur)'],
          ['cred_rec4','Les règles de déclassement et de provisionnement sont respectées'],
          ['cred_rec5','Cessation de la comptabilisation des intérêts sur les crédits déclassés'],
          ['cred_rec6','Plan de redressement élaboré et appliqué (rééchelonnement)'],
          ['cred_rec7','Démarche de saisie et/ou respect des ententes prises'],
          ['cred_rec8','Mise à jour du formulaire de suivi du crédit en retard ou équivalent'],
          ['cred_rec9','Actions de l\'institution en relation avec la nature, l\'importance, le degré de risque assumé'],
        ].map(([name, label]) => `
        <tr><td>${label}</td>
          <td class="eval-cell"><input type="radio" name="${name}" value="oui"/></td>
          <td class="eval-cell"><input type="radio" name="${name}" value="lacune"/></td>
          <td class="eval-cell"><input type="radio" name="${name}" value="na"/></td></tr>`).join('')}
      </tbody>
    </table>

    <table class="ctrl-table" style="margin-bottom:12px">
      <thead><tr><th style="width:70%">b) Documentation</th><th class="eval-cell">Oui</th><th class="eval-cell">Lacune</th><th class="eval-cell">N/A</th></tr></thead>
      <tbody>
        <tr><td>Documentation produite, signée, pertinente et classement adéquat (actions de suivi et de recouvrement documentées et classées adéquatement)</td>
          <td class="eval-cell"><input type="radio" name="cred_doc" value="oui"/></td>
          <td class="eval-cell"><input type="radio" name="cred_doc" value="lacune"/></td>
          <td class="eval-cell"><input type="radio" name="cred_doc" value="na"/></td></tr>
      </tbody>
    </table>

    <div class="form-group-full"><label>c) Montant réel ou approximatif de la perte estimée</label><input type="text" placeholder="FCFA — Voir capacité de remboursement et garanties"/></div>
    <div class="form-group-full" style="margin-top:10px"><label>Autres commentaires relatifs à ce crédit</label><textarea rows="2" placeholder="Commentaires…"></textarea></div>
  `;

  return `
    <div class="info-box">
      <i class="fas fa-info-circle"></i>
      SFD : <strong>${g.sfd || '—'}</strong> &nbsp;|&nbsp;
      Inspecteur : <strong>${g.inspecteur || '—'}</strong> &nbsp;|&nbsp;
      Chef de mission : <strong>${g.chef || '—'}</strong>
    </div>

    <!-- 4.0 Fiche de rubrique -->
    <div class="sub-title"><i class="fas fa-folder"></i> 4.0 — Fiche de Rubrique</div>
    <p style="font-size:12px;color:var(--text-muted);margin-bottom:12px">
      Pour chaque point de contrôle, cochez le niveau de risque identifié.
    </p>
    <table class="ctrl-table">
      <thead><tr>
        <th style="width:46%">Point de contrôle</th>
        <th class="eval-cell">Élevé</th>
        <th class="eval-cell">Moyen</th>
        <th class="eval-cell">Faible</th>
      </tr></thead>
      <tbody>
        ${['Politique de crédit','Étude des dossiers de crédit','Mise en place des crédits','Suivi et recouvrement des crédits','Comptabilisation des opérations de crédit'].map((pt, i) => `
        <tr>
          <td>${i + 1}. ${pt}</td>
          <td class="eval-cell"><input type="radio" name="cred_ctrl${i}" value="eleve"/></td>
          <td class="eval-cell"><input type="radio" name="cred_ctrl${i}" value="moyen"/></td>
          <td class="eval-cell"><input type="radio" name="cred_ctrl${i}" value="faible"/></td>
        </tr>`).join('')}
      </tbody>
    </table>

    <div class="sub-title" style="margin-top:22px"><i class="fas fa-chart-line"></i> Évolution depuis la dernière inspection</div>
    <div class="radio-row">
      <label class="radio-pill"><input type="radio" name="cred_evol" value="amelioree"/> <i class="fas fa-arrow-up" style="color:#22C55E"></i> Améliorée</label>
      <label class="radio-pill"><input type="radio" name="cred_evol" value="stable"/> <i class="fas fa-minus" style="color:#F59E0B"></i> Stable</label>
      <label class="radio-pill"><input type="radio" name="cred_evol" value="deterioree"/> <i class="fas fa-arrow-down" style="color:#EF4444"></i> Détériorée</label>
    </div>

    <div class="sub-title" style="margin-top:22px"><i class="fas fa-comment-alt"></i> Commentaires pour le rapport (4.0)</div>
    <div class="form-group-full">
      <textarea rows="3" id="comm-general-cred" placeholder="Synthèse à intégrer dans le rapport final…"></textarea>
    </div>

    <!-- Sections 4.1 à 4.5 -->
    ${SECTIONS.map(s => buildSection(s)).join('')}

    <!-- Grilles additionnelles -->
    ${grille431}
    ${grille441}

    <!-- 3.2.2 — Évolution des activités : Emplois -->
    ${buildEvolutionEmplois()}

    <!-- 9.2 — Analyse des dossiers de crédit -->
    ${buildAnalyseDossiersCredit()}

    <!-- 9.3 — Situation globale du crédit -->
    ${buildSituationGlobaleCredit()}

    <!-- 9.4.2 — Suivi des prêts aux dirigeants/ex-dirigeants/personnel -->
    ${buildSuiviPretsPersonnesLiees()}

    <!-- 9.4.3 — Suivi des 10 plus gros risques + créances en perte -->
    ${buildSuivi10PlusGrosRisques()}

    <!-- 9.5 — Taux de l'usure -->
    ${buildTauxUsure()}

    <!-- Tables crédit 15-24 -->
    ${buildCreditTables(g)}
  `;
}

/* ════════════════════════════════════════════
   BUILDER — Création et Gouvernance (Index 2)
════════════════════════════════════════════ */
function buildGouvernance(bloc, g) {

  const SECTIONS = [
    {
      id: 'gov21', index: '2.1', titre: 'Constitution du SFD',
      objectif: "S'assurer que le SFD respecte les dispositions légales et réglementaires relatives à l'exercice des activités de SFD.",
      refs: 'Statuts du SFD, Agrément, PV des assemblées générales, PV des conseils d\'administration',
      acts: [
        "Vérifier que les statuts du SFD sont en conformité avec les textes législatifs et réglementaires, notamment : les services et opérations prévus sont autorisés (collecte de l'épargne, opérations de crédit, engagement par signature, assurance, etc.) ; les mentions sur les enseignes sont conformes aux textes ; l'adhésion à l'Association Professionnelle des SFD",
        "Vérifier que : les organes du SFD (Assemblée Générale, Conseil d'Administration ou Conseil de surveillance, Comité de crédit) fonctionnent correctement ; la conformité et l'intégralité des PV de réunion des organes ; les décisions prises par ces organes sont en conformité avec les lois et règlements et sont dans l'intérêt du SFD et de ses membres ; les fonctions de membres de ces organes ne sont pas rémunérées",
        "S'assurer qu'il existe une structure organisationnelle définissant les pouvoirs et les responsabilités de chacun",
        "Vérifier que les renseignements attendus des dirigeants sont exhaustifs et justifiés",
        "Vérifier que les membres des structures faîtières sont choisis parmi les membres des organes de niveau immédiatement inférieurs",
        "Vérifier l'existence d'une convention d'affiliation en cas de groupement d'institutions mutualistes ou coopératives",
        "Vérifier : la libération intégrale du capital lors de la délivrance de l'agrément ; la forme (interdiction de la société unipersonnelle)",
      ]
    },
    {
      id: 'gov22', index: '2.2', titre: 'Gouvernance',
      objectif: "S'assurer que le SFD respecte les dispositions légales et réglementaires relatives à la gouvernance de SFD.",
      refs: 'Statuts, Agrément, PV AG ordinaires et extraordinaires, PV CA, Rapports de contrôle interne, Rapport auditeur externe/CAC, États périodiques',
      acts: [
        "Vérifier que la séparation est faite entre organe de gestion et organe de contrôle",
        "Vérifier que les statuts et la liste nominative des membres des organes sont communiqués au Ministre chargé des finances et au greffe de la juridiction compétente",
        "Vérifier que les organes du SFD (AG, CA ou Conseil de surveillance, Comité de crédit) fonctionnent correctement (réunions périodiques selon les délais légaux et réglementaires)",
        "Vérifier que les fonctions de membres de ces organes ne sont pas rémunérées",
        "Vérifier que les membres des organes du SFD sont responsables pécuniairement des fautes commises dans l'exercice de leurs fonctions et peuvent être suspendus ou destitués par l'AG en cas de faute grave",
        "Vérifier que l'AGO s'assure de la saine administration et du bon fonctionnement du SFD et se réunit au moins une fois par an en vue notamment : d'adopter le rapport d'activité de l'exercice ; d'examiner et approuver les comptes ; de donner quitus aux membres des organes de gestion",
        "S'assurer que les personnes exerçant les fonctions d'Administrateur, de Directeur Général ou de Gérant du SFD : remplissent les conditions de nationalité ; ne sont pas frappées par les dispositions légales d'interdiction d'exercer (condamnation définitive, faillite, etc.)",
        "Dans le cas d'une IMEC, s'assurer que l'affiliation à une union ou une fédération est : approuvée par le CA puis adoptée par l'AG ; autorisée par le Ministre chargé des Finances après avis conforme de la BCEAO ; enregistrée au greffe du tribunal et publiée",
        "Dans le cas d'une IMEC, s'assurer que la désaffiliation à une union ou une fédération est : approuvée par le CA puis adoptée par l'AGE en présence de la structure faîtière ; autorisée par le Ministre chargé des Finances après avis conforme de la BCEAO ; confirmée par un arrêté du Ministre",
        "Vérifier que l'affiliation ou la désaffiliation a fait l'objet d'une convention",
        "S'assurer le cas échéant que : le SFD n'est membre que d'une Union ayant la même vocation ; l'Union n'est membre que d'une Fédération ayant la même vocation ; la Fédération n'est membre que d'une Confédération ayant la même vocation",
        "Vérifier le cas échéant que : les membres des organes d'une union, fédération ou confédération sont choisis parmi les membres des organes des coopératives ou mutuelles de niveau immédiatement inférieur ; l'union, la fédération ou la confédération a un agrément et est inscrite au registre tenu par le Ministre",
      ]
    },
    {
      id: 'gov23sa', index: '2.3 (SA)', titre: 'Conformité — Société Anonyme (SA)',
      objectif: "S'assurer que le fonctionnement du SFD respecte les dispositions prévues pour les Sociétés Anonymes.",
      refs: 'Statuts, PV AG, PV CA, Acte Uniforme OHADA',
      acts: [
        "Vérifier que le capital minimum est de 10 000 000 FCFA pour les sociétés ne faisant pas appel à l'épargne publique et 1 000 000 FCFA dans le cas contraire. La valeur nominale d'une action ne peut être inférieure à 10 000 FCFA",
        "S'assurer que les délibérations du CA ont été sanctionnées par des procès-verbaux qui respectent les dispositions de l'article 458 en matière de forme, de contenu et de signature",
        "S'assurer que les feuilles de présence ont été établies et qu'elles sont émargées par les actionnaires présents et par les mandataires au moment de l'entrée en séance (art. 533)",
        "Vérifier que chaque feuille de présence contient : les noms, prénoms et domicile de chaque actionnaire présent ou représenté ; le nombre d'actions détenues ; le nombre de voix attachées à chaque action ; les noms, prénoms et domicile de chaque mandataire, le nombre d'actions représentées et les voix attachées (art. 532)",
        "S'assurer que la feuille de présence, à laquelle sont annexées les procurations, est certifiée sincère et véritable sous la responsabilité des scrutateurs uniquement (art. 534)",
      ]
    },
    {
      id: 'gov23sarl', index: '2.3 (SARL)', titre: 'Conformité — Société à Responsabilité Limitée (SARL)',
      objectif: "S'assurer que le fonctionnement du SFD respecte les dispositions prévues pour les SARL.",
      refs: 'Statuts, PV AG, Acte Uniforme OHADA',
      acts: [
        "Vérifier que : le capital social minimum est de 1 000 000 FCFA (art. 311 OHADA) ; le capital est divisé en parts sociales égales de valeur nominale minimale de 5 000 FCFA",
        "S'assurer que les règles de majorité ont été respectées pour l'AGO des Associés : sur 1ère convocation par un ou plusieurs associés représentant plus de la moitié du capital ; sur 2ème convocation à la majorité des votes émis quelle que soit la proportion du capital représentée",
        "S'assurer que les règles de majorité ont été respectées au cours de l'AGE : les décisions extraordinaires sont prises par les associés représentant au moins les trois quarts du capital social (art. 358) ; l'unanimité des associés est requise en ce qui concerne l'augmentation des engagements des associés (art. 359 OHADA)",
        "S'assurer que les délibérations des Assemblées sont constatées par des PV indiquant : la date ; le lieu de la réunion ; les noms et prénoms des associés présents ; les documents et rapports soumis à la discussion ; un résumé des débats ; le texte des résolutions mises aux voix (art. 342)",
        "S'assurer qu'en cas de consultation écrite, il en est fait mention dans le PV auquel est annexée la réponse de chaque associé, et qui est signé par le ou les gérants (art. 342)",
        "S'assurer que le SFD respecte les dispositions relatives aux conventions entre le SFD et ses Gérants et Associés",
        "Vérifier que l'interdiction est respectée : à peine de nullité, il est interdit aux personnes physiques gérantes ou associées de contracter des emprunts auprès de la société, de se faire consentir un découvert en compte courant, ou de faire cautionner/avaliser leurs engagements envers les tiers (art. 356) — interdiction s'appliquant également aux conjoints, ascendants, descendants et toute personne interposée",
      ]
    },
    {
      id: 'gov24', index: '2.4', titre: 'Contrôle externe',
      objectif: "S'assurer du respect des dispositions réglementaires relatives au contrôle externe du SFD.",
      refs: '',
      acts: [
        "Vérifier : le type de contrôle externe qu'a subi le SFD depuis la dernière mission d'inspection ; la fréquence des contrôles externes légaux et réglementaires ; les conclusions de ces missions sur l'administration, la comptabilité, les risques, etc. ; que les conclusions ont été communiquées au Ministère des Finances, à la Commission Bancaire et à la BCEAO",
        "S'assurer que les recommandations de ces missions ont été suivies",
        "Vérifier le respect par le SFD de la procédure d'approbation du commissaire aux comptes",
        "Examiner les plannings de vérification, les dossiers de travail, le rapport général, le rapport spécial éventuellement, ainsi que le rapport circonstancié en cas de réserves émises ou de refus de certification des comptes conformément aux exigences de la réglementation",
        "Vérifier le respect des normes relatives à la présentation et la certification des documents de fin d'exercice",
        "Entrer en contact au besoin avec les commissaires aux comptes pour apprécier les circonstances et conditions dans lesquelles certaines opinions ont été émises sur les comptes de l'institution contrôlée",
      ]
    },
    {
      id: 'gov25', index: '2.5', titre: 'Gouvernance applicable à tout SFD — Organe exécutif',
      objectif: "S'assurer que le SFD dispose d'un organe exécutif (direction générale / gérance) efficient et doté des pouvoirs appropriés.",
      refs: '',
      acts: [
        "S'assurer que les textes légaux et réglementaires accordent des pouvoirs appropriés à la bonne marche des opérations du SFD",
        "Vérifier que les statuts et règlements internes du SFD précisent les rôles et responsabilités de l'organe exécutif et qu'ils sont séparés de ceux des autres organes",
        "Vérifier que le directeur général ou gérant assume la charge effective de la gestion courante des activités du SFD",
        "Vérifier que le directeur général ou gérant assure le pilotage effectif du processus de réalisation des objectifs stratégiques",
        "Vérifier que le SFD dispose d'un organigramme clair et cohérent montrant l'autorité claire et incontestée des membres de l'organe exécutif (directeur général et ses directeurs ou adjoints) sur le personnel de l'institution",
        "S'assurer que l'organe exécutif est distinct de l'organe délibérant (élus), nommé et révoqué par lui (dans le cas d'une IMEC affiliée à un réseau, par la direction générale du réseau)",
      ]
    },
    {
      id: 'gov26', index: '2.6', titre: 'Gouvernance applicable à tout SFD — Code de déontologie',
      objectif: "S'assurer que le SFD dispose d'un code de déontologie traitant les relations avec les dirigeants et employés et qu'il s'assure du respect des normes et règlements en vigueur.",
      refs: '',
      acts: [
        "Vérifier qu'un code de déontologie est adopté et qu'il traite notamment des conflits d'intérêt à l'égard des dirigeants et des employés",
        "Vérifier que les limitations réglementaires en matière de relations d'affaires avec les dirigeants (rémunération, crédits, contrats commerciaux, etc.) ainsi qu'avec les employés sont respectées",
        "Vérifier que des procédures de prise de décision (abstention et retrait des personnes concernées lors des votes) et de transparence (communication au contrôle permanent, audit, commissaire aux comptes, etc.) sont en vigueur",
        "Vérifier qu'il existe un principe statutaire de démission d'office de tout élu présentant une échéance de crédit impayé de X jours calendaires (7, 30) ou plus directement ou par l'entremise d'une entreprise liée ou personne apparentée",
      ]
    },
    {
      id: 'gov27', index: '2.7', titre: 'Capacité effective à faire appliquer les procédures et décisions',
      objectif: "S'assurer que le SFD s'est doté de la capacité effective à faire appliquer en interne les procédures et décisions, à sanctionner et corriger les déviances, à mettre en œuvre les recommandations de l'audit interne, et à engager des poursuites financières et pénales.",
      refs: '',
      acts: [
        "Vérifier que l'organe exécutif dispose du pouvoir de faire appliquer l'ensemble des procédures et directives opérationnelles (1er niveau) et de contrôle permanent (2ème niveau) à l'ensemble des salariés, sans possibilité de blocage par un niveau inférieur",
        "S'assurer que l'organe exécutif dispose de l'autorité hiérarchique sur l'ensemble des salariés (contrats de travail) et de la gestion des mandats externes, et du pouvoir effectif de sanction des ressources humaines (licenciement pour faute, mutation dans l'intérêt du service, etc.) sans possibilité de blocage par une autre instance",
        "S'assurer que l'organe exécutif dispose du pouvoir effectif de prendre toute mesure conservatoire en cas de problème et d'engager toute poursuite en cas de préjudice pécuniaire ou d'infraction pénale commise à l'encontre de l'institution ou de ses clients",
      ]
    },
  ];

  function actRows(acts) {
    return acts.map((a, i) => `
      <tr>
        <td class="act-num">${i + 1}</td>
        <td>${a}</td>
        <td><input type="text" placeholder="Initiales" style="width:68px;text-align:center"/></td>
        <td>
          <div class="lacune-wrap">
            <button class="lacune-btn" onclick="setLacune(this,'oui')">O</button>
            <button class="lacune-btn" onclick="setLacune(this,'non')">N</button>
          </div>
        </td>
        <td><textarea class="act-comment" rows="1" placeholder="Commentaire…"></textarea></td>
      </tr>`).join('');
  }

  function buildSection(s) {
    return `
      <div class="sub-title" style="margin-top:32px"><i class="fas fa-file-signature"></i> ${s.index} — ${s.titre}</div>
      <div class="info-box" style="background:#F0FDF4;border-color:#86EFAC;color:#166534">
        <i class="fas fa-bullseye" style="color:#16A34A"></i>
        <span><strong>Objectif :</strong> ${s.objectif}</span>
      </div>
      ${s.refs ? `<div class="info-box" style="background:#EFF6FF;border-color:#BFDBFE;color:#1E40AF;margin-top:8px">
        <i class="fas fa-book" style="color:#3B82F6"></i>
        <span><strong>Références :</strong> ${s.refs}</span>
      </div>` : ''}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
        <div class="form-group-full"><label>Réviseur</label><input type="text" placeholder="Nom du réviseur"/></div>
        <div class="form-group-full"><label>Date</label><input type="date"/></div>
      </div>
      <table class="act-table">
        <thead><tr>
          <th style="width:38px">N°</th><th>Activités</th>
          <th style="width:82px;text-align:center">Paraphe</th>
          <th style="width:90px;text-align:center">Lacune</th>
          <th>Commentaire</th>
        </tr></thead>
        <tbody>${actRows(s.acts)}</tbody>
      </table>
      <div class="sub-title" style="margin-top:14px"><i class="fas fa-clock"></i> Suivis (${s.index})</div>
      <table class="dyn-table" id="suivi-${s.id}">
        <thead><tr><th>Point</th><th>Suivi</th><th>Responsable</th><th style="width:120px">Échéance</th></tr></thead>
        <tbody><tr>
          <td><input type="text" placeholder="Point…"/></td>
          <td><input type="text" placeholder="Action…"/></td>
          <td><input type="text" placeholder="Responsable…"/></td>
          <td><input type="date"/></td>
        </tr></tbody>
      </table>
      <button class="add-btn" onclick="addRow('suivi-${s.id}','<td><input type=text placeholder=Point…/></td><td><input type=text placeholder=Action…/></td><td><input type=text placeholder=Responsable…/></td><td><input type=date/></td>')">
        <i class="fas fa-plus"></i> Ajouter une ligne
      </button>
      <div class="sub-title" style="margin-top:14px"><i class="fas fa-exclamation-triangle"></i> Constats et Recommandations (${s.index})</div>
      <table class="dyn-table" id="const-${s.id}">
        <thead><tr><th style="width:70px">Point</th><th>Constats</th><th>Recommandations</th></tr></thead>
        <tbody><tr>
          <td><input type="text" placeholder="Réf…"/></td>
          <td><textarea rows="2" placeholder="Décrivez le constat…"></textarea></td>
          <td><textarea rows="2" placeholder="Recommandation…"></textarea></td>
        </tr></tbody>
      </table>
      <button class="add-btn" onclick="addRow('const-${s.id}','<td><input type=text placeholder=Réf…/></td><td><textarea rows=2 placeholder=Décrivez le constat…></textarea></td><td><textarea rows=2 placeholder=Recommandation…></textarea></td>')">
        <i class="fas fa-plus"></i> Ajouter une ligne
      </button>
      <div class="sub-title" style="margin-top:14px"><i class="fas fa-comment-alt"></i> Commentaires</div>
      <div class="form-group-full"><textarea rows="3" placeholder="Commentaires…"></textarea></div>
      <div class="sub-title" style="margin-top:14px"><i class="fas fa-paperclip"></i> Annexes (${s.index})</div>
      <div class="ann-list" id="ann-${s.id}">
        <div class="ann-row"><div class="ann-num">01</div><input type="text" placeholder="Référence…"/><label class="ann-file-btn" title="Importer un fichier"><i class="fas fa-paperclip"></i><input type="file" style="display:none" onchange="handleAnnFile(this)"/></label><span class="ann-file-name"></span><button class="del-btn" onclick="this.closest('.ann-row').remove()"><i class="fas fa-times"></i></button></div>
        <div class="ann-row"><div class="ann-num">02</div><input type="text" placeholder="Référence…"/><label class="ann-file-btn" title="Importer un fichier"><i class="fas fa-paperclip"></i><input type="file" style="display:none" onchange="handleAnnFile(this)"/></label><span class="ann-file-name"></span><button class="del-btn" onclick="this.closest('.ann-row').remove()"><i class="fas fa-times"></i></button></div>
      </div>
      <button class="add-btn" style="margin-top:8px" onclick="addAnnTo('ann-${s.id}')"><i class="fas fa-plus"></i> Ajouter une annexe</button>
    `;
  }

  const ctrlPoints = [
    "Constitution du SFD",
    "Gouvernance",
    "Conformité aux lois et décrets en matière d'organisation et de fonctionnement",
    "Contrôle externe",
    "Gouvernance applicable à tout SFD — Organe exécutif",
    "Gouvernance applicable à tout SFD — Code de déontologie",
    "Capacité effective à faire appliquer les procédures et décisions",
  ];

  return `
    <div class="info-box">
      <i class="fas fa-info-circle"></i>
      SFD : <strong>${g.sfd || '—'}</strong> &nbsp;|&nbsp;
      Inspecteur : <strong>${g.inspecteur || '—'}</strong> &nbsp;|&nbsp;
      Chef de mission : <strong>${g.chef || '—'}</strong>
    </div>

    <!-- 2.0 Fiche de rubrique -->
    <div class="sub-title"><i class="fas fa-folder"></i> 2.0 — Fiche de Rubrique</div>
    <p style="font-size:12px;color:var(--text-muted);margin-bottom:12px">
      Pour chaque point de contrôle, cochez le niveau de risque identifié.
    </p>
    <table class="ctrl-table">
      <thead><tr>
        <th style="width:58%">Point de contrôle</th>
        <th class="eval-cell">Élevé</th>
        <th class="eval-cell">Moyen</th>
        <th class="eval-cell">Faible</th>
      </tr></thead>
      <tbody>
        ${ctrlPoints.map((pt, i) => `
        <tr>
          <td>${i + 1}. ${pt}</td>
          <td class="eval-cell"><input type="radio" name="gov_ctrl${i}" value="eleve"/></td>
          <td class="eval-cell"><input type="radio" name="gov_ctrl${i}" value="moyen"/></td>
          <td class="eval-cell"><input type="radio" name="gov_ctrl${i}" value="faible"/></td>
        </tr>`).join('')}
      </tbody>
    </table>

    <div class="sub-title" style="margin-top:22px"><i class="fas fa-chart-line"></i> Évolution depuis la dernière inspection</div>
    <div class="radio-row">
      <label class="radio-pill"><input type="radio" name="gov_evol" value="amelioree"/> <i class="fas fa-arrow-up" style="color:#22C55E"></i> Améliorée</label>
      <label class="radio-pill"><input type="radio" name="gov_evol" value="stable"/> <i class="fas fa-minus" style="color:#F59E0B"></i> Stable</label>
      <label class="radio-pill"><input type="radio" name="gov_evol" value="deterioree"/> <i class="fas fa-arrow-down" style="color:#EF4444"></i> Détériorée</label>
    </div>

    <div class="sub-title" style="margin-top:22px"><i class="fas fa-comment-alt"></i> Commentaires pour le rapport (2.0)</div>
    <div class="form-group-full">
      <textarea rows="3" id="comm-general-gov" placeholder="Synthèse à intégrer dans le rapport final…"></textarea>
    </div>

    <!-- Sections 2.1 à 2.7 -->
    ${SECTIONS.map(s => buildSection(s)).join('')}

    <!-- 3.1.3 — Personnel de l'institution -->
    ${buildPersonnelInstitution()}

    <!-- Membres des organes -->
    <div class="sub-title" style="margin-top:28px"><i class="fas fa-users"></i> Composition des organes <span style="font-size:11px;color:#94A3B8;font-weight:400">(Tables 11-13 du rapport)</span></div>
    ${buildMembresOrganes()}

    <!-- Réunions (5.3 — Fonctionnement des organes) -->
    <div class="sub-title" style="margin-top:24px"><i class="fas fa-calendar-check"></i> Réunions des organes <span style="font-size:11px;color:#94A3B8;font-weight:400">(Table 14 du rapport — 5.3)</span></div>
    ${buildReunionsOrganes()}
  `;
}

/* ════════════════════════════════════════════
   BUILDER — Contrôle interne (Index 3)
════════════════════════════════════════════ */
function buildControleInterne(bloc, g) {

  const SECTIONS = [
    {
      id: 'ci31', index: '3.1', titre: 'Dispositif de contrôle interne',
      objectif: "S'assurer de la mise en place par le SFD d'un dispositif de contrôle interne conforme aux dispositions législatives et réglementaires en vigueur.",
      acts: [
        "S'assurer de : l'existence d'un document faisant partie des manuels de procédures et instituant un système de contrôle interne dans le SFD ; l'indication dans le document de l'organisation du système de contrôle interne, de ses objectifs ainsi que des moyens dont il dispose ; l'adaptation du système de contrôle interne à l'organisation du SFD, à la nature et au volume de ses activités ainsi qu'aux risques auxquels il est exposé",
        "Vérifier si la position de l'organe chargé du contrôle interne dans l'organigramme lui assure une indépendance par rapport aux services opérationnels",
        "Apprécier l'adéquation de l'équipe de l'organe chargé du contrôle interne (nombre de personnes, formation et qualification) par rapport au volume, à la nature des activités ainsi qu'aux risques encourus",
        "S'assurer que la nature des travaux effectués par l'organe chargé du contrôle interne comporte : l'évaluation de la maîtrise et du traitement des opérations selon les dispositions réglementaires ; l'identification et l'évaluation des risques ; la formulation de recommandations aux services opérationnels",
        "S'assurer que le Conseil d'Administration (ou l'organe équivalent) : a pris des mesures pour mettre en place et à jour des politiques et procédures écrites de contrôle ; a fixé des limites pour chacun des principaux risques auxquels est exposé le SFD ; a mis en place un dispositif de séparation des tâches incompatibles notamment la manipulation des valeurs, l'enregistrement, l'autorisation des opérations et leur vérification",
        "Vérifier que le Directeur ou le Gérant : a décliné des limites opérationnelles par rapport aux risques principaux et veille au respect desdites limites ; a mis en place un dispositif de contrôle interne couvrant l'ensemble des risques encourus par le SFD ; s'assure de la cohérence et de l'efficacité du système de contrôle interne ; sensibilise, forme et enrichit les tâches du personnel sur l'importance et l'intérêt des contrôles",
        "S'assurer que l'organe chargé du contrôle interne est rattaché au Conseil d'Administration ou à l'organe compétent pour les autres structures",
        "S'assurer qu'un Comité d'Audit est mis en place (Société)",
        "Dans le cas d'une société, vérifier que le Comité d'Audit assume notamment les attributions suivantes : l'examen de l'organisation du système de contrôle interne ; le suivi de son évolution et l'appréciation du dispositif de gestion des risques de crédit et des risques opérationnels ; la participation à la sélection des commissaires aux comptes ; l'analyse de la conformité des principes comptables appliqués avec les normes en vigueur ; l'examen approfondi des comptes annuels avant leur présentation au Conseil d'Administration ou à l'organe équivalent",
        "Dans le cas d'une IMEC ou d'une association, s'assurer que : l'organe chargé du contrôle interne est rattaché au Conseil de Surveillance ; les membres du Conseil de Surveillance reçoivent une formation pour leur permettre d'avoir une maîtrise suffisante des diligences à accomplir ; le Conseil de Surveillance est doté de procédures écrites et à jour pour lui permettre d'évaluer le fonctionnement du SFD relatif au contrôle interne, aux politiques et pratiques financières, à la comptabilité, à la caisse, à la gestion administrative ainsi qu'aux politiques et pratiques coopératives",
        "Dans le cas d'une faîtière, vérifier que : le Conseil de Surveillance s'assure que les services de la structure faîtière sont contrôlés au même titre que les entités affiliées ; les états financiers combinés du réseau font l'objet de vérification par l'organe chargé du contrôle interne ; chaque réseau communique au plus tard le 15 janvier de chaque année son programme annuel d'inspection à la BCEAO ou à la Commission Bancaire ; l'organe chargé du contrôle interne des réseaux identifie des indicateurs de prévention et de détection des risques et les utilise pour alimenter leur tableau de bord",
      ]
    },
    {
      id: 'ci32', index: '3.2', titre: 'Gestion des risques',
      objectif: "S'assurer de la mise en place d'un dispositif de gestion des risques de contrepartie, de liquidité, opérationnels, juridiques, voire de marché.",
      acts: [
        "Vérifier l'existence : des outils de gestion des risques ; des outils de contrôle des risques ; de processus de sélection, de décision et de gestion des risques de contrepartie",
        "Évaluer la qualité des engagements et le niveau adéquat des provisions",
        "S'assurer que les différents acteurs sont impliqués dans la définition de la stratégie du SFD",
        "Vérifier que la stratégie retenue et le système mis en place sont adaptés à la nature et au volume des opérations du SFD",
      ]
    },
    {
      id: 'ci33', index: '3.3', titre: "Qualité du plan d'affaires",
      objectif: "S'assurer que le SFD s'est doté d'un plan stratégique et d'un plan d'affaires de qualité et qu'ils font l'objet d'un pilotage adéquat. S'assurer que la gestion budgétaire est en adéquation avec le plan d'affaires en vigueur.",
      acts: [
        "S'assurer de l'existence d'un plan d'affaires sur 3 à 5 ans démontrant le respect des normes de conformité prudentielles, déjà validé par plusieurs années de planification stratégique déjà exécutées conformément au plan d'affaires",
        "S'assurer de son actualisation annuelle",
        "S'assurer de l'existence d'un système formel de pilotage stratégique du plan d'affaires par la direction générale impliquant l'ensemble de l'institution",
        "Vérifier la qualité du plan d'affaires",
        "Vérifier que la gestion budgétaire est cohérente avec le plan d'affaires et dotée d'outils de prévision, de budget annuel détaillé, de respect de l'exécution et d'ajustement procédural en cas de besoin",
      ]
    },
    {
      id: 'ci34', index: '3.4', titre: 'Fonction support',
      objectif: "S'assurer que le principe de séparation au sein des fonctions support, notamment entre les achats, les stocks, la décision de consommation ou d'affectation, et le contrôle de gestion est bien respecté.",
      acts: [
        "S'assurer que le SFD a mis en place des procédures claires et respectueuses des principes de contrôle interne en termes de séparation entre : évaluation des besoins ; achats (avec existence d'outils de mise en concurrence ou de pro forma) ; comptabilisation des achats sur pièces justificatives et conservation sécurisée des preuves ; gestion des stocks et des immobilisations incluant système d'enregistrement et inventaire ; consommation / utilisation",
        "La procédure permet la traçabilité de la chaîne des biens et services achetés (consommables et immobilisations)",
        "Le système de paye opère une séparation entre la gestion des contrats de travail ou de prestation de services, la paye et la comptabilisation des opérations",
        "Il existe un contrôle de gestion surveillant la cohérence économique du prix des achats et des biens et services et du volume des consommations",
        "L'audit interne effectue l'audit des fonctions support et de la qualité du contrôle de gestion, y compris une évaluation périodique du coût des achats et de l'évaluation des immobilisations",
        "Il y a absence d'anomalies significatives constatées",
      ]
    },
  ];

  function actRows(acts) {
    return acts.map((a, i) => `
      <tr>
        <td class="act-num">${i + 1}</td>
        <td>${a}</td>
        <td><input type="text" placeholder="Initiales" style="width:68px;text-align:center"/></td>
        <td>
          <div class="lacune-wrap">
            <button class="lacune-btn" onclick="setLacune(this,'oui')">O</button>
            <button class="lacune-btn" onclick="setLacune(this,'non')">N</button>
          </div>
        </td>
        <td><textarea class="act-comment" rows="1" placeholder="Commentaire…"></textarea></td>
      </tr>`).join('');
  }

  function buildSection(s) {
    return `
      <div class="sub-title" style="margin-top:32px"><i class="fas fa-file-signature"></i> ${s.index} — ${s.titre}</div>
      <div class="info-box" style="background:#F0FDF4;border-color:#86EFAC;color:#166534">
        <i class="fas fa-bullseye" style="color:#16A34A"></i>
        <span><strong>Objectif :</strong> ${s.objectif}</span>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
        <div class="form-group-full"><label>Réviseur</label><input type="text" placeholder="Nom du réviseur"/></div>
        <div class="form-group-full"><label>Date</label><input type="date"/></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
        <div class="form-group-full"><label>Référence 1</label><input type="text" placeholder="Ex : Instruction BCEAO n°…"/></div>
        <div class="form-group-full"><label>Référence 2</label><input type="text" placeholder=""/></div>
      </div>
      <table class="act-table">
        <thead><tr>
          <th style="width:38px">N°</th><th>Activités</th>
          <th style="width:82px;text-align:center">Paraphe</th>
          <th style="width:90px;text-align:center">Lacune</th>
          <th>Commentaire</th>
        </tr></thead>
        <tbody>${actRows(s.acts)}</tbody>
      </table>
      <div class="sub-title" style="margin-top:14px"><i class="fas fa-clock"></i> Suivis (${s.index})</div>
      <table class="dyn-table" id="suivi-${s.id}">
        <thead><tr><th>Point</th><th>Suivi</th><th>Responsable</th><th style="width:120px">Échéance</th></tr></thead>
        <tbody><tr>
          <td><input type="text" placeholder="Point…"/></td>
          <td><input type="text" placeholder="Action…"/></td>
          <td><input type="text" placeholder="Responsable…"/></td>
          <td><input type="date"/></td>
        </tr></tbody>
      </table>
      <button class="add-btn" onclick="addRow('suivi-${s.id}','<td><input type=text placeholder=Point…/></td><td><input type=text placeholder=Action…/></td><td><input type=text placeholder=Responsable…/></td><td><input type=date/></td>')">
        <i class="fas fa-plus"></i> Ajouter une ligne
      </button>
      <div class="sub-title" style="margin-top:14px"><i class="fas fa-exclamation-triangle"></i> Constats et Recommandations (${s.index})</div>
      <table class="dyn-table" id="const-${s.id}">
        <thead><tr><th style="width:70px">Point</th><th>Constats</th><th>Recommandations</th></tr></thead>
        <tbody><tr>
          <td><input type="text" placeholder="Réf…"/></td>
          <td><textarea rows="2" placeholder="Décrivez le constat…"></textarea></td>
          <td><textarea rows="2" placeholder="Recommandation…"></textarea></td>
        </tr></tbody>
      </table>
      <button class="add-btn" onclick="addRow('const-${s.id}','<td><input type=text placeholder=Réf…/></td><td><textarea rows=2 placeholder=Décrivez le constat…></textarea></td><td><textarea rows=2 placeholder=Recommandation…></textarea></td>')">
        <i class="fas fa-plus"></i> Ajouter une ligne
      </button>
      <div class="sub-title" style="margin-top:14px"><i class="fas fa-comment-alt"></i> Commentaires</div>
      <div class="form-group-full"><textarea rows="3" placeholder="Commentaires…"></textarea></div>
      ${buildAnnexes(s.id)}
    `;
  }

  return `
    <div class="info-box">
      <i class="fas fa-info-circle"></i>
      SFD : <strong>${g.sfd || '—'}</strong> &nbsp;|&nbsp;
      Inspecteur : <strong>${g.inspecteur || '—'}</strong> &nbsp;|&nbsp;
      Chef de mission : <strong>${g.chef || '—'}</strong>
    </div>

    <div class="sub-title"><i class="fas fa-folder"></i> 3.0 — Fiche de Rubrique</div>
    <p style="font-size:12px;color:var(--text-muted);margin-bottom:12px">
      Pour chaque point de contrôle, cochez le niveau de risque identifié.
    </p>
    <table class="ctrl-table">
      <thead><tr>
        <th style="width:58%">Point de contrôle</th>
        <th class="eval-cell">Élevé</th>
        <th class="eval-cell">Moyen</th>
        <th class="eval-cell">Faible</th>
      </tr></thead>
      <tbody>
        ${['Dispositif de contrôle interne','Gestion des risques',"Qualité du plan d'affaires",'Fonction support'].map((pt, i) => `
        <tr>
          <td>${i + 1}. ${pt}</td>
          <td class="eval-cell"><input type="radio" name="ci_ctrl${i}" value="eleve"/></td>
          <td class="eval-cell"><input type="radio" name="ci_ctrl${i}" value="moyen"/></td>
          <td class="eval-cell"><input type="radio" name="ci_ctrl${i}" value="faible"/></td>
        </tr>`).join('')}
      </tbody>
    </table>

    <div class="sub-title" style="margin-top:22px"><i class="fas fa-chart-line"></i> Évolution depuis la dernière inspection</div>
    <div class="radio-row">
      <label class="radio-pill"><input type="radio" name="ci_evol" value="amelioree"/> <i class="fas fa-arrow-up" style="color:#22C55E"></i> Améliorée</label>
      <label class="radio-pill"><input type="radio" name="ci_evol" value="stable"/> <i class="fas fa-minus" style="color:#F59E0B"></i> Stable</label>
      <label class="radio-pill"><input type="radio" name="ci_evol" value="deterioree"/> <i class="fas fa-arrow-down" style="color:#EF4444"></i> Détériorée</label>
    </div>

    <div class="sub-title" style="margin-top:22px"><i class="fas fa-comment-alt"></i> Commentaires pour le rapport (3.0)</div>
    <div class="form-group-full">
      <textarea rows="3" id="comm-general-ci" placeholder="Synthèse à intégrer dans le rapport final…"></textarea>
    </div>

    ${SECTIONS.map(s => buildSection(s)).join('')}
  `;
}

/* ════════════════════════════════════════════
   BUILDER — Autres volets (Index 9)
════════════════════════════════════════════ */
function buildAutresVolets(bloc, g) {

  const SECTIONS = [
    {
      id: 'av91', index: '9.1', titre: 'Fonctionnement du fonds de sécurité ou de solidarité',
      objectif: "S'assurer de la mise en place de dispositifs de gestion des risques.",
      acts: [
        "S'assurer de l'existence d'un compte ordinaire spécifique ouvert dans les livres de la faîtière destiné à accueillir les fonds",
        "S'assurer pour tous les réseaux agréés depuis plus de 6 mois, de l'existence d'un règlement intérieur fixant le fonctionnement du fonds, approuvé par l'organe délibérant et soumis (dans les 30 jours de son approbation en interne) aux autorités de contrôle, avant son application",
        "S'assurer pour tous les réseaux déjà agréés au 1er janvier 2011 de l'existence d'un fonds au 01er juillet 2012 et du respect des conditions d'approbation ci-dessus",
        "Obtenir la dernière version du règlement intérieur et contrôler la validation de toute modification par les autorités susmentionnées",
        "S'assurer de l'effectivité annuelle et de la conformité du rapport général de contrôle de la gestion des fonds du comité ad hoc",
        "S'assurer de la soumission du rapport susmentionné à l'Assemblée générale de la faîtière",
        "S'assurer de l'existence d'un rapport spécifique du Commissaire aux comptes sur le fonds et de sa transmission aux Autorités",
      ]
    },
    {
      id: 'av92', index: '9.2', titre: 'Comptabilisation du fonds de sécurité ou de solidarité',
      objectif: "S'assurer de la mise en place de dispositifs de gestion des risques.",
      acts: [
        "Contrôler l'exactitude de la cotisation initiale : 2% du total actif moyen brut et des engagements par signature",
        "Contrôler l'exactitude de la cotisation les années suivantes : 2% de la variation de l'actif moyen et des engagements",
        "S'assurer que tous les mouvements en faveur du fonds effectués par des non Membres ont été approuvés préalablement",
        "S'assurer que les relèvements de fonds au-delà de 15% de l'actif total du réseau (plafond obligatoire) sont respectés",
        "S'assurer que les mouvements en diminution du fonds ne concernent que les requêtes d'utilisation accompagnées de plan de redressement et soumises à l'autorisation du Conseil d'Administration de la faîtière",
        "S'assurer de l'approbation formalisée par comité de gestion du fonds du plan de redressement et du plan de trésorerie de l'institution membre demandeuse",
        "S'assurer de l'établissement d'une convention ou contrat de prêt subordonné pour tout bénéficiaire du fonds",
        "S'assurer qu'aucune institution n'a bénéficié successivement trois (03) fois du fonds",
      ]
    },
    {
      id: 'av93', index: '9.3', titre: 'Immobilisations',
      objectif: "S'assurer de la mise en place de dispositifs de gestion des risques.",
      acts: [
        "S'assurer que le SFD respecte les normes en vigueur",
        "S'assurer que le classement comptable est conforme à la nature de l'immobilisation",
        "Contrôler le calcul des amortissements, le respect du principe de permanence des méthodes",
        "Contrôler l'existence du fichier des immobilisations (état extra-comptable)",
        "Contrôler qu'un rapprochement périodique est fait entre les données extracomptables du fichier et la comptabilité",
        "Contrôler les justificatifs des frais immobilisés",
        "Contrôler l'inventaire des immobilisations en fin d'exercice",
        "Vérifier la propriété des immobilisations",
        "Vérifier la réalité physique des existants (inventaire physique des immobilisations)",
        "Vérifier les cessions d'immobilisations ayant eu lieu au cours de l'exercice au regard des pièces justificatives et de la comptabilité de la cession",
        "Rechercher les justificatifs éventuels de transport, d'installation ou de montage des immobilisations acquises au cours de l'exercice, afin de s'assurer du respect des règles d'évaluation",
        "Contrôler la comptabilisation des droits de mutation, honoraires ou commissions et frais d'actes",
        "S'assurer du traitement des immobilisations mises hors d'usage ou détruites",
        "Vérifier que les immobilisations sont correctement assurées",
        "S'assurer que le fichier des immobilisations est bien tenu",
        "Vérifier le respect des dispositions du RCSSFD et le respect des normes de prises de participation",
      ]
    },
    {
      id: 'av94', index: '9.4', titre: 'Comptabilisation des immobilisations',
      objectif: "S'assurer du respect des dispositions du RCSSFD relatives aux immobilisations.",
      acts: [
        "Vérifier l'existence des immobilisations en inventoriant un échantillon et en confrontant fichier des immobilisations et extraits de comptes",
        "S'assurer de l'effectivité de l'inventaire annuel des biens du SFD",
        "Vérifier l'exactitude de l'évaluation des immobilisations notamment avec les provisions constituées sur les immobilisations incorporelles et les titres",
        "S'assurer de l'exhaustivité de la documentation justifiant les immobilisations en cours et de leur correcte évaluation",
        "S'assurer que les immobilisations incorporelles ne nécessitent pas la constitution de provisions",
        "S'assurer que les immobilisations acquises suite à des garanties ont fait l'objet de la procédure de réalisation avant comptabilisation",
        "Contrôler par sondage les acquisitions, cessions ou autres sorties de l'exercice",
        "Contrôler par sondage le calcul des amortissements",
        "S'assurer que les immobilisations comptabilisées existent et appartiennent à l'institution et sont utilisées dans le cadre de l'activité financière et non financière",
        "S'assurer que les éléments qui doivent être immobilisés le sont ; les cessions et autres mouvements de sortie sont tous comptabilisés ainsi que les plus ou moins-values qu'ils ont générées",
        "S'assurer de la réalité des plus-values par la justification documentaire des cessions",
        "S'assurer de la justification et de la conformité des immobilisations acquises suite à la réalisation des garanties",
        "S'assurer que les montants immobilisés sont justes et ne comprennent pas d'éléments devant être comptabilisés en charges",
        "S'assurer que tous les dividendes, intérêts et autres produits portant sur des immobilisations financières sont comptabilisés",
        "S'assurer que la valorisation des opérations et la présentation des comptes sont correctes et en adéquation avec les normes comptables en vigueur",
        "S'assurer du paiement à date et à bonne valeur des versements restant à effectuer",
      ]
    },
    {
      id: 'av95', index: '9.5', titre: 'Stocks',
      objectif: "S'assurer de la mise en place d'un dispositif de gestion des risques.",
      acts: [
        "Vérifier que les besoins ont été exprimés par les personnes habilitées conformément aux prescriptions budgétaires",
        "Vérifier que les règles d'appel à la concurrence sont observées",
        "Vérifier la justification des arguments utilisés pour le choix d'un fournisseur",
        "Rapprocher les factures fournisseurs du dossier d'appel d'offres et s'assurer que les sommes concordent",
        "S'assurer de la réalité des réceptions en rapprochant le bon de commande, la lettre de marché au PV de réception ou bon de livraison",
        "S'assurer de l'existence des procédures et des dispositions de gestion des stocks",
        "S'assurer que les stocks font l'objet d'inventaire périodique",
      ]
    },
    {
      id: 'av96', index: '9.6', titre: 'Comptabilisation des stocks',
      objectif: "S'assurer du respect des dispositions du RCSSFD en matière de stock.",
      acts: [
        "Vérifier la classification, l'évaluation et l'existence des stocks",
        "S'assurer que les stocks sont correctement appréhendés et comptabilisés",
        "S'assurer que les stocks existent et appartiennent à l'institution",
        "Contrôler la bonne tenue des fiches de stocks",
        "Vérifier le respect des règles d'évaluation des stocks prévus dans le RCSSFD",
        "S'assurer que la valorisation des stocks est correctement calculée, à l'aide d'une méthode admise par les normes comptables en vigueur (FIFO, PUMP)",
        "S'assurer que les chevauchements de fin de période sont correctement appréhendés",
        "S'assurer que l'évaluation des stocks est justifiée : les provisions pour dépréciation estimées nécessaires sont comptabilisées",
      ]
    },
    {
      id: 'av98', index: '9.8', titre: 'Comptabilisation des charges de personnel',
      objectif: "S'assurer de la mise en place d'un dispositif pour gérer les risques reliés aux charges du personnel.",
      acts: [
        "S'assurer en lien avec les comptes de personnel de la classe 3 Débiteurs et créditeurs divers (3312 à 3315 et 3322) de la correcte comptabilisation des opérations",
        "S'assurer de la conformité des différentes déclarations de salaires et du respect des obligations en matière de cotisation retraite et pour la sécurité sociale",
        "S'assurer de la justification des opérations au support de pièces justificatives",
      ]
    },
    {
      id: 'av99', index: '9.9', titre: 'Lutte contre le blanchiment des capitaux et le financement du terrorisme',
      objectif: "S'assurer de la mise en place d'un dispositif de lutte contre les risques.",
      acts: [
        "S'assurer de l'existence de procédures décrivant l'organisation d'un dispositif de lutte contre le blanchiment des capitaux et le financement du terrorisme",
        "S'assurer de la mise en place d'une cellule anti-blanchiment",
        "S'assurer de la mise en œuvre de mesures d'identifications de la clientèle",
        "S'assurer du traitement réservé aux opérations suspectes",
        "S'assurer du traitement de la déclaration de soupçon",
        "S'assurer de l'effectivité des actions de formation et de sensibilisation effectuées par le SFD dans le cadre de la lutte contre le blanchiment des capitaux et le financement du terrorisme",
        "S'assurer de l'élaboration et de la transmission dans le délai réglementaire aux Autorités du rapport sur le blanchiment",
      ]
    },
    {
      id: 'av910', index: '9.10', titre: 'Transparence de la tarification',
      objectif: "S'assurer de la mise en place d'un dispositif de lutte contre les risques.",
      acts: [
        "Vérifier le respect des dates de valeur : virements reçus (crédit au plus tard le 1er jour ouvré suivant la réception) ; remises de chèques (crédit au plus tard le 1er jour ouvré suivant l'encaissement) ; remises d'effets à l'escompte (décompte du jour de la remise) ; virements émis / domiciliation d'effets / paiement de chèques (débit le 1er jour ouvré précédent l'exécution) ; versements et retraits d'espèces (crédit et débit le jour de l'opération) ; livrets d'épargne (crédit 1er jour quinzaine suivant versement, débit 1er jour quinzaine précédent retrait)",
        "Vérifier que les conditions débitrices et créditrices ont fait l'objet d'affichage visible à l'entrée des locaux et aux guichets, y compris un exemple illustrant la méthodologie de calcul du TEG",
        "Vérifier que les informations suivantes ont été communiquées aux emprunteurs : taux effectif global d'intérêt ; taux de la période ; taux d'intérêt nominal et toutes les perceptions afférentes au prêt",
        "S'assurer que l'obligation d'information de la clientèle des conditions débitrices, toutes commissions et charges confondues, et des conditions créditrices a été respectée",
        "Vérifier que la transmission à la clientèle d'un état de l'ensemble des frais et commissions perçus à la fin de chaque exercice a été effectuée",
        "S'assurer que pour les SFD de l'article 44, la transmission semestrielle aux autorités (au plus tard le 5 du mois suivant) a été effectuée : taux débiteur maximum ; taux minima et maxima de rémunération des dépôts à terme ; date de la dernière modification ; conditions applicables à l'épargne contractuelle",
      ]
    },
    {
      id: 'av911', index: '9.11', titre: "Taux d'usure",
      objectif: "S'assurer du respect des dispositions légales et réglementaires relatives au taux d'usure.",
      acts: [
        "S'assurer de l'existence d'un système d'information permettant de calculer le taux effectif global",
        "S'assurer que le taux effectif global reste en dessous du seuil de 24% fixé par le Conseil des Ministres",
        "Vérifier que les impôts et taxes payés n'entrent pas dans la base de calcul du taux effectif global",
        "S'assurer que les frais d'assurance ont été pris en compte dans la base de calcul",
      ]
    },
  ];

  function actRows(acts) {
    return acts.map((a, i) => `
      <tr>
        <td class="act-num">${i + 1}</td>
        <td>${a}</td>
        <td><input type="text" placeholder="Initiales" style="width:68px;text-align:center"/></td>
        <td>
          <div class="lacune-wrap">
            <button class="lacune-btn" onclick="setLacune(this,'oui')">O</button>
            <button class="lacune-btn" onclick="setLacune(this,'non')">N</button>
          </div>
        </td>
        <td><textarea class="act-comment" rows="1" placeholder="Commentaire…"></textarea></td>
      </tr>`).join('');
  }

  function buildSection(s) {
    return `
      <div class="sub-title" style="margin-top:32px"><i class="fas fa-file-signature"></i> ${s.index} — ${s.titre}</div>
      <div class="info-box" style="background:#F0FDF4;border-color:#86EFAC;color:#166534">
        <i class="fas fa-bullseye" style="color:#16A34A"></i>
        <span><strong>Objectif :</strong> ${s.objectif}</span>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
        <div class="form-group-full"><label>Réviseur</label><input type="text" placeholder="Nom du réviseur"/></div>
        <div class="form-group-full"><label>Date</label><input type="date"/></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
        <div class="form-group-full"><label>Référence 1</label><input type="text" placeholder="Ex : Instruction BCEAO n°…"/></div>
        <div class="form-group-full"><label>Référence 2</label><input type="text" placeholder=""/></div>
      </div>
      <table class="act-table">
        <thead><tr>
          <th style="width:38px">N°</th>
          <th>Activités</th>
          <th style="width:82px;text-align:center">Paraphe</th>
          <th style="width:90px;text-align:center">Lacune</th>
          <th>Commentaire</th>
        </tr></thead>
        <tbody>${actRows(s.acts)}</tbody>
      </table>
      <div class="sub-title" style="margin-top:14px"><i class="fas fa-clock"></i> Suivis (${s.index})</div>
      <table class="dyn-table" id="suivi-${s.id}">
        <thead><tr><th>Point</th><th>Suivi</th><th>Responsable</th><th style="width:120px">Échéance</th></tr></thead>
        <tbody><tr>
          <td><input type="text" placeholder="Point…"/></td>
          <td><input type="text" placeholder="Action…"/></td>
          <td><input type="text" placeholder="Responsable…"/></td>
          <td><input type="date"/></td>
        </tr></tbody>
      </table>
      <button class="add-btn" onclick="addRow('suivi-${s.id}','<td><input type=text placeholder=Point…/></td><td><input type=text placeholder=Action…/></td><td><input type=text placeholder=Responsable…/></td><td><input type=date/></td>')">
        <i class="fas fa-plus"></i> Ajouter une ligne
      </button>
      <div class="sub-title" style="margin-top:14px"><i class="fas fa-exclamation-triangle"></i> Constats et Recommandations (${s.index})</div>
      <table class="dyn-table" id="const-${s.id}">
        <thead><tr><th style="width:70px">Point</th><th>Constats</th><th>Recommandations</th></tr></thead>
        <tbody><tr>
          <td><input type="text" placeholder="Réf…"/></td>
          <td><textarea rows="2" placeholder="Décrivez le constat…"></textarea></td>
          <td><textarea rows="2" placeholder="Recommandation…"></textarea></td>
        </tr></tbody>
      </table>
      <button class="add-btn" onclick="addRow('const-${s.id}','<td><input type=text placeholder=Réf…/></td><td><textarea rows=2 placeholder=Décrivez le constat…></textarea></td><td><textarea rows=2 placeholder=Recommandation…></textarea></td>')">
        <i class="fas fa-plus"></i> Ajouter une ligne
      </button>
      <div class="sub-title" style="margin-top:14px"><i class="fas fa-comment-alt"></i> Commentaires</div>
      <div class="form-group-full"><textarea rows="3" placeholder="Commentaires…"></textarea></div>
      ${buildAnnexes(s.id)}
    `;
  }

  const ctrlPoints = [
    "Fonctionnement du fonds de sécurité ou de solidarité",
    "Comptabilisation du fonds de sécurité ou de solidarité",
    "Immobilisations",
    "Comptabilisation des immobilisations",
    "Stocks",
    "Comptabilisation des stocks",
    "Personnel et paye",
    "Comptabilisation des charges de personnel",
    "Lutte contre le blanchiment des capitaux et le financement du terrorisme",
    "Transparence de la tarification",
    "Taux d'usure",
  ];

  return `
    <div class="info-box">
      <i class="fas fa-info-circle"></i>
      SFD : <strong>${g.sfd || '—'}</strong> &nbsp;|&nbsp;
      Inspecteur : <strong>${g.inspecteur || '—'}</strong> &nbsp;|&nbsp;
      Chef de mission : <strong>${g.chef || '—'}</strong>
    </div>

    <div class="sub-title"><i class="fas fa-folder"></i> 9.0 — Fiche de Rubrique</div>
    <p style="font-size:12px;color:var(--text-muted);margin-bottom:12px">
      Pour chaque point de contrôle, cochez le niveau de risque identifié.
    </p>
    <table class="ctrl-table">
      <thead><tr>
        <th style="width:58%">Point de contrôle</th>
        <th class="eval-cell">Élevé</th>
        <th class="eval-cell">Moyen</th>
        <th class="eval-cell">Faible</th>
      </tr></thead>
      <tbody>
        ${ctrlPoints.map((pt, i) => `
        <tr>
          <td>${i + 1}. ${pt}</td>
          <td class="eval-cell"><input type="radio" name="av_ctrl${i}" value="eleve"/></td>
          <td class="eval-cell"><input type="radio" name="av_ctrl${i}" value="moyen"/></td>
          <td class="eval-cell"><input type="radio" name="av_ctrl${i}" value="faible"/></td>
        </tr>`).join('')}
      </tbody>
    </table>

    <div class="sub-title" style="margin-top:22px"><i class="fas fa-chart-line"></i> Évolution depuis la dernière inspection</div>
    <div class="radio-row">
      <label class="radio-pill"><input type="radio" name="av_evol" value="amelioree"/> <i class="fas fa-arrow-up" style="color:#22C55E"></i> Améliorée</label>
      <label class="radio-pill"><input type="radio" name="av_evol" value="stable"/> <i class="fas fa-minus" style="color:#F59E0B"></i> Stable</label>
      <label class="radio-pill"><input type="radio" name="av_evol" value="deterioree"/> <i class="fas fa-arrow-down" style="color:#EF4444"></i> Détériorée</label>
    </div>

    <div class="sub-title" style="margin-top:22px"><i class="fas fa-comment-alt"></i> Commentaires pour le rapport (9.0)</div>
    <div class="form-group-full">
      <textarea rows="3" id="comm-general-av" placeholder="Synthèse à intégrer dans le rapport final…"></textarea>
    </div>

    ${SECTIONS.map(s => buildSection(s)).join('')}
  `;
}

/* ════════════════════════════════════════════
   BUILDER — Volet générique (en attente)
════════════════════════════════════════════ */
function buildGeneric(bloc, g) {
  return `
    <div class="info-box">
      <i class="fas fa-info-circle"></i>
      SFD : <strong>${g.sfd || '—'}</strong> &nbsp;|&nbsp;
      Inspecteur : <strong>${g.inspecteur || '—'}</strong> &nbsp;|&nbsp;
      Chef de mission : <strong>${g.chef || '—'}</strong>
    </div>
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;
                padding:60px 20px;color:var(--text-muted);text-align:center;gap:14px">
      <i class="fas fa-folder-open" style="font-size:40px;opacity:.3"></i>
      <p style="font-size:14px;font-weight:700">Formulaire en cours de construction</p>
      <p style="font-size:12px">Les documents de ce volet n'ont pas encore été transmis.</p>
    </div>
  `;
}

/* ════════════════════════════════════════════
   ACCÈS PAR LIEN SÉCURISÉ (token dans l'URL)
════════════════════════════════════════════ */
async function gererAccesParLien() {
  const params = new URLSearchParams(window.location.search);
  const accessToken = params.get('token');
  if (!accessToken) return;

  try {
    const res = await fetch(`${API_URL}/missions/verifier-acces`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ token: accessToken })
    });
    const data = await res.json();

    if (res.ok) {
      localStorage.setItem('utilisateur', JSON.stringify(data.utilisateur));
      localStorage.setItem('token', data.token);

      params.delete('token');
      const nouvelleUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState({}, '', nouvelleUrl);
    } else {
      alert('❌ ' + (data.detail || 'Lien invalide ou expiré.'));
      localStorage.removeItem('utilisateur');
      localStorage.removeItem('token');
      window.location.href = 'index.html';
    }
  } catch {
    alert('❌ Serveur inaccessible.');
  }
}

/* ════════════════════════════════════════════
   INIT
════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', async () => {
  await gererAccesParLien();   // FIX : doit s'exécuter avant tout le reste
  await requireAuth();         // FIX : bloque l'accès si personne n'est identifié
  await chargerListeInspecteurs();

  const id = new URLSearchParams(window.location.search).get('id');

  if (id) {
    try {
      const res = await fetch(`${API_URL}/missions/${id}`);
      const mission = await res.json();
      if (res.ok) {
        document.getElementById('g-sfd').value      = mission.sfd || '';
        document.getElementById('g-date').value     = mission.date_mission || '';
        document.getElementById('g-ref').value      = mission.reference || '';
        document.getElementById('g-chef').value     = mission.chef_mission || '';
        document.getElementById('g-reviseur').value = mission.reviseur || '';

        // ── FIX : réinjecte les données Infos SFD / Indicateurs & Suivi ──
        if (typeof restaurerDonneesRapport === 'function') {
          restaurerDonneesRapport(mission);
        }

        if (mission.sfd) {
          document.getElementById('sfd-selected').innerHTML = `
            <div class="sfd-selected-tag">
              <i class="fas fa-building"></i>
              <span>${mission.sfd}</span>
              <button onclick="clearSFD()"><i class="fas fa-times"></i></button>
            </div>`;
        }

        if (mission.inspecteurs) {
          const list = document.getElementById('inspecteurs-list');
          list.innerHTML = '';
          const insp = Array.isArray(mission.inspecteurs)
            ? mission.inspecteurs
            : mission.inspecteurs.split(',').map(s => s.trim()).filter(Boolean);
          insp.forEach((nom, i) => {
            const div = document.createElement('div');
            div.className = 'inspecteur-row';
            div.innerHTML = `
              <div class="insp-num">${i + 1}</div>
              <input type="text" value="${nom}" oninput="syncGlobal()"/>
              ${i > 0 ? `<button class="del-insp" onclick="removeInspecteur(this)"><i class="fas fa-times"></i></button>` : ''}
            `;
            list.appendChild(div);
          });
          inspCount = insp.length;
        }

        if (mission.type_controle) {
          document.getElementById('g-type').value = mission.type_controle;
          onTypeChange(mission.type_controle);
        } else {
          renderGrid();
        }

        await chargerVoletsExistants(id);
      }
    } catch (err) {
      console.error('Erreur chargement mission:', err);
      renderGrid();
    }
  } else {
    // Nouvelle mission : cache vide
    window._voletsCache = {};
    addInspecteur();
    renderGrid();
  }

  // ── FIX : appliquer les restrictions APRÈS que tout le contenu
  // dynamique (lignes d'inspecteurs recréées, volets, etc.) soit en
  // place — sinon les éléments recréés après l'appel restent actifs.
  if (typeof appliquerRestrictionsRole === 'function') appliquerRestrictionsRole();
});

async function chargerVoletsExistants(missionId) {
  try {
    const res = await fetch(`${API_URL}/volets/?mission_id=${missionId}`);
    const data = await res.json();
    window._voletsCache = {};
    (data.volets || []).forEach(v => {
      // ── FIX : on garde les données du volet en cache pour pouvoir
      // restaurer le formulaire quand on le rouvre ──
      window._voletsCache[v.volet_code] = v.data || null;
      if (v.est_valide) completed.add(v.volet_code);
    });
    const typeVal = document.getElementById('g-type').value;
    if (typeVal && TYPE_CONFIG[typeVal] && TYPE_CONFIG[typeVal].blocs !== null) {
      renderCustomGrid(TYPE_CONFIG[typeVal].blocs);
    } else {
      renderGrid();
    }
  } catch (err) {
    console.error('Erreur chargement volets:', err);
  }
}

async function enregistrerMission() {
  const sfd         = document.getElementById("g-sfd")?.value.trim();
  const date_mission= document.getElementById("g-date")?.value;
  const chef_mission= document.getElementById("g-chef")?.value.trim();
  const inspecteurs = getInspecteurs();

  if (!sfd || !date_mission || !chef_mission || !inspecteurs.length) {
    alert("⚠️ Veuillez remplir tous les champs obligatoires.");
    return;
  }

  const id = new URLSearchParams(window.location.search).get("id");

  // Collecter les données rapport
  let donnees_rapport = {};
  if (typeof collecterDonneesRapport === 'function') {
    donnees_rapport = collecterDonneesRapport();
  }

  // FIX : le backend (schéma Pydantic) ne connaît pas "donnees_rapport_complet".
  // On éclate donc les données en champs existants côté API :
  //   personnel, suivi_recommandations, infos_sfd, organes, reunions, ratios,
  //   et tout le reste regroupé dans indicateurs_financiers.
  const {
    personnel,
    suivi_recommandations_precedentes,
    infos_sfd,
    organes,
    reunions,
    ratios,
    ...reste
  } = donnees_rapport;

  const payload = {
    sfd, date_mission, inspecteurs, chef_mission,
    reference    : document.getElementById("g-ref")?.value.trim()      || null,
    reviseur     : document.getElementById("g-reviseur")?.value.trim() || null,
    type_controle: document.getElementById("g-type")?.value            || null,
    periode      : document.getElementById("g-periode")?.value.trim()  || null,
    statut       : "En attente",
    est_soumise  : false,
    // ── Données pour les tableaux du rapport (champs existants côté backend) ──
    infos_sfd    : infos_sfd || null,
    organes      : organes   || null,
    reunions     : reunions  || null,
    ratios       : ratios    || null,
    personnel    : (personnel && Object.keys(personnel).length) ? personnel : null,
    suivi_recommandations : suivi_recommandations_precedentes || null,
    indicateurs_financiers: (reste && Object.keys(reste).length) ? reste : null,
  };

  try {
    let response;
    if (id) {
      response = await fetch(`${API_URL}/missions/${id}`, {
        method : "PUT",
        headers: { "Content-Type": "application/json" },
        body   : JSON.stringify(payload)
      });
    } else {
      response = await fetch(`${API_URL}/missions/`, {
        method : "POST",
        headers: { "Content-Type": "application/json" },
        body   : JSON.stringify(payload)
      });
    }

    const res = await response.json();
    if (response.ok) {
      const newId = res.mission?.id || id;
      window.history.replaceState({}, "", `?id=${newId}`);
      showToast("Mission enregistrée ✅");
    } else {
      alert("❌ " + res.detail);
    }
  } catch { alert("❌ Serveur inaccessible."); }
}

/* ════════════════════════════════════════════
   LISTE DES SFD (93 SFD de Côte d'Ivoire)
════════════════════════════════════════════ */
const SFD_LIST = [
  {id:"16S",sigle:"ADEC",nom:"ALLIANCE POUR LE DEVELOPPEMENT DE L'EPARGNE ET DU CREDIT"},
  {id:"5S",sigle:"ADVANS",nom:"ADVANS COTE D'IVOIRE"},
  {id:"20S",sigle:"AGIR",nom:"AGIR FINANCE SA"},
  {id:"14S",sigle:"ATLANTIQUE",nom:"ATLANTIC MICROFINANCE FOR AFRICA COTE D'IVOIRE"},
  {id:"10S",sigle:"BAOBAB",nom:"BAOBAB-CI S.A"},
  {id:"21S",sigle:"BRIDGE",nom:"BRIDGE MICROFINANCE SA"},
  {id:"12S",sigle:"COFINA",nom:"Compagnie Financière Africaine Côte d'Ivoire SA"},
  {id:"127M",sigle:"CADES",nom:"Caisse Attobroulaise de Développement Economique et Social"},
  {id:"121M",sigle:"CASUDCO",nom:"Crédit Agricole du Sud Comoé"},
  {id:"82M",sigle:"CECKA",nom:"Caisse d'Epargne et de Crédit Kêlécho d'Agou"},
  {id:"13S",sigle:"CEDAICI",nom:"CAISSE D'EPARGNE POUR LE DEVELOPPEMENT AGRICOLE ET INDUSTRIEL DE COTE D'IVOIRE"},
  {id:"85M",sigle:"CEFA",nom:"Caisse d'Epargne et de Financement Agricole"},
  {id:"15S",sigle:"CELPAID",nom:"CELPAID FINANCES SA"},
  {id:"113M",sigle:"CEPE",nom:"Caisse d'Epargne des Personnels de l'Education de Côte d'Ivoire"},
  {id:"15M02",sigle:"CMEC ABOISSO",nom:"CMEC ABOISSO"},
  {id:"15M19",sigle:"CMEC AFFIENOU",nom:"CMEC AFFIENOU"},
  {id:"15M17",sigle:"CMEC ASSUEFRY",nom:"CMEC ASSUEFRY"},
  {id:"15M11",sigle:"CMEC BACON",nom:"CMEC BACON"},
  {id:"15M10",sigle:"CMEC BINGERVILLE",nom:"CMEC BINGERVILLE"},
  {id:"15M15",sigle:"CMEC BONDOUKOU",nom:"CMEC BONDOUKOU"},
  {id:"15M29",sigle:"CMEC BONIEREDOUGOU",nom:"CMEC BONIEREDOUGOU"},
  {id:"15M16",sigle:"CMEC GOUMERE",nom:"CMEC GOUMERE"},
  {id:"15M21",sigle:"CMEC KATIOLA",nom:"CMEC KATIOLA"},
  {id:"15M04",sigle:"CMEC KOFFIKRO",nom:"CMEC KOFFIKRO"},
  {id:"15M05",sigle:"CMEC KOUMASSI",nom:"CMEC KOUMASSI"},
  {id:"15M09",sigle:"CMEC MARCORY",nom:"CMEC MARCORY"},
  {id:"15M01",sigle:"CMEC N'ZIANOUAN",nom:"CMEC N'ZIANOUAN"},
  {id:"15M07",sigle:"CMEC TABAGNE",nom:"CMEC TABAGNE"},
  {id:"15M20",sigle:"CMEC N'ZIKRO",nom:"CMEC N'ZIKRO"},
  {id:"15M12",sigle:"CMEC TIASSALE",nom:"CMEC TIASSALE"},
  {id:"15M14",sigle:"CMEC TRANSUA",nom:"CMEC TRANSUA"},
  {id:"15M28",sigle:"CMEC YOPOUGON",nom:"CMEC YOPOUGON"},
  {id:"122M",sigle:"COOEP ATTINGUIE",nom:"Coopérative d'Epargne et de Prêts d'Attinguié"},
  {id:"7M063",sigle:"COOPEC ABOISSO",nom:"COOPEC Aboisso"},
  {id:"7M064",sigle:"COOPEC ADZOPE",nom:"COOPEC Adzopé"},
  {id:"7M067",sigle:"COOPEC AGBOVILLE",nom:"COOPEC Agboville"},
  {id:"7M068",sigle:"COOPEC ANYAMA",nom:"COOPEC Anyama"},
  {id:"7M069",sigle:"COOPEC ATTECOUBE",nom:"COOPEC Attécoubé"},
  {id:"7M021",sigle:"COOPEC BOUAKE",nom:"COOPEC Bouaké"},
  {id:"7M156",sigle:"COOPEC COCODY NORD",nom:"COOPERATIVE D'EPARGNE ET DE CREDIT DE COCODY NORD"},
  {id:"7M073",sigle:"COOPEC DABOU",nom:"COOPEC Dabou"},
  {id:"7M024",sigle:"COOPEC DALOA",nom:"COOPEC Daloa"},
  {id:"7M026",sigle:"COOPEC DAOUKRO",nom:"COOPEC Daoukro"},
  {id:"7M027",sigle:"COOPEC DIMBOKRO",nom:"COOPEC Dimbokro"},
  {id:"7M028",sigle:"COOPEC DIOULABOUGOU",nom:"COOPEC Dioulabougou (Man)"},
  {id:"7M029",sigle:"COOPEC DIVO",nom:"COOPEC Divo"},
  {id:"7M031",sigle:"COOPEC DUEKOUE",nom:"COOPEC Duékoué"},
  {id:"7M034",sigle:"COOPEC GAGNOA",nom:"COOPEC Gagnoa"},
  {id:"7M040",sigle:"COOPEC KORHOGO",nom:"COOPEC Korhogo"},
  {id:"7M080",sigle:"COOPEC MARCORY",nom:"COOPEC Marcory"},
  {id:"7M082",sigle:"COOPEC NIABLE",nom:"COOPEC Niablé"},
  {id:"7M049",sigle:"COOPEC SAN-PEDRO",nom:"COOPEC San-Pédro"},
  {id:"7M052",sigle:"COOPEC SINFRA",nom:"COOPEC Sinfra"},
  {id:"7M053",sigle:"COOPEC SOUBRE",nom:"COOPEC Soubré"},
  {id:"7M085",sigle:"COOPEC TRANSUA",nom:"COOPEC Transua"},
  {id:"7M061",sigle:"COOPEC YAMOUSSOUKRO",nom:"COOPEC Yamoussoukro"},
  {id:"7M062",sigle:"COOPEC YOPOUGON",nom:"COOPEC YOPOUGON"},
  {id:"6S",sigle:"CREDIT ACCESS",nom:"CREDIT ACCESS"},
  {id:"100M",sigle:"CREDIT FEF",nom:"Crédit du Fonds des Femmes"},
  {id:"123M",sigle:"CREP MEAGUI",nom:"Caisse Rurale d'Epargne et de Prêt Economique de Méagui"},
  {id:"118M",sigle:"FCEC",nom:"Fonds Communautaire d'Epargne et de Crédit de Yamoussoukro"},
  {id:"128M",sigle:"FCR",nom:"Fonds Coopératif Rural"},
  {id:"7S",sigle:"FIDRA",nom:"FONDS INTERNATIONAL DE LA RETRAITE ACTIVE"},
  {id:"5M",sigle:"GES-CI",nom:"Groupe d'Epargne et de Soutien en Côte d'Ivoire"},
  {id:"19S",sigle:"HES",nom:"HES FINANCES SA"},
  {id:"17S",sigle:"WITTI",nom:"WITTI"},
  {id:"63M",sigle:"IFECC",nom:"Institution Financière d'Epargne et de Crédit des Coopérateurs de Soubré"},
  {id:"114M",sigle:"MA2E",nom:"Mutuelle des Agents de l'eau et de l'Electricité"},
  {id:"116M",sigle:"MCF-PME",nom:"Mutuelle de Crédit et de Financement des PME"},
  {id:"119M",sigle:"MECT",nom:"Mutuelle d'Epargne et de Crédit Tafire"},
  {id:"9S",sigle:"Fin'ELLE",nom:"Fin'ELLE, la Finance pour ELLE SA"},
  {id:"117M01",sigle:"MUCREFAB ABOISSO",nom:"MUCREFAB ABOISSO"},
  {id:"117M03",sigle:"MUCREFAB ADZOPE",nom:"MUCREFAB ADZOPE"},
  {id:"117M04",sigle:"MUCREFAB AGBOVILLE",nom:"MUCREFAB AGBOVILLE"},
  {id:"117M05",sigle:"MUCREFAB BONOUA",nom:"MUCREFAB BONOUA"},
  {id:"117M06",sigle:"MUCREFAB GRAND-BASSAM",nom:"MUCREFAB GRAND-BASSAM"},
  {id:"117M07",sigle:"MUCREFAB GRAND-LAHOU",nom:"MUCREFAB GRAND-LAHOU"},
  {id:"117M02",sigle:"MUCREFAB TIASSALE",nom:"MUCRAFAB TIASSALE"},
  {id:"8M",sigle:"MUCREFBO",nom:"Mutuelle d'Epargne et Crédit des Femmes de la région de Bouaflé"},
  {id:"52M",sigle:"MUCREFCI",nom:"Mutuelle d'Epargne et de Crédit des Fonctionnaires de Côte d'Ivoire"},
  {id:"26M",sigle:"MUKEFI",nom:"Mutuelle Koumala d'Epargne et de Financement"},
  {id:"92M",sigle:"OMIS",nom:"OMIS Finances"},
  {id:"11S",sigle:"PAMF",nom:"PREMIERE AGENCE DE MICROFINANCE COTE D'IVOIRE SA"},
  {id:"120M",sigle:"RAOUDA",nom:"Mutuelle d'Epargne et de Crédit"},
  {id:"15M",sigle:"RCMEC",nom:"Réseau des Caisses Mutuelles d'Epargne et de Crédit de Côte d'Ivoire"},
  {id:"117M",sigle:"REMUCI",nom:"Mutuelle de Crédit et d'Epargne des Femmes d'Aboisso, Bonoua et Grand Bassam"},
  {id:"7M",sigle:"UNACOOPEC",nom:"Union Nationale des Coopératives d'Epargne et de Crédit de Côte d'Ivoire"},
  {id:"126M",sigle:"YVEO",nom:"Mutuelle d'Epargne et de Crédit Yacoli Village Ecole Ouverte"},
  {id:"22S",sigle:"SIRIUS",nom:"SIRIUS FINANCES SA"},
  {id:"23S",sigle:"CREDAFRICA",nom:"CREDAFRICA"},
  {id:"24S",sigle:"FINANCIA",nom:"FINANCIA CI SA"},
  {id:"25S",sigle:"DIFIN",nom:"DIVINE FINANCE INTERNATIONALE SA"},
  {id:"26S",sigle:"MOBICRED",nom:"MOBICRED-CÔTE D'IVOIRE SA"},
];

/* ════════════════════════════════════════════
   DROPDOWN SFD
════════════════════════════════════════════ */
let sfdSelectedId = null;

function filterSFD(val) {
  const dd = document.getElementById('sfd-dropdown');
  const q = val.toLowerCase().trim();
  const filtered = q
    ? SFD_LIST.filter(s => s.sigle.toLowerCase().includes(q) || s.nom.toLowerCase().includes(q))
    : SFD_LIST;
  renderSFDDropdown(filtered);
  dd.classList.add('open');
}

function openSFDDropdown() {
  const val = document.getElementById('sfd-search').value;
  filterSFD(val);
}

function renderSFDDropdown(list) {
  const dd = document.getElementById('sfd-dropdown');
  if (!list.length) {
    dd.innerHTML = '<div class="sfd-item" style="color:var(--text-muted)">Aucun résultat</div>';
    return;
  }
  dd.innerHTML = list.map(s => `
    <div class="sfd-item" onclick="selectSFD('${s.id}','${s.sigle.replace(/'/g,"\\'")}','${s.nom.replace(/'/g,"\\'")}')">
      <strong>${s.sigle}</strong>
      <span>${s.nom}</span>
    </div>
  `).join('');
}

function selectSFD(id, sigle, nom) {
  sfdSelectedId = id;
  document.getElementById('g-sfd').value = sigle;
  document.getElementById('sfd-search').value = '';
  document.getElementById('sfd-dropdown').classList.remove('open');
  document.getElementById('sfd-selected').innerHTML = `
    <div class="sfd-selected-tag">
      <i class="fas fa-building"></i>
      <span>${sigle} — ${nom}</span>
      <button onclick="clearSFD()" title="Supprimer"><i class="fas fa-times"></i></button>
    </div>
  `;
  syncGlobal();
}

function clearSFD() {
  sfdSelectedId = null;
  document.getElementById('g-sfd').value = '';
  document.getElementById('sfd-selected').innerHTML = '';
  document.getElementById('sfd-search').value = '';
}

// Fermer dropdown au clic extérieur
document.addEventListener('click', function(e) {
  const wrap = document.querySelector('.sfd-search-wrap');
  if (wrap && !wrap.contains(e.target)) {
    document.getElementById('sfd-dropdown').classList.remove('open');
  }
});

/* ════════════════════════════════════════════
   INSPECTEURS MULTIPLES
════════════════════════════════════════════ */
// FIX : démarrer à 0 pour que le premier inspecteur soit numéroté 1
let inspCount = 0;

async function chargerListeInspecteurs() {
  try {
    const res = await fetch(`${API_URL}/utilisateurs/`);
    const data = await res.json();
    window._listeInspecteurs = (data.utilisateurs || []).filter(u => u.email);
  } catch {
    window._listeInspecteurs = [];
  }
}

function addInspecteur() {
  inspCount++;
  const list = document.getElementById('inspecteurs-list');

  // FIX : utiliser u.prenoms (champ backend) et l'email comme valeur du <option>
  const options = (window._listeInspecteurs || [])
    .map(u => {
      const nomComplet = `${u.nom || ''} ${u.prenoms || ''}`.trim();
      return `<option value="${u.email}">${nomComplet} — ${u.email}</option>`;
    })
    .join('');

  const div = document.createElement('div');
  div.className = 'inspecteur-row';
  div.innerHTML = `
    <div class="insp-num">${inspCount}</div>
    <select style="flex:1;padding:10px 13px;border:1.5px solid var(--border);border-radius:var(--radius-sm);font-family:'Nunito',sans-serif;font-size:13px" oninput="syncGlobal()">
      <option value="">-- Sélectionner un inspecteur --</option>
      ${options}
    </select>
    ${inspCount > 1 ? `<button class="del-insp" onclick="removeInspecteur(this)"><i class="fas fa-times"></i></button>` : ''}
  `;
  list.appendChild(div);
}

function removeInspecteur(btn) {
  btn.closest('.inspecteur-row').remove();
  // Renuméroter
  document.querySelectorAll('#inspecteurs-list .inspecteur-row').forEach((row, i) => {
    const num = row.querySelector('.insp-num');
    if (num) num.textContent = i + 1;
  });
  inspCount = document.querySelectorAll('#inspecteurs-list .inspecteur-row').length;
}

function getInspecteurs() {
  // FIX : prendre en compte les <select> (nouvelle mission) ET les <input>
  // (mission rechargée depuis le backend)
  return Array.from(
    document.querySelectorAll('#inspecteurs-list select, #inspecteurs-list input')
  ).map(s => s.value.trim()).filter(Boolean);
}

/* ════════════════════════════════════════════
   TYPE DE CONTRÔLE → affichage volets
════════════════════════════════════════════ */
const TYPE_CONFIG = {
  global: {
    label: 'Contrôle global', icon: 'fa-shield-halved', cls: 'type-global',
    blocs: null // null = tous les blocs existants
  },
  lbcft: {
    label: 'Rapport LBCFT', icon: 'fa-money-bill-transfer', cls: 'type-lbcft',
    blocs: [
      { id:'lbcft_99', icon:'fas fa-hand-fist', color:'#EF4444',
        name:"Lutte contre le blanchiment", index:'9.9',
        desc:"Dispositif LBC/FT, cellule anti-blanchiment, déclaration de soupçon",
        form: buildLBCFT }
    ]
  },
  cameli: {
    label: 'Rapport Cameli', icon: 'fa-file-invoice', cls: 'type-cameli',
    blocs: [
      {
        id: 'cameli_c', icon: 'fas fa-shield-alt', color: '#3B82F6',
        name: "C — Capitalisation", index: 'C',
        desc: "Ratio de solvabilité, qualité de l'actionnariat, risques de change et de taux",
        form: (b, g) => buildCameliPilier('C', g)
      },
      {
        id: 'cameli_a', icon: 'fas fa-chart-pie', color: '#EF4444',
        name: "A — Actifs", index: 'A',
        desc: "Portefeuille de crédit, trésorerie, autres actifs",
        form: (b, g) => buildCameliPilier('A', g)
      },
      {
        id: 'cameli_m', icon: 'fas fa-sitemap', color: '#8B5CF6',
        name: "M — Management, Organisation & Contrôles", index: 'M',
        desc: "Gouvernance, organisation opérationnelle, audit interne",
        form: (b, g) => buildCameliPilier('M', g)
      },
      {
        id: 'cameli_e', icon: 'fas fa-balance-scale', color: '#F59E0B',
        name: "E — Équilibre financier", index: 'E',
        desc: "Plan d'affaires, gestion budgétaire, rentabilité",
        form: (b, g) => buildCameliPilier('E', g)
      },
      {
        id: 'cameli_l', icon: 'fas fa-tint', color: '#10B981',
        name: "L — Liquidités & gestion actif/passif", index: 'L',
        desc: "Ratios de liquidité, transformation MLT, réserves",
        form: (b, g) => buildCameliPilier('L', g)
      },
      {
        id: 'cameli_i', icon: 'fas fa-database', color: '#06B6D4',
        name: "I — Information financière", index: 'I',
        desc: "SIG, sécurité informatique, obligations déclaratives",
        form: (b, g) => buildCameliPilier('I', g)
      },
      {
        id: 'cameli_synth', icon: 'fas fa-star', color: '#EC4899',
        name: "Synthèse CAMELI", index: 'Σ',
        desc: "Note globale pondérée et recommandations",
        form: (b, g) => buildCameliSynthese(g)
      },
    ]
  },
  suivi: {
    label: 'Suivi de recommandation', icon: 'fa-list-check', cls: 'type-suivi',
    blocs: [] // vide pour l'instant
  }
};

function onTypeChange(val) {
  const badge = document.getElementById('type-badge');
  const progressStrip = document.getElementById('progress-strip');
  const blocsHeader = document.getElementById('blocs-header');

  if (!val) {
    badge.innerHTML = '';
    progressStrip.style.display = 'none';
    blocsHeader.style.display = 'none';
    document.getElementById('blocs-grid').innerHTML = '';
    return;
  }

  const cfg = TYPE_CONFIG[val];
  badge.innerHTML = `<div class="type-badge ${cfg.cls}"><i class="fas ${cfg.icon}"></i> ${cfg.label}</div>`;
  progressStrip.style.display = 'flex';
  blocsHeader.style.display = 'flex';

  if (cfg.blocs === null) {
    // Contrôle global → tous les BLOCS
    renderGrid();
  } else if (cfg.blocs.length === 0) {
    // Vide
    document.getElementById('blocs-grid').innerHTML = `
      <div class="volet-empty">
        <i class="fas fa-folder-open"></i>
        <p>Volets en cours de construction</p>
        <small>Les formulaires pour ce type de contrôle seront disponibles prochainement.</small>
      </div>`;
    document.getElementById('ps-fill').style.width = '0%';
    document.getElementById('ps-count').textContent = '0 / 0 complétés';
  } else {
    // Blocs spécifiques
    renderCustomGrid(cfg.blocs);
  }
}

function renderCustomGrid(blocs) {
  const grid = document.getElementById('blocs-grid');
  grid.innerHTML = '';
  blocs.forEach((b, i) => {
    const done = completed.has(b.id);
    const card = document.createElement('div');
    card.className = 'bloc-card' + (done ? ' done' : '');
    card.innerHTML = `
      <div class="bloc-top">
        <div class="bloc-icon" style="background:${b.color}18;color:${b.color}">
          <i class="${b.icon}"></i>
        </div>
        <div class="bloc-arrow"><i class="fas fa-arrow-right"></i></div>
      </div>
      <div>
        <div class="bloc-name">${b.name}</div>
        <div class="bloc-desc">${b.desc}</div>
      </div>
      <div class="bloc-status">
        <div class="status-dot"></div>
        ${done ? 'Complété' : 'Non renseigné'}
      </div>
    `;
    card.onclick = () => openCustomBloc(b);
    grid.appendChild(card);
  });
  const pct = Math.round(completed.size / blocs.length * 100);
  document.getElementById('ps-fill').style.width = pct + '%';
  document.getElementById('ps-count').textContent = `${completed.size} / ${blocs.length} complétés`;
}

function openCustomBloc(b) {
  currentBloc = b;
  document.getElementById('dh-title').textContent = b.name;
  document.getElementById('dh-index').textContent = `Index ${b.index}`;
  document.getElementById('dh-icon').innerHTML = `<i class="${b.icon}"></i>`;
  document.getElementById('dh-icon').style.color = b.color;
  document.getElementById('drawer-body').innerHTML = b.form(b, getGlobal());
  document.getElementById('overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  attachHandlers();

  // ── FIX : restaurer les données déjà saisies pour ce volet, si elles existent ──
  const donneesSauvegardees = window._voletsCache && window._voletsCache[b.id];
  if (donneesSauvegardees && typeof restaurerDonneesDrawer === 'function') {
    restaurerDonneesDrawer(donneesSauvegardees);
  }
}

/* ════════════════════════════════════════════
   BUILDER — LBCFT (extrait de Autres volets)
════════════════════════════════════════════ */
function buildLBCFT(bloc, g) {
  const acts = [
    "S'assurer de l'existence de procédures décrivant l'organisation d'un dispositif de lutte contre le blanchiment des capitaux et le financement du terrorisme",
    "S'assurer de la mise en place d'une cellule anti-blanchiment",
    "S'assurer de la mise en œuvre de mesures d'identification de la clientèle",
    "S'assurer du traitement réservé aux opérations suspectes",
    "S'assurer du traitement de la déclaration de soupçon",
    "S'assurer de l'effectivité des actions de formation et de sensibilisation effectuées par le SFD dans le cadre de la lutte contre le blanchiment des capitaux et le financement du terrorisme",
    "S'assurer de l'élaboration et de la transmission dans le délai réglementaire aux Autorités du rapport sur le blanchiment",
  ];

  const rows = acts.map((a, i) => `
    <tr>
      <td class="act-num">${i + 1}</td>
      <td>${a}</td>
      <td><input type="text" placeholder="Initiales" style="width:68px;text-align:center"/></td>
      <td>
        <div class="lacune-wrap">
          <button class="lacune-btn" onclick="setLacune(this,'oui')">O</button>
          <button class="lacune-btn" onclick="setLacune(this,'non')">N</button>
        </div>
      </td>
      <td><textarea class="act-comment" rows="1" placeholder="Commentaire…"></textarea></td>
    </tr>`).join('');

  return `
    <div class="info-box">
      <i class="fas fa-info-circle"></i>
      SFD : <strong>${g.sfd || '—'}</strong> &nbsp;|&nbsp;
      Inspecteur : <strong>${g.inspecteur || '—'}</strong> &nbsp;|&nbsp;
      Chef de mission : <strong>${g.chef || '—'}</strong>
    </div>
    <div class="info-box" style="background:#F0FDF4;border-color:#86EFAC;color:#166534">
      <i class="fas fa-bullseye" style="color:#16A34A"></i>
      <span><strong>Objectif :</strong> S'assurer de la mise en place d'un dispositif de lutte contre les risques de blanchiment des capitaux et de financement du terrorisme.</span>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
      <div class="form-group-full"><label>Réviseur</label><input type="text" placeholder="Nom du réviseur"/></div>
      <div class="form-group-full"><label>Date</label><input type="date"/></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
      <div class="form-group-full"><label>Référence 1</label><input type="text" placeholder="Ex : Instruction BCEAO n°…"/></div>
      <div class="form-group-full"><label>Référence 2</label><input type="text" placeholder=""/></div>
    </div>
    <table class="act-table">
      <thead><tr>
        <th style="width:38px">N°</th><th>Activités</th>
        <th style="width:82px;text-align:center">Paraphe</th>
        <th style="width:90px;text-align:center">Lacune</th>
        <th>Commentaire</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="sub-title" style="margin-top:16px"><i class="fas fa-clock"></i> Suivis</div>
    <table class="dyn-table" id="suivi-lbcft">
      <thead><tr><th>Point</th><th>Suivi</th><th>Responsable</th><th style="width:120px">Échéance</th></tr></thead>
      <tbody><tr>
        <td><input type="text" placeholder="Point…"/></td>
        <td><input type="text" placeholder="Action…"/></td>
        <td><input type="text" placeholder="Responsable…"/></td>
        <td><input type="date"/></td>
      </tr></tbody>
    </table>
    <button class="add-btn" onclick="addRow('suivi-lbcft','<td><input type=text placeholder=Point…/></td><td><input type=text placeholder=Action…/></td><td><input type=text placeholder=Responsable…/></td><td><input type=date/></td>')">
      <i class="fas fa-plus"></i> Ajouter une ligne
    </button>
    <div class="sub-title" style="margin-top:16px"><i class="fas fa-exclamation-triangle"></i> Constats et Recommandations</div>
    <table class="dyn-table" id="const-lbcft">
      <thead><tr><th style="width:70px">Point</th><th>Constats</th><th>Recommandations</th></tr></thead>
      <tbody><tr>
        <td><input type="text" placeholder="Réf…"/></td>
        <td><textarea rows="2" placeholder="Décrivez le constat…"></textarea></td>
        <td><textarea rows="2" placeholder="Recommandation…"></textarea></td>
      </tr></tbody>
    </table>
    <button class="add-btn" onclick="addRow('const-lbcft','<td><input type=text placeholder=Réf…/></td><td><textarea rows=2 placeholder=Décrivez le constat…></textarea></td><td><textarea rows=2 placeholder=Recommandation…></textarea></td>')">
      <i class="fas fa-plus"></i> Ajouter une ligne
    </button>
    <div class="sub-title" style="margin-top:16px"><i class="fas fa-comment-alt"></i> Commentaires pour le rapport</div>
    <div class="form-group-full"><textarea rows="3" id="comm-general-lbcft" placeholder="Commentaires…"></textarea></div>
    ${buildAnnexes('lbcft')}
  `;
}

/* ════════════════════════════════════════════
   getGlobal — mise à jour avec inspecteurs
════════════════════════════════════════════ */
// Override getGlobal pour inclure tous les inspecteurs
function getGlobal() {
  const inspecteurs = getInspecteurs();
  return {
    sfd:        document.getElementById('g-sfd').value,
    date:       document.getElementById('g-date').value,
    inspecteur: inspecteurs.join(', '),
    inspecteurs: inspecteurs,
    chef:       document.getElementById('g-chef').value,
    reviseur:   document.getElementById('g-reviseur').value,
    ref:        document.getElementById('g-ref').value,
    type:       document.getElementById('g-type').value,
    periode:    document.getElementById('g-periode')?.value || '',
  };
}

/* ════════════════════════════════════════════
   SOUMETTRE
════════════════════════════════════════════ */
function soumettreMission() {
  // TODO : brancher sur le backend
  showToast('Mission soumise avec succès');
}

/* ════════════════════════════════════════════
   BUILDER — CAMELI (Notation prudentielle)
════════════════════════════════════════════ */

const CAMELI_PILIERS = {
  C: {
    nom: 'Capitalisation', poids: 1,
    items: [
      { code:'C01', lib:"Ratio de solvabilité (R = FPN / actif net ≥ 15 %)", poids:4,
        baremes:['≥ 26,25 %','22,5 – 26,25 %','18,75 – 22,5 %','15 – 18,75 %','11,75 – 15 %','7,5 – 11,75 %','3,75 – 7,5 %','0 – 3,75 %','Négatif'],
        notes:[1,1.5,2,2.5,3,3.5,4,4.5,5] },
      { code:'C03', lib:"Qualité de l'actionnariat / garantie de (re)capitalisation", poids:1,
        baremes:['G > 10 % actif ou actionnaire financier ≥ 50 %','7,5 % < G ≤ 10 % ou référence ≥ 34 %','5 % < G ≤ 10 %','2,5 % < G ≤ 5 %','G ≤ 2,5 % ou soutien improbable'],
        notes:[1,2,3,4,5] },
      { code:'C04', lib:"Risque de change (RC = position nette / FPN) — désactivable", poids:0.5,
        baremes:['RC ≤ 5 %','5 % < RC ≤ 10 %','10 % < RC ≤ 15 %','15 % < RC ≤ 20 %','RC > 20 %'],
        notes:[1,2,3,4,5], desactivable:true },
      { code:'C05', lib:"Risque de taux sur les fonds propres — désactivable", poids:0.5,
        baremes:['Système efficace détaillé + gestion formalisée satisfaisante','Système efficace global + gestion formalisée tardive','Outils à améliorer + gestion peu formalisée mais proactive','Aucun outil mais projets + politique non respectée','Aucun outil + aucune politique'],
        notes:[1,2,3,4,5], desactivable:true },
      { code:'C06', lib:"FAITIERES — grande caisse affiliée ≥ 10 % du bilan — désactivable", poids:1,
        baremes:['Note C01 de la caisse systémique la moins capitalisée (reporter la note)'],
        notes:[1,2,3,4,5], desactivable:true, libre:true },
    ]
  },
  A: {
    nom: 'Actifs', poids: 2,
    items: [
      { code:'A01', lib:"PAR 30 (créances en souffrance brut 30j / portefeuille brut)", poids:2,
        baremes:['≤ 2 %','2 – 5 %','5 – 10 %','10 – 20 %','> 20 %'], notes:[1,2,3,4,5] },
      { code:'A02', lib:"PAR 90 (créances en souffrance brut 90j / portefeuille brut)", ponds:1,
        baremes:['≤ 1 %','1 – 3 %','3 – 6 %','6 – 10 %','> 10 %'], notes:[1,2,3,4,5], poids:1 },
      { code:'A03', lib:"Taux de pertes annuelles (pertes nettes des reprises / portefeuille brut)", poids:1,
        baremes:['≤ 1 %','1 – 2 %','2 – 4 %','4 – 6 %','> 6 %'], notes:[1,2,3,4,5] },
      { code:'A04', lib:"Division des risques (R = risque max. / FPN ≤ 10 %)", poids:1,
        baremes:['≤ 5 %','5 – 10 %','10 – 15 %','15 – 20 %','> 20 % ou FPN négatifs'], notes:[1,2,3,4,5] },
      { code:'A05', lib:"Respect des règles d'attribution et de gestion des crédits", poids:1, libre:true,
        baremes:['Conforme + décisions concordent quasi-totalement avec instructeurs','Conforme + large majorité des décisions concordent','Globalement conforme malgré imperfections','Non conforme au formalisme + décisions rarement conformes','Décisions prises par entité non habilitée + absence d\'analyse'], notes:[1,2,3,4,5] },
      { code:'A06', lib:"Évaluation économique & cycle adapté", poids:1, libre:true,
        baremes:['Évaluation fiable + produits adaptés aux cycles','Globalement fiable + produits standard adaptés','Lacunes sur volume significatif + produits non paramétrés','Comptes non étudiés + produits inadaptés','Absence d\'étude économique + produits inadaptés'], notes:[1,2,3,4,5] },
      { code:'A07', lib:"Garanties réelles & personnelles adaptées", poids:1, libre:true,
        baremes:['Garanties conformes meilleurs standards et droit des sûretés','Garanties de qualité avec garanties économiques/sociales','Couverture majoritaire mais risque juridique significatif','Garanties non constituées ou fiabilité juridique douteuse','Absence de garantie réelle ou personnelle'], notes:[1,2,3,4,5] },
      { code:'A08', lib:"Suivi post-décaissement & gestion des retards", poids:1, libre:true,
        baremes:['Suivi systématique + relance créances J+1','Suivi majorité + relance J+7','Suivi minorité significative + relance 30j+','Suivi partiel + réaction aléatoire','Absence de suivi post-décaissement et des créances'], notes:[1,2,3,4,5] },
      { code:'A09', lib:"Limitation globale des risques (Σ risques / Σ ressources ≤ 200 %)", poids:1,
        baremes:['≤ 100 %','100 – 200 %','200 – 225 %','225 – 250 %','> 250 %'], notes:[1,2,3,4,5] },
      { code:'A10', lib:"Taux d'exposition (crédits en souffrance nets / FPN)", poids:1,
        baremes:['< 15 %','15 – 25 %','25 – 50 %','50 – 100 %','> 100 % ou FPN négatifs'], notes:[1,2,3,4,5] },
      { code:'A11', lib:"TPCC — Taux de portefeuille de crédit croisé — désactivable", poids:1,
        baremes:['< 5 %','5 – 15 %','15 – 25 %','25 – 35 % ou absence calcul','> 35 % ou BIC non consulté'], notes:[1,2,3,4,5], desactivable:true },
      { code:'A12', lib:"Sécurisation physique trésorerie & systèmes de paiement", poids:1, libre:true,
        baremes:['Meilleurs standards + assurance 3×100 % + paiement international','Normes minimales + dispositif additionnel + assurance partielle','Standard microfinance + failles + assurance incertaine','Sécurité faible + risque amoindri par caisse réduite + pas assurance','Pas de sécurité + pas assurance + paiement non sécurisé'], notes:[1,2,3,4,5] },
      { code:'A13', lib:"Ratio limitation participations non financières (Σ titres / FPN ≤ 25 %)", poids:0.5,
        baremes:['≤ 15 %','15 – 25 %','25 – 35 %','35 – 50 %','> 50 %'], notes:[1,2,3,4,5] },
      { code:'A14', lib:"Ratio diversification (Σ produits non bancaires / Total produits ≤ 5 %)", poids:0.5,
        baremes:['≤ 2 %','2 – 5 %','5 – 7,5 %','7,5 – 10 %','> 10 %'], notes:[1,2,3,4,5] },
    ]
  },
  M: {
    nom: 'Management, Organisation & Contrôles', poids: 3,
    items: [
      { code:'M01', lib:"Assemblées Générales (tenue des réunions et votes)", poids:1, libre:true,
        baremes:['AG annuelle + large majorité + budgets adoptés','AG annuelle + participation faible + majorité simple','AG annuelle + participation faible + décisions contestées','Tenue irrégulière / sans quorum / contestations','Absence ou AG fictive / coopec d\'affaires'], notes:[1,2,3,4,5] },
      { code:'M02', lib:"Fonctionnement des organes délibérants (CA, CC, CS / Comité d'Audit)", poids:1, libre:true,
        baremes:['Réunions régulières + décisions collégiales + formalisme respecté','Réunions rares + collégiales + formalisme respecté','Irrégulières + par vote + formalisme lacunaire','Rares + par vote + lacunes graves','Rares + quorum non atteint + non-respect quasi-intégral'], notes:[1,2,3,4,5] },
      { code:'M03', lib:"Compétences techniques des membres des organes délibérants", poids:1, libre:true,
        baremes:['Entièrement aptes','Majoritairement aptes','Minorité significative capable','Lacunes graves + absence de contre-pouvoir','Manifestement inaptes'], notes:[1,2,3,4,5] },
      { code:'M04', lib:"Validation en AG des rémunérations, avantages, frais, conventions", poids:1, libre:true,
        baremes:['Validation AG + comité de rémunération + rapport CAC','Validation globale en AG dans l\'enveloppe prévisionnelle votée','Respect apparent mais dispositif opaque / non validé AG','Système opaque + montants élevés + suspicion fraudes','Absence vote AG / refus quitus / infractions constatées'], notes:[1,2,3,4,5] },
      { code:'M05', lib:"Organe exécutif — positionnement institutionnel et pouvoirs", poids:1, libre:true,
        baremes:['Pouvoirs légaux + statutaires + effectifs + distinct organe délibérant','Pouvoirs statutaires + effectifs + distinct','Pouvoirs réels par délégation réversible + distinct','Direction dotée de pouvoirs mais nommée/révoquée par Président CA','Absence d\'organe exécutif ou phagocyté'], notes:[1,2,3,4,5] },
      { code:'M06', lib:"Efficience de l'organe exécutif et système de délégation interne", poids:1, libre:true,
        baremes:['≥ 2 dirigeants compétents + organigramme clair + directeurs dans toutes fonctions','≥ 1 dirigeant compétent + organigramme clair + directeurs dans 3 fonctions clés','Capacités limitées mais globalement compétent','Insuffisances graves en compétences ou organisation','Absent / incompétent / fictif / phagocyté'], notes:[1,2,3,4,5] },
      { code:'M07', lib:"Ratio limitation crédits dirigeants/personnel/liés (R ≤ 10 % FPN)", poids:1,
        baremes:['≤ 5 %','5 – 10 %','10 – 15 %','15 – 20 %','> 20 % ou FPN négatifs'], notes:[1,2,3,4,5] },
      { code:'M08', lib:"Procédures & déontologie — opérations avec dirigeants & salariés", poids:1, libre:true,
        baremes:['Charte statutaire + procédures transparentes + démission 7j impayé','Charte + procédures + démission 30j','Pas de charte + respect limitations + pas de démission d\'office','Pas de charte + impayés constatés sans sanction','Conflits d\'intérêt courants + impayés PAR élevés sans sanction'], notes:[1,2,3,4,5] },
      { code:'M09', lib:"Séparation des fonctions (global)", poids:1, libre:true,
        baremes:['Toutes missions + séparation totale (opérations/support/risques/audit)','Missions opérations+support+audit + séparation entre elles','Opérations+audit + séparation entre elles','Opérations+audit avec cumuls + confusions + audit passant écritures','Absence de séparation'], notes:[1,2,3,4,5] },
      { code:'M10', lib:"Trésorerie — procédures de sécurisation & séparation des fonctions", poids:1, libre:true,
        baremes:['Excellent','Correct','Insuffisant','Risque grave','Situation défaillante'], notes:[1,2,3,4,5] },
      { code:'M11', lib:"Fonction support — séparation achats/stocks/consommation", poids:1, libre:true,
        baremes:['Respect intégral procédures + paye séparée','Respect avec simplifications sans remise en cause','Approximatif','Approximatif mettant en cause séparation + fraudes possibles','Globalement défaillant'], notes:[1,2,3,4,5] },
      { code:'M12', lib:"Fonction support soumise au contrôle de gestion", poids:1, libre:true,
        baremes:['Contrôle de gestion + absence anomalies','Existe avec simplifications','Approximatif','Contrôle approximatif + anomalies élevées','Globalement défaillant'], notes:[1,2,3,4,5] },
      { code:'M13', lib:"Qualité et exhaustivité des procédures & système de gestion du risque opérationnel", poids:1, libre:true,
        baremes:['Procédures thématiques complètes + forme irréprochable','Domaines importants + forme correcte','Domaines clés + identifiables et validées','Champs non couverts + non datées/signées','Inexistantes ou inconsistantes'], notes:[1,2,3,4,5] },
      { code:'M14', lib:"Gestion RH — politique adaptée", poids:1, libre:true,
        baremes:['Bons principes mis en œuvre','Principes assez bons + améliorations nécessaires','Efficace mais non formalisée','Manque de principes formels','Rotation fréquente + gestion inexistante'], notes:[1,2,3,4,5] },
      { code:'M15', lib:"Gestion RH — effectifs et compétence du personnel", poids:1, libre:true,
        baremes:['Effectifs suffisants + bien formés','Suffisants + améliorations nécessaires','Insuffisants + plan de recrutement décidé','Faiblesses dans domaines essentiels','Insuffisants et non formés'], notes:[1,2,3,4,5] },
      { code:'M16', lib:"Fonctions de 2ème niveau — Conformité et Risques", poids:1, libre:true,
        baremes:['Indépendante + accès CA','Indépendante + accès DG seulement','Indépendante + mandat à préciser','Prérogatives et indépendance insuffisantes','Absente'], notes:[1,2,3,4,5] },
      { code:'M17', lib:"Gestion & suivi du risque opérationnel et de la conformité", poids:1, libre:true,
        baremes:['Principes fixés + CA informé + modalités d\'évaluation et alertes','Principes + reporting formel CA + modalités sans méthodo bâloise','Politique sans CA + en cours de développement','Projets embryonnaires','Absent'], notes:[1,2,3,4,5] },
      { code:'M17b', lib:"Dispositif LBC-FTP (reporter note TEERIBEC pilier I)", poids:1, libre:true,
        baremes:['1','2','3','4','5'], notes:[1,2,3,4,5] },
      { code:'M18', lib:"Direction Audit Interne — champ d'audit et rattachement", poids:1, libre:true,
        baremes:['Habilité à auditer tout + rattaché comité audit','Habilité tout (imperfections mineures) + rattaché comité audit','Habilité partiellement + rattaché de fait à exécutif','Non habilité sur éléments stratégiques + totalement soumis exécutif','Absent ou fictif'], notes:[1,2,3,4,5] },
      { code:'M19', lib:"Moyens et outils de l'Audit Interne", poids:1, libre:true,
        baremes:['Moyens suffisants + outils performants (SIG + remontées)','Moyens suffisants + outils de remontée d\'info','Moyens partiels + interrogation SIG partielle','Effectifs insuffisants + sans manuels ni outils','Absent ou fictif'], notes:[1,2,3,4,5] },
      { code:'M20', lib:"Capacité effective à faire appliquer procédures & sanctions", poids:1, libre:true,
        baremes:['Pouvoirs A+B+C complets et effectifs','Pouvoirs juridiques complets mais application lacunaire','Application soumise à validations locales partielles','Politiques non standardisées + GRH non centralisée + sanctions limitées','Capacité de sanction non effective'], notes:[1,2,3,4,5] },
    ]
  },
  E: {
    nom: 'Équilibre financier', poids: 1.5,
    items: [
      { code:'E01', lib:"Qualité du plan d'affaires et de la planification stratégique", poids:1, libre:true,
        baremes:['Plan 3-5 ans irréprochable + pilotage DG impliquant entreprise','Plan 3 ans crédible + pilotage + validation CA','Effort de planification + lacunes + implication faible','Plan manquant ou peu crédible + pilotage déficient','Absent ou inconsistant'], notes:[1,2,3,4,5] },
      { code:'E02', lib:"Qualité de la gestion budgétaire", poids:1, libre:true,
        baremes:['Cohérent + outils prévision + ajustements nuls','Cohérent + budget annuel + outils suivi','Budget prévisionnel + lacunes exécution + ajustements fréquents','Gestion à vue','Absent ou défaillant'], notes:[1,2,3,4,5] },
      { code:'E03', lib:"Coefficient d'exploitation (charges exploitation / PNB)", poids:1,
        baremes:['≤ 50 %','50 – 75 %','75 – 100 %','100 – 150 %','> 150 %'], notes:[1,2,3,4,5] },
      { code:'E04', lib:"AROA — Rendement sur actif (RE / actif moyen ≥ 3 %)", poids:1,
        baremes:['> 3 %','1,5 – 3 %','0 – 1,5 %','-1,5 – 0 %','< -1,5 %'], notes:[1,2,3,4,5] },
      { code:'E05', lib:"AROE — Rentabilité des fonds propres (RE / FP moyens ≥ 15 %)", poids:1,
        baremes:['> 15 %','7,5 – 15 %','0 – 7,5 %','-5 – 0 %','< -5 % ou FP nuls/négatifs'], notes:[1,2,3,4,5] },
      { code:'E06', lib:"Plan préventif de redressement (SFD art. 44)", poids:1, libre:true,
        baremes:['Excellent','Conforme','Insuffisances','Lacunes importantes','Défaillant'], notes:[1,2,3,4,5] },
    ]
  },
  L: {
    nom: 'Liquidités & gestion actif/passif', poids: 1.5,
    items: [
      { code:'L01', lib:"Outils procéduraux, SIG et analytiques de gestion actif/passif", poids:1, libre:true,
        baremes:['Niveau bancaire + gestion instantanée + SIG prévisionnelle automatisée','Niveau quasi-bancaire + consolidation quotidienne fiable','Gestion rudimentaire en différé + outils prévisionnels faibles','Pilotage à vue + périodicité ≥ mensuelle','Aucun outil'], notes:[1,2,3,4,5] },
      { code:'L02', lib:"Ratio de liquidité à 3 mois (actif dispo / passif exigible) — désactivable", poids:2, desactivable:true,
        baremes:['≥ 125 %','100 – 125 %','75 – 100 %','50 – 75 %','< 50 %'], notes:[1,2,3,4,5] },
      { code:'L03', lib:"Ratio de liquidité immédiate (trésorerie / dépôts à vue)", poids:2,
        baremes:['≥ 25 %','20 – 25 %','15 – 20 %','10 – 15 %','< 10 %'], notes:[1,2,3,4,5] },
      { code:'L04', lib:"Transformation MLT (ressources MLT / actif MLT ≥ 100 %)", poids:1,
        baremes:['≥ 125 %','100 – 125 %','75 – 100 %','50 – 75 %','< 50 %'], notes:[1,2,3,4,5] },
      { code:'L05', lib:"Couverture immobilisations & participations / FPN ≤ 100 %", poids:1,
        baremes:['≤ 25 %','25 – 50 %','50 – 75 %','75 – 100 %','100 – 125 %','125 – 150 %','150 – 175 %','175 – 200 %','> 200 % ou FPN négatifs'],
        notes:[1,1.5,2,2.5,3,3.5,4,4.5,5] },
      { code:'L06', lib:"Qualité des réserves de liquidité (PFU)", poids:1, libre:true,
        baremes:['Accès direct banque centrale ou actionnaire bancaire ≥ 1/3 + lettre engagement','Accords crédit banques ≥ 50 % DAV ou actionnaire bancaire ≥ 1/3','Accords crédit banques < 50 % DAV + accès indirect non garanti','Aucun accord de refinancement bancaire','Aucun accès + impossibilité avérée de refinancement'], notes:[1,2,3,4,5] },
      { code:'L07', lib:"Division du risque liquidité (Σ dépôts + gros client / total bilan) — désactivable", poids:1, desactivable:true,
        baremes:['≤ 2 %','2 – 5 %','5 – 10 %','10 – 15 %','> 15 %'], notes:[1,2,3,4,5] },
    ]
  },
  I: {
    nom: 'Information financière', poids: 1,
    items: [
      { code:'I01', lib:"Qualité architecture informatique & sécurité physique SIG", poids:1, libre:true,
        baremes:['Serveur centralisé + VPN H24 + serveur miroir + sauvegardes site ext.','Serveur central + VPN/internet sécurisé + sauvegardes site sécurisé','Serveurs par agence + consolidation semi-auto + sauvegardes aléatoires','Serveurs agence + consolidation manuelle + pas de sauvegardes quotidiennes','Absence informatisation ou non sécurisé'], notes:[1,2,3,4,5] },
      { code:'I02', lib:"Sécurité informatique (mots de passe, piste d'audit, habilitations)", poids:1, libre:true,
        baremes:['Codes perso + opérations irréversibles + SIG verrouillé + firewall + antivirus','Codes perso + irréversible + SIG verrouillé pour caissier/crédit + firewall','Codes perso + clôture quotidienne + habilitations partiellement faillibles','Absence codes perso ou communs + effacement possible + opérations libres','Excel / papier + pas habilitations + pas piste audit'], notes:[1,2,3,4,5] },
      { code:'I03', lib:"Capacités fonctionnelles du SIG pour opérations & comptabilité", poids:1, libre:true,
        baremes:['Toutes opérations + comptabilité automatique intégrée','Opérations principales + comptabilité via import auto','Caisse+crédit + comptabilité avec retraitements','Caisse+crédit + passage comptabilité complexe/manuel','Opérations manuelles ou Excel + comptabilité manuelle'], notes:[1,2,3,4,5] },
      { code:'I04', lib:"Capacités additionnelles SIG (LBC-FTP, contrôle de gestion, audit)", poids:1, libre:true,
        baremes:['Piste audit 10 ans + interrogation temps réel + ratios + filtrage LBC + alertes','Points A B C satisfaits + filtrage LBC différé + alertes quotidiennes','Point A partiel + B mensuel + paramétrage limité + LBC au cas par cas','Point A partiel 5 ans + B à D défaillants','Aucune capacité additionnelle'], notes:[1,2,3,4,5] },
      { code:'I05', lib:"Capacités SIG à calculer ratios et obligations déclaratives", poids:1, libre:true,
        baremes:['Tous états générés automatiquement par SIG','Via export + module additionnel + quelques infos additionnelles','Majorité via SIG + exports + saisies additionnelles','Erreurs ou incapacité sur certains ratios','Non possible ou non fiable'], notes:[1,2,3,4,5] },
      { code:'I06', lib:"Capacité à interagir avec centrales d'information et SFN — désactivable", poids:1, desactivable:true,
        baremes:['Interfaçage complet automatisé + interrogations automatiques','Envoi complet selon format + interrogations possibles','Export Excel avec retraitements + lacunes','Saisie manuelle + interrogation internet non liée SIG','Non possible ou non fiable'], notes:[1,2,3,4,5], desactivable:true },
      { code:'I07', lib:"Comptes certifiés et conformes aux normes de production & transmission", poids:1, libre:true,
        baremes:['Certifiés sans réserve par 2 CAC agréés sur 3 exercices + diligences','Certification sans réserve normale + diligences','Certification avec réserves admises + diligences partielles','Comptes non certifiés sans obligation + pas d\'erreurs apparentes','Non certifiés avec obligation / refus / états incohérents'], notes:[1,2,3,4,5] },
      { code:'I08', lib:"Fréquence et importance des erreurs comptables constatées", poids:1, libre:true,
        baremes:['Aucune erreur + piste audit parfaite','Erreurs mineures + sans intention frauduleuse','Irrégularités ne remettant pas en cause sincérité','Erreurs importantes / possibles fraudes non organisées','Fraudes comptables organisées'], notes:[1,2,3,4,5] },
      { code:'I09', lib:"Communication effective & qualité des obligations déclaratives périodiques", poids:1, libre:true,
        baremes:['Toutes obligations envoyées dans délais sur 36 mois + pas d\'erreurs','Dans délais + pas d\'erreurs significatives','Partielles + retards + format non conforme + données sincères','Partielles + retards + erreurs impactant analyse','Absence d\'envoi ou données manifestement incohérentes'], notes:[1,2,3,4,5] },
    ]
  }
};

// Note en lettre
function noteEnLettre(n) {
  if (n <= 1.25) return { lettre:'A+', color:'#16A34A' };
  if (n <= 1.50) return { lettre:'A',  color:'#22C55E' };
  if (n <= 1.75) return { lettre:'A-', color:'#4ADE80' };
  if (n <= 2.00) return { lettre:'B+', color:'#84CC16' };
  if (n <= 2.25) return { lettre:'B',  color:'#EAB308' };
  if (n <= 2.50) return { lettre:'B-', color:'#F59E0B' };
  if (n <= 3.00) return { lettre:'C',  color:'#F97316' };
  if (n <= 3.50) return { lettre:'D',  color:'#EF4444' };
  return { lettre:'E', color:'#991B1B' };
}

function buildCameliPilier(code, g) {
  const pilier = CAMELI_PILIERS[code];
  if (!pilier) return '<p>Pilier inconnu</p>';

  const itemsHTML = pilier.items.map((item, idx) => {
    const inputId = `cam_${code}_${item.code}`;
    const desactId = `cam_desact_${code}_${item.code}`;

    let selectOpts = '';
    if (item.libre) {
      // Note libre 1-5
      selectOpts = `<option value="">—</option>` +
        [1,1.5,2,2.5,3,3.5,4,4.5,5].filter(v => item.notes.includes(v) || [1,2,3,4,5].includes(v))
        .map(v => `<option value="${v}">${v}</option>`).join('');
    } else {
      selectOpts = `<option value="">—</option>` +
        item.baremes.map((b, i) => `<option value="${item.notes[i]}">${item.notes[i]} — ${b}</option>`).join('');
    }

    return `
      <tr id="row_${inputId}" style="transition:.2s">
        <td style="font-weight:700;color:#6B7280;font-size:11px;white-space:nowrap">${item.code}</td>
        <td style="font-size:12.5px;line-height:1.4">${item.lib}</td>
        <td style="text-align:center;font-size:11px;color:#94A3B8">${item.poids}</td>
        <td style="text-align:center">
          ${item.libre
            ? `<select id="${inputId}" onchange="calcCameli('${code}')"
                style="width:60px;padding:5px;border:1.5px solid var(--border);border-radius:6px;font-size:13px;text-align:center">
                <option value="">—</option>
                ${[1,2,3,4,5].map(v=>`<option value="${v}">${v}</option>`).join('')}
              </select>`
            : `<select id="${inputId}" onchange="calcCameli('${code}')"
                style="width:100%;max-width:320px;padding:5px;border:1.5px solid var(--border);border-radius:6px;font-size:12px">
                ${selectOpts}
              </select>`
          }
        </td>
        ${item.desactivable ? `
        <td style="text-align:center">
          <label style="font-size:11px;display:flex;align-items:center;gap:4px;justify-content:center;cursor:pointer">
            <input type="checkbox" id="${desactId}" onchange="toggleDesact('${inputId}','${desactId}','${code}')" />
            Désactiver
          </label>
        </td>` : '<td></td>'}
      </tr>
    `;
  }).join('');

  return `
    <div class="info-box">
      <i class="fas fa-info-circle"></i>
      SFD : <strong>${g.sfd || '—'}</strong> &nbsp;|&nbsp;
      Inspecteur : <strong>${g.inspecteur || '—'}</strong> &nbsp;|&nbsp;
      Chef de mission : <strong>${g.chef || '—'}</strong>
    </div>

    <div class="sub-title"><i class="fas fa-star"></i> Pilier ${code} — ${pilier.nom}</div>
    <p style="font-size:12px;color:var(--text-muted);margin-bottom:12px">
      Sélectionnez la note (1 à 5) pour chaque item. Les items désactivables peuvent être mis à 0 si non applicable.
    </p>

    <div style="overflow-x:auto">
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <thead>
          <tr style="background:#1A2233;color:#fff">
            <th style="padding:9px 10px;text-align:left;width:60px">Code</th>
            <th style="padding:9px 10px;text-align:left">Item</th>
            <th style="padding:9px 10px;text-align:center;width:60px">Poids</th>
            <th style="padding:9px 10px;text-align:center;min-width:180px">Note (1→5)</th>
            <th style="padding:9px 10px;text-align:center;width:100px">Désactiver</th>
          </tr>
        </thead>
        <tbody>${itemsHTML}</tbody>
      </table>
    </div>

    <div id="result_${code}" style="margin-top:20px;padding:16px 22px;background:#F8FAFC;border:1.5px solid var(--border);border-radius:12px;display:flex;align-items:center;gap:20px">
      <div>
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--text-muted)">Note pondérée pilier ${code}</div>
        <div id="score_${code}" style="font-size:32px;font-weight:800;color:var(--orange)">—</div>
      </div>
      <div>
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--text-muted)">Note en lettre</div>
        <div id="lettre_${code}" style="font-size:32px;font-weight:800">—</div>
      </div>
      <div style="flex:1">
        <div id="recomm_${code}" style="font-size:12.5px;color:#334155;line-height:1.6"></div>
      </div>
    </div>

    <div class="sub-title" style="margin-top:22px"><i class="fas fa-comment-alt"></i> Commentaires pilier ${code}</div>
    <div class="form-group-full">
      <textarea rows="3" id="comm_${code}" placeholder="Commentaires et observations pour le pilier ${code}…"></textarea>
    </div>
    ${buildAnnexes('cam_' + code)}
  `;
}

function toggleDesact(inputId, desactId, code) {
  const chk = document.getElementById(desactId);
  const sel = document.getElementById(inputId);
  const row = document.getElementById('row_' + inputId);
  if (!sel) return;
  if (chk && chk.checked) {
    sel.value = '0';
    sel.disabled = true;
    if (row) row.style.opacity = '0.4';
  } else {
    sel.value = '';
    sel.disabled = false;
    if (row) row.style.opacity = '1';
  }
  calcCameli(code);
}

function calcCameli(code) {
  const pilier = CAMELI_PILIERS[code];
  if (!pilier) return;

  let totalPoids = 0, totalScore = 0;
  pilier.items.forEach(item => {
    const sel = document.getElementById(`cam_${code}_${item.code}`);
    if (!sel) return;
    const val = parseFloat(sel.value);
    if (!isNaN(val) && val > 0) {
      totalPoids += item.poids;
      totalScore += val * item.poids;
    } else if (val === 0) {
      // désactivé — on ne compte pas
    }
  });

  const scoreEl  = document.getElementById('score_' + code);
  const lettreEl = document.getElementById('lettre_' + code);
  const recommEl = document.getElementById('recomm_' + code);
  if (!scoreEl) return;

  if (totalPoids === 0) {
    scoreEl.textContent = '—';
    lettreEl.textContent = '—';
    return;
  }

  const moy = totalScore / totalPoids;
  const { lettre, color } = noteEnLettre(moy);

  scoreEl.textContent = moy.toFixed(2);
  scoreEl.style.color = color;
  lettreEl.textContent = lettre;
  lettreEl.style.color = color;

  // Recommandation standard
  const recomm = {
    'A+':'Situation excellente — aucune intervention particulière requise.',
    'A': 'Situation très bonne — surveillance normale, pas d\'action corrective urgente.',
    'A-':'Situation bonne — quelques points de vigilance à surveiller.',
    'B+':'Situation satisfaisante — recommandations d\'amélioration à formuler.',
    'B': 'Situation acceptable — des améliorations sont souhaitables dans les délais raisonnables.',
    'B-':'Situation passable — un plan d\'amélioration formalisé est recommandé.',
    'C': 'Situation préoccupante — des mesures correctives doivent être prises dans les délais impartis.',
    'D': 'Situation dégradée — mesures correctives urgentes requises, suivi rapproché nécessaire.',
    'E': 'Situation critique — intervention immédiate du superviseur envisageable.',
  }[lettre] || '';
  if (recommEl) recommEl.textContent = recomm;

  // Stocker pour la synthèse
  window._cameliScores = window._cameliScores || {};
  window._cameliScores[code] = { moy, lettre, color, poids: pilier.poids };
}

function buildCameliSynthese(g) {
  const piliers = Object.keys(CAMELI_PILIERS);
  const rows = piliers.map(code => {
    const p = CAMELI_PILIERS[code];
    const sc = (window._cameliScores || {})[code];
    const moy = sc ? sc.moy.toFixed(2) : '—';
    const lettre = sc ? sc.lettre : '—';
    const color = sc ? sc.color : '#94A3B8';
    return `
      <tr>
        <td style="font-weight:700;font-size:13px">${code}</td>
        <td style="font-size:13px">${p.nom}</td>
        <td style="text-align:center;font-size:13px">${p.poids}</td>
        <td style="text-align:center;font-weight:800;font-size:15px;color:${color}">${moy}</td>
        <td style="text-align:center;font-weight:800;font-size:18px;color:${color}">${lettre}</td>
      </tr>
    `;
  }).join('');

  // Calculer note globale pondérée
  const scores = window._cameliScores || {};
  let totalPoids = 0, totalScore = 0;
  piliers.forEach(code => {
    const p = CAMELI_PILIERS[code];
    const sc = scores[code];
    if (sc) { totalPoids += p.poids; totalScore += sc.moy * p.poids; }
  });
  const global = totalPoids > 0 ? totalScore / totalPoids : null;
  const { lettre: gLet, color: gCol } = global ? noteEnLettre(global) : { lettre:'—', color:'#94A3B8' };

  return `
    <div class="info-box">
      <i class="fas fa-info-circle"></i>
      SFD : <strong>${g.sfd || '—'}</strong> &nbsp;|&nbsp;
      Inspecteur : <strong>${g.inspecteur || '—'}</strong> &nbsp;|&nbsp;
      Chef de mission : <strong>${g.chef || '—'}</strong>
    </div>

    <div class="sub-title"><i class="fas fa-star"></i> Note globale CAMELI</div>
    <p style="font-size:12px;color:var(--text-muted);margin-bottom:16px">
      Synthèse des 6 piliers. Complétez d'abord chaque pilier avant de consulter cette synthèse.
    </p>

    <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px">
      <thead>
        <tr style="background:#1A2233;color:#fff">
          <th style="padding:9px 12px;text-align:left;width:50px">Pilier</th>
          <th style="padding:9px 12px;text-align:left">Nom</th>
          <th style="padding:9px 12px;text-align:center;width:60px">Poids</th>
          <th style="padding:9px 12px;text-align:center;width:80px">Note</th>
          <th style="padding:9px 12px;text-align:center;width:80px">Lettre</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr style="background:#F8FAFC;border-top:2px solid #1A2233">
          <td colspan="3" style="padding:12px;font-weight:800;font-size:14px">NOTE GLOBALE CAMELI</td>
          <td style="text-align:center;font-weight:800;font-size:20px;color:${gCol}">${global ? global.toFixed(2) : '—'}</td>
          <td style="text-align:center;font-weight:800;font-size:24px;color:${gCol}">${gLet}</td>
        </tr>
      </tfoot>
    </table>

    <div class="sub-title" style="margin-top:22px"><i class="fas fa-clipboard-check"></i> Recommandations générales</div>
    <div class="form-group-full">
      <textarea rows="5" placeholder="Synthèse des recommandations issues de la notation CAMELI…"></textarea>
    </div>

    <div class="sub-title" style="margin-top:16px"><i class="fas fa-comment-alt"></i> Commentaires pour le rapport</div>
    <div class="form-group-full">
      <textarea rows="4" id="comm-general-cameli" placeholder="Commentaires à intégrer dans le rapport final…"></textarea>
    </div>
    ${buildAnnexes('cam_synth')}
  `;
}

/* ════════════════════════════════════════════
   RESTRICTIONS PAR RÔLE
   Seul le chef de mission peut modifier les infos
   générales et les données SFD ; les autres
   inspecteurs voient ces zones en lecture seule.
   (estChefMission est définie dans le module d'auth)
════════════════════════════════════════════ */
function appliquerRestrictionsRole() {
  if (typeof estChefMission !== 'function' || estChefMission()) return;

  function griserZone(zone) {
    if (!zone) return;
    zone.querySelectorAll('input, select, textarea, button').forEach(el => {
      el.disabled = true;
    });
    zone.style.opacity = '0.6';
    zone.style.pointerEvents = 'none';
  }

  // 1) Carte "Nouvelle mission de contrôle"
  griserZone(document.querySelector('.info-card'));

  // 2) Carte "Données SFD pour le rapport" — on grise le CONTENU des
  //    panneaux (pas les onglets), pour laisser l'inspecteur naviguer
  //    et consulter les données en lecture seule.
  document.querySelectorAll('.donnees-sfd-card .donnees-sfd-panel').forEach(panel => {
    griserZone(panel);
  });

  if (!document.getElementById('bandeau-mode-inspecteur')) {
    const header = document.querySelector('.page-header');
    if (header) {
      const bandeau = document.createElement('div');
      bandeau.id = 'bandeau-mode-inspecteur';
      bandeau.style.cssText = 'background:#FEF3C7;border:1.5px solid #FDE68A;color:#92400E;padding:10px 16px;border-radius:8px;font-size:12.5px;font-weight:600;margin-top:12px;display:flex;align-items:center;gap:8px';
      bandeau.innerHTML = '<i class="fas fa-lock"></i> Mode inspecteur — seuls les volets de contrôle ci-dessous sont modifiables. Les autres informations ont été renseignées par le chef de mission.';
      header.insertAdjacentElement('afterend', bandeau);
    }
  }
}