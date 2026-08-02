/* ================================================
   DSFD — volets_save.js
   Collecte toutes les données d'un volet depuis
   le drawer et les sauvegarde via l'API
   ================================================ */

/* ════════════════════════════════════════════
   COLLECTE DES DONNÉES DU DRAWER
════════════════════════════════════════════ */

function collecterDonneesDrawer(blocId) {
  const drawer = document.getElementById('drawer-body');
  if (!drawer) return {};

  const data = {
    bloc_id:     blocId,
    timestamp:   new Date().toISOString(),

    // Niveaux de risque (radio buttons ctrl_table)
    niveaux_risque: {},

    // Evolution depuis dernière inspection
    evolution: null,

    // Commentaires de sous-section (textareas), restent sur la plateforme
    commentaires: [],

    // Tables d'activités (paraphes + lacunes + commentaires)
    activites: [],

    // Tables de suivis
    suivis: [],

    // Constats et recommandations
    constats_recommandations: [],

    // Références
    references: [],

    // Champs libres (inputs divers)
    champs_libres: {},
  };

  // ── Niveaux de risque ──
  drawer.querySelectorAll('.ctrl-table tbody tr').forEach((tr, i) => {
    const label = tr.querySelector('td:first-child')?.textContent?.trim() || `Point ${i+1}`;
    const checked = tr.querySelector('input[type=radio]:checked');
    if (checked) data.niveaux_risque[label] = checked.value;
  });

  // ── Evolution ──
  const evolChecked = drawer.querySelector('input[name*="evol"]:checked');
  if (evolChecked) data.evolution = evolChecked.value;

  // ── Activités (act-table) ──
  drawer.querySelectorAll('.act-table tbody tr').forEach((tr, i) => {
    const num     = tr.querySelector('.act-num')?.textContent?.trim() || String(i+1);
    const libelle = tr.querySelector('td:nth-child(2)')?.textContent?.trim() || '';
    const paraphe = tr.querySelector('input[type=text]')?.value?.trim() || '';
    const lacune  = tr.querySelector('.lacune-btn.oui') ? 'Oui'
                  : tr.querySelector('.lacune-btn.non') ? 'Non' : null;
    const comment = tr.querySelector('textarea')?.value?.trim() || '';

    if (paraphe || lacune || comment) {
      data.activites.push({ num, libelle: libelle.substring(0, 120), paraphe, lacune, comment });
    }
  });

  // ── Commentaires de sous-section pour la plateforme ──
  // Le commentaire général (X.0), lui, est collecté séparément (id "comm-general-*")
  // et n'est PAS inclus ici pour éviter les doublons.
  drawer.querySelectorAll('.form-group-full textarea, textarea[placeholder*="rapport"], textarea[placeholder*="Synthèse"]').forEach(ta => {
    if (ta.id && ta.id.startsWith('comm-general-')) return; // exclu : géré séparément
    const val = ta.value.trim();
    if (val) data.commentaires.push(val);
  });

  // ── Suivis (dyn-table id commençant par "suivi") ──
  drawer.querySelectorAll('table[id^="suivi"]').forEach(tbl => {
    tbl.querySelectorAll('tbody tr').forEach(tr => {
      const cells = tr.querySelectorAll('input, textarea');
      if (cells.length >= 2) {
        const suivi = {
          point:       cells[0]?.value?.trim() || '',
          action:      cells[1]?.value?.trim() || '',
          responsable: cells[2]?.value?.trim() || '',
          echeance:    cells[3]?.value?.trim() || '',
        };
        if (suivi.point || suivi.action) data.suivis.push(suivi);
      }
    });
  });

  // ── Constats et recommandations ──
  drawer.querySelectorAll('table[id^="const"]').forEach(tbl => {
    tbl.querySelectorAll('tbody tr').forEach(tr => {
      const inputs   = tr.querySelectorAll('input');
      const textareas = tr.querySelectorAll('textarea');
      const cr = {
        reference:       inputs[0]?.value?.trim()       || '',
        constat:         textareas[0]?.value?.trim()    || '',
        recommandation:  textareas[1]?.value?.trim()    || '',
      };
      if (cr.constat || cr.recommandation) data.constats_recommandations.push(cr);
    });
  });

  // ── Références ──
  drawer.querySelectorAll('input[placeholder*="Référence"], input[placeholder*="BCEAO"]').forEach(inp => {
    const val = inp.value.trim();
    if (val) data.references.push(val);
  });

  // ── Réviseur et date ──
  const reviseur = drawer.querySelector('input[placeholder*="réviseur"], input[placeholder*="Réviseur"]');
  const dateEl   = drawer.querySelector('input[type=date]');
  if (reviseur?.value) data.champs_libres.reviseur = reviseur.value.trim();
  if (dateEl?.value)   data.champs_libres.date     = dateEl.value;

  // ── CAMELI — scores si présents ──
  if (window._cameliScores) {
    data.cameli_scores = window._cameliScores;
  }

  // ── FIX : Tables spécifiques au volet Crédit (Tables 15 à 24) ──
  // collecterTablesCrédit() est définie dans credit_tables.js mais n'était
  // jusqu'ici jamais appelée : les données saisies dans les tableaux gros
  // épargnants, ressources, production de prêts, portefeuille PAR, prêts
  // dirigeants/personnel, gros risques, crédits en perte et prêts salariés
  // n'étaient donc jamais envoyées à l'API ni transmises au générateur de
  // rapport. On les fusionne ici dans "data" pour que sauvegarderVolet()
  // les inclue dans le payload envoyé à POST /volets/.
  if (blocId === 'cred' && typeof collecterTablesCrédit === 'function') {
    Object.assign(data, collecterTablesCrédit());
  }

  return data;
}

/* ════════════════════════════════════════════
   SAUVEGARDE VIA API
════════════════════════════════════════════ */

async function sauvegarderVolet(bloc) {
  const missionId = new URLSearchParams(window.location.search).get('id');
  if (!missionId) {
    showToast('⚠️ Enregistrez d\'abord la mission');
    return false;
  }

  const donnees = collecterDonneesDrawer(bloc.id);

  // Commentaire général (X.0), destiné à être injecté dans le rapport Word.
  // Calculé et attaché à bloc.commentaire_general par nouvelle_mission.js (validerBloc)
  const commentaireGeneral = bloc.commentaire_general || '';
  donnees.commentaire_general = commentaireGeneral;

  try {
    const response = await fetch(`${API_URL}/volets/`, {
      method  : 'POST',
      headers : { 'Content-Type': 'application/json' },
      body    : JSON.stringify({
        mission_id:          parseInt(missionId),
        volet_code:          bloc.id,
        volet_index:         bloc.index,
        volet_nom:           bloc.name,
        data:                donnees,
        commentaire_general: commentaireGeneral,
        est_valide:          true,
      })
    });

    const res = await response.json();
    if (response.ok) {
      return true;
    } else {
      console.error('Erreur sauvegarde volet:', res.detail);
      showToast('❌ Erreur sauvegarde: ' + res.detail);
      return false;
    }
  } catch (err) {
    console.error('Erreur réseau volet:', err);
    showToast('❌ Serveur inaccessible');
    return false;
  }
}

/* ════════════════════════════════════════════
   CHARGER UN VOLET EXISTANT
════════════════════════════════════════════ */

async function chargerVolet(missionId, voletCode) {
  try {
    const res = await fetch(`${API_URL}/volets/mission/${missionId}/${voletCode}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data?.data || null;
  } catch {
    return null;
  }
}

/* ════════════════════════════════════════════
   RESTAURER LES DONNÉES DANS LE DRAWER
════════════════════════════════════════════ */

function restaurerDonneesDrawer(savedData) {
  if (!savedData) return;
  const drawer = document.getElementById('drawer-body');
  if (!drawer) return;

  // Restaurer niveaux de risque
  if (savedData.niveaux_risque) {
    drawer.querySelectorAll('.ctrl-table tbody tr').forEach(tr => {
      const label = tr.querySelector('td:first-child')?.textContent?.trim();
      if (label && savedData.niveaux_risque[label]) {
        const radio = tr.querySelector(`input[value="${savedData.niveaux_risque[label]}"]`);
        if (radio) {
          radio.checked = true;
          tr.style.background =
            savedData.niveaux_risque[label] === 'eleve'  ? '#FEF2F2' :
            savedData.niveaux_risque[label] === 'moyen'  ? '#FFFBEB' : '#F0FDF4';
        }
      }
    });
  }

  // Restaurer évolution
  if (savedData.evolution) {
    const evolRadio = drawer.querySelector(`input[value="${savedData.evolution}"]`);
    if (evolRadio) {
      evolRadio.checked = true;
      evolRadio.closest('.radio-pill')?.classList.add('on');
    }
  }

  // Restaurer commentaires de sous-section (le commentaire général est restauré à part)
  if (savedData.commentaires?.length) {
    const textareas = Array.from(drawer.querySelectorAll('.form-group-full textarea'))
      .filter(ta => !(ta.id && ta.id.startsWith('comm-general-')));
    savedData.commentaires.forEach((val, i) => {
      if (textareas[i]) textareas[i].value = val;
    });
  }

  // Restaurer le commentaire général (X.0)
  if (savedData.commentaire_general) {
    const generalEl = drawer.querySelector('textarea[id^="comm-general-"]');
    if (generalEl) generalEl.value = savedData.commentaire_general;
  }

  // Restaurer réviseur et date
  if (savedData.champs_libres) {
    if (savedData.champs_libres.reviseur) {
      const reviseurEl = drawer.querySelector('input[placeholder*="réviseur"], input[placeholder*="Réviseur"]');
      if (reviseurEl) reviseurEl.value = savedData.champs_libres.reviseur;
    }
    if (savedData.champs_libres.date) {
      const dateEl = drawer.querySelector('input[type=date]');
      if (dateEl) dateEl.value = savedData.champs_libres.date;
    }
  }

  // Restaurer références
  if (savedData.references?.length) {
    const refInputs = drawer.querySelectorAll('input[placeholder*="Référence"], input[placeholder*="BCEAO"]');
    savedData.references.forEach((val, i) => {
      if (refInputs[i]) refInputs[i].value = val;
    });
  }
}