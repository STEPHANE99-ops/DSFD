/* ================================================
   DSFD — volets_save.js
   Collecte toutes les données d'un volet depuis
   le drawer et les sauvegarde via l'API
   ================================================ */

/* ════════════════════════════════════════════
   FIX — RESTAURATION GÉNÉRIQUE DES FORMULAIRES
   Principe : au lieu d'essayer de deviner la
   sémantique de chaque champ (fragile, incomplet),
   on capture TOUS les champs du drawer dans l'ordre
   du DOM, plus le nombre de lignes des tableaux
   extensibles ("+ Ajouter une ligne"). À la
   restauration, on reconstruit le bon nombre de
   lignes puis on réinjecte les valeurs dans le même
   ordre. Ainsi, plus aucune donnée ne disparaît.
════════════════════════════════════════════ */

// Tableaux/listes extensibles dont la dernière ligne (ou les 2 dernières)
// est une ligne "Total" à ne jamais compter comme ligne de saisie.
const GROWABLE_TOTAL_ROW_EXCLUDE = {
  'tbl-synth-organes': 1, // Table 20 — Synthèse prêts par organe
  'tbl-gros-risques':  1, // Table 22 — Gros risques
};

// Retrouve le bouton "+ Ajouter une ligne / une annexe" associé à un
// tableau ou une liste, qu'il soit son voisin direct ou que le tableau
// soit encapsulé dans un simple wrapper <div style="overflow-x:auto">.
function trouverBoutonAjout(container) {
  let btn = container.nextElementSibling;
  if (btn && btn.tagName === 'BUTTON' && btn.classList.contains('add-btn')) return btn;

  const parent = container.parentElement;
  if (parent && parent.tagName === 'DIV' && !parent.id) {
    btn = parent.nextElementSibling;
    if (btn && btn.tagName === 'BUTTON' && btn.classList.contains('add-btn')) return btn;
  }
  return null;
}

// Liste tous les conteneurs extensibles présents dans le drawer,
// avec leur bouton d'ajout associé.
function getGrowableContainers(root) {
  const out = [];
  root.querySelectorAll('table[id], div[id]').forEach(el => {
    const btn = trouverBoutonAjout(el);
    if (btn) out.push({ el, btn });
  });
  return out;
}

// Nombre de lignes de saisie actuelles d'un conteneur extensible
// (hors ligne(s) "Total" éventuelle(s)).
function getRowCount(container) {
  const exclude = GROWABLE_TOTAL_ROW_EXCLUDE[container.id] || 0;
  let rows;
  if (container.tagName === 'TABLE') {
    const tbody = container.querySelector('tbody');
    rows = tbody ? tbody.children.length : 0;
  } else {
    rows = container.children.length; // ex: .ann-list
  }
  return Math.max(0, rows - exclude);
}

// Capture l'état complet du formulaire : nombre de lignes de chaque
// tableau extensible + valeur/état de chaque champ, dans l'ordre du DOM.
function snapshotFormulaire(drawer) {
  if (!drawer) return null;

  const rowCounts = {};
  getGrowableContainers(drawer).forEach(({ el }) => {
    rowCounts[el.id] = getRowCount(el);
  });

  const champs = [];
  drawer.querySelectorAll('input, select, textarea').forEach(el => {
    if (el.type === 'radio' || el.type === 'checkbox') {
      champs.push({ t: 'bool', v: el.checked });
    } else if (el.type === 'file') {
      champs.push({ t: 'skip' }); // les fichiers ne sont pas restaurables
    } else {
      champs.push({ t: 'val', v: el.value });
    }
  });

  // Boutons "Lacune Oui/Non" : ce ne sont pas des <input>, il faut
  // capturer leur état à part.
  const lacunes = [];
  drawer.querySelectorAll('.lacune-wrap').forEach(wrap => {
    const btns = wrap.querySelectorAll('.lacune-btn');
    if (btns[0]?.classList.contains('oui'))      lacunes.push('oui');
    else if (btns[1]?.classList.contains('non')) lacunes.push('non');
    else                                          lacunes.push(null);
  });

  return { rowCounts, champs, lacunes };
}

// Recalcule les éléments visuels et les totaux qui dépendent de valeurs
// restaurées (arrière-plans des niveaux de risque, pastilles radio,
// totaux du volet Crédit, TEG, CAMELI...).
function rafraichirEtatsVisuels(drawer) {
  drawer.querySelectorAll('.ctrl-table input[type=radio]:checked').forEach(r => {
    const tr = r.closest('tr');
    if (tr) {
      tr.style.background =
        r.value === 'eleve' ? '#FEF2F2' :
        r.value === 'moyen' ? '#FFFBEB' : '#F0FDF4';
    }
  });

  drawer.querySelectorAll('.radio-pill input:checked').forEach(r => {
    r.closest('.radio-pill')?.classList.add('on');
  });

  if (typeof calcTotauxEpargnants === 'function') calcTotauxEpargnants();
  if (typeof calcPAR === 'function') calcPAR();
  if (typeof calcTotauxDirigeants === 'function') calcTotauxDirigeants();
  if (typeof calcTauxPerte === 'function') calcTauxPerte();

  if (typeof checkTEG === 'function') {
    drawer.querySelectorAll('#tbody-salaries tr').forEach(tr => {
      const tegInput = tr.querySelectorAll('input')[4];
      if (tegInput && tegInput.value) checkTEG(tegInput);
    });
  }

  if (typeof calcCameli === 'function' && typeof CAMELI_PILIERS !== 'undefined') {
    Object.keys(CAMELI_PILIERS).forEach(code => {
      if (document.getElementById('score_' + code)) calcCameli(code);
    });
  }
}

// Restaure un snapshot générique dans le drawer actuellement affiché.
function restaurerSnapshot(drawer, snap) {
  if (!drawer || !snap) return;

  // 1) Étendre les tableaux/listes au nombre de lignes sauvegardées
  getGrowableContainers(drawer).forEach(({ el, btn }) => {
    const target = (snap.rowCounts || {})[el.id] || 0;
    let guard = 0;
    while (getRowCount(el) < target && guard < 500) {
      btn.click();
      guard++;
    }
  });

  // 2) Réinjecter les valeurs, dans le même ordre DOM qu'à la sauvegarde
  const champs = snap.champs || [];
  drawer.querySelectorAll('input, select, textarea').forEach((el, i) => {
    const c = champs[i];
    if (!c) return;
    if (c.t === 'bool')      el.checked = !!c.v;
    else if (c.t === 'val')  el.value   = c.v ?? '';
    // 'skip' → fichiers, on ne touche pas
  });

  // 3) Boutons "Lacune"
  const lacunes = snap.lacunes || [];
  drawer.querySelectorAll('.lacune-wrap').forEach((wrap, i) => {
    const state = lacunes[i];
    const btns = wrap.querySelectorAll('.lacune-btn');
    btns.forEach(b => b.classList.remove('oui', 'non'));
    if (state === 'oui' && btns[0]) btns[0].classList.add('oui');
    if (state === 'non' && btns[1]) btns[1].classList.add('non');
  });

  // 4) Recalculs et styles dépendants
  rafraichirEtatsVisuels(drawer);
}

/* ════════════════════════════════════════════
   COLLECTE DES DONNÉES DU DRAWER
════════════════════════════════════════════ */

function collecterDonneesDrawer(blocId) {
  const drawer = document.getElementById('drawer-body');
  if (!drawer) return {};

  const data = {
    bloc_id:     blocId,
    timestamp:   new Date().toISOString(),
    niveaux_risque: {},
    evolution: null,
    commentaires: [],
    activites: [],
    suivis: [],
    constats_recommandations: [],
    references: [],
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

  // ── Commentaires de sous-section ──
  drawer.querySelectorAll('.form-group-full textarea, textarea[placeholder*="rapport"], textarea[placeholder*="Synthèse"]').forEach(ta => {
    if (ta.id && ta.id.startsWith('comm-general-')) return;
    const val = ta.value.trim();
    if (val) data.commentaires.push(val);
  });

  // ── Suivis ──
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

  // ── Tables spécifiques au volet Crédit (Tables 15 à 24) ──
  if (blocId === 'cred' && typeof collecterTablesCrédit === 'function') {
    Object.assign(data, collecterTablesCrédit());
  }

  // FIX : la matrice Ressources est désormais rattachée au volet ÉPARGNE
  if (blocId === 'epg' && typeof collecterRessourcesEpargne === 'function') {
    Object.assign(data, collecterRessourcesEpargne());
  }

  // ── FIX : capture générique de TOUS les champs du formulaire, pour
  // permettre une restauration fidèle à la réouverture du volet.
  data._snapshot = snapshotFormulaire(drawer);

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

  const commentaireGeneral = bloc.commentaire_general || '';
  donnees.commentaire_general = commentaireGeneral;

  // FIX : identité de l'auteur, pour le journal d'activité de
  // l'interface d'administration (qui a rempli quoi, et quand).
  const _u = JSON.parse(localStorage.getItem('utilisateur') || 'null');
  const modifiePar = _u?.email || '';

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
        modifie_par:         modifiePar,
      })
    });

    const res = await response.json();
    if (response.ok) {
      // ── FIX : on met à jour le cache local immédiatement, pour que
      // rouvrir le même volet dans la foulée affiche bien les dernières
      // données, sans attendre un rechargement complet de la page.
      window._voletsCache = window._voletsCache || {};
      window._voletsCache[bloc.id] = donnees;
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
   CHARGER UN VOLET EXISTANT (usage ponctuel)
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

  // ── FIX : méthode générique — restaure absolument tout ce qui a été
  // saisi (tableaux dynamiques compris), à partir du snapshot capturé
  // lors de la sauvegarde.
  if (savedData._snapshot) {
    restaurerSnapshot(drawer, savedData._snapshot);
    return;
  }

  // ── Ancienne méthode, conservée uniquement pour les volets sauvegardés
  // AVANT ce correctif (ils n'ont pas de _snapshot). Elle ne restaure
  // qu'une partie des champs.
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

  if (savedData.evolution) {
    const evolRadio = drawer.querySelector(`input[value="${savedData.evolution}"]`);
    if (evolRadio) {
      evolRadio.checked = true;
      evolRadio.closest('.radio-pill')?.classList.add('on');
    }
  }

  if (savedData.commentaires?.length) {
    const textareas = Array.from(drawer.querySelectorAll('.form-group-full textarea'))
      .filter(ta => !(ta.id && ta.id.startsWith('comm-general-')));
    savedData.commentaires.forEach((val, i) => {
      if (textareas[i]) textareas[i].value = val;
    });
  }

  if (savedData.commentaire_general) {
    const generalEl = drawer.querySelector('textarea[id^="comm-general-"]');
    if (generalEl) generalEl.value = savedData.commentaire_general;
  }

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

  if (savedData.references?.length) {
    const refInputs = drawer.querySelectorAll('input[placeholder*="Référence"], input[placeholder*="BCEAO"]');
    savedData.references.forEach((val, i) => {
      if (refInputs[i]) refInputs[i].value = val;
    });
  }
}