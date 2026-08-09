/* ════════════════════════════════════════════
   DSFD — administration.js
   Page Administration : approbation des comptes
   + journal d'activité (remplissage des volets)
   Réservé au rôle "directeur".
════════════════════════════════════════════ */

let _activiteComplete = []; // liste brute reçue du backend, avant filtre jour

document.addEventListener('DOMContentLoaded', async () => {
  if (typeof requireAuth === 'function') await requireAuth();

  // FIX : garde d'accès côté front — l'API refuse de toute façon les
  // appels d'un autre rôle (403), mais on évite d'afficher une page
  // vide/cassée à un inspecteur ou un chef de mission.
  if (typeof getUserRole === 'function' && getUserRole() !== 'directeur') {
    document.getElementById('acces-refuse').style.display = '';
    document.getElementById('admin-body').style.display = 'none';
    return;
  }

  await Promise.all([
    chargerInscriptionsEnAttente(),
    chargerJournalActivite(),
  ]);

  const filtre = document.getElementById('filtre-jour');
  if (filtre) filtre.addEventListener('change', appliquerFiltreJour);
});

function _authHeaders() {
  return {
    'Content-Type':  'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
  };
}

function _formatDateHeure(iso) {
  if (!iso) return { date: '—', heure: '—' };
  const d = new Date(iso);
  if (isNaN(d.getTime())) return { date: '—', heure: '—' };
  return {
    date:  d.toLocaleDateString('fr-FR'),
    heure: d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
  };
}

/* ════════════════════════════════════════════
   INSCRIPTIONS EN ATTENTE
════════════════════════════════════════════ */
const LABEL_ROLE_DEMANDE = { inspecteur: 'Inspecteur', chef_mission: 'Chef de mission' };

async function chargerInscriptionsEnAttente() {
  const tbody = document.getElementById('tbody-en-attente');
  try {
    const res = await fetch(`${API_URL}/utilisateurs/admin/en-attente`, {
      headers: _authHeaders()
    });
    if (!res.ok) throw new Error();
    const data = await res.json();
    const liste = data.utilisateurs || [];

    const kpiEl = document.getElementById('kpi-en-attente');
    if (kpiEl) kpiEl.textContent = liste.length;

    if (!liste.length) {
      tbody.innerHTML = `<tr><td colspan="5" class="admin-empty">Aucune inscription en attente.</td></tr>`;
      return;
    }

    tbody.innerHTML = liste.map(u => {
      const { date } = _formatDateHeure(u.created_at);
      return `
        <tr id="row-user-${u.id}">
          <td style="font-weight:700">${u.nom || ''} ${u.prenoms || ''}</td>
          <td>${u.email || ''}</td>
          <td>${LABEL_ROLE_DEMANDE[u.role] || u.role || '—'}</td>
          <td>${date}</td>
          <td>
            <button class="btn-approuver" onclick="approuverCompte(${u.id})">
              <i class="fas fa-check"></i> Approuver
            </button>
            <button class="btn-rejeter-compte" onclick="rejeterCompte(${u.id})">
              <i class="fas fa-times"></i> Rejeter
            </button>
          </td>
        </tr>`;
    }).join('');
  } catch {
    tbody.innerHTML = `<tr><td colspan="5" class="admin-empty">❌ Erreur de chargement.</td></tr>`;
  }
}

async function approuverCompte(id) {
  const row = document.getElementById(`row-user-${id}`);
  row?.querySelectorAll('button').forEach(b => b.disabled = true);
  try {
    const res = await fetch(`${API_URL}/utilisateurs/${id}/approuver`, {
      method : 'POST',
      headers: _authHeaders(),
    });
    const data = await res.json();
    if (res.ok) {
      showToast('✅ Compte approuvé');
      row?.remove();
      const kpiEl = document.getElementById('kpi-en-attente');
      if (kpiEl) kpiEl.textContent = Math.max(0, (parseInt(kpiEl.textContent) || 1) - 1);
      if (!document.querySelectorAll('#tbody-en-attente tr').length) {
        document.getElementById('tbody-en-attente').innerHTML =
          `<tr><td colspan="5" class="admin-empty">Aucune inscription en attente.</td></tr>`;
      }
    } else {
      showToast('❌ ' + (data.detail || 'Erreur.'));
      row?.querySelectorAll('button').forEach(b => b.disabled = false);
    }
  } catch {
    showToast('❌ Serveur inaccessible.');
    row?.querySelectorAll('button').forEach(b => b.disabled = false);
  }
}

async function rejeterCompte(id) {
  if (!confirm('Rejeter cette demande d\'inscription ? La personne ne pourra pas se connecter.')) return;

  const row = document.getElementById(`row-user-${id}`);
  row?.querySelectorAll('button').forEach(b => b.disabled = true);
  try {
    const res = await fetch(`${API_URL}/utilisateurs/${id}/rejeter`, {
      method : 'POST',
      headers: _authHeaders(),
    });
    const data = await res.json();
    if (res.ok) {
      showToast('Compte rejeté');
      row?.remove();
      const kpiEl = document.getElementById('kpi-en-attente');
      if (kpiEl) kpiEl.textContent = Math.max(0, (parseInt(kpiEl.textContent) || 1) - 1);
      if (!document.querySelectorAll('#tbody-en-attente tr').length) {
        document.getElementById('tbody-en-attente').innerHTML =
          `<tr><td colspan="5" class="admin-empty">Aucune inscription en attente.</td></tr>`;
      }
    } else {
      showToast('❌ ' + (data.detail || 'Erreur.'));
      row?.querySelectorAll('button').forEach(b => b.disabled = false);
    }
  } catch {
    showToast('❌ Serveur inaccessible.');
    row?.querySelectorAll('button').forEach(b => b.disabled = false);
  }
}

/* ════════════════════════════════════════════
   JOURNAL D'ACTIVITÉ — remplissage des volets
════════════════════════════════════════════ */
async function chargerJournalActivite() {
  const tbody = document.getElementById('tbody-activite');
  try {
    const res = await fetch(`${API_URL}/volets/admin/activite?limite=200`, {
      headers: _authHeaders()
    });
    if (!res.ok) throw new Error();
    const data = await res.json();
    _activiteComplete = data.activite || [];

    calculerKpiActivite(_activiteComplete);
    renderJournalActivite(_activiteComplete);
  } catch {
    tbody.innerHTML = `<tr><td colspan="6" class="admin-empty">❌ Erreur de chargement.</td></tr>`;
  }
}

function calculerKpiActivite(liste) {
  const aujourdHui = new Date().toDateString();

  const voletsJour = liste.filter(a => {
    if (!a.derniere_modification) return false;
    return new Date(a.derniere_modification).toDateString() === aujourdHui;
  }).length;

  const septJours = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const inspecteursActifs = new Set(
    liste
      .filter(a => a.derniere_modification && new Date(a.derniere_modification).getTime() >= septJours)
      .map(a => a.modifie_par)
      .filter(Boolean)
  );

  const elJour = document.getElementById('kpi-volets-jour');
  const elInsp = document.getElementById('kpi-inspecteurs-actifs');
  if (elJour) elJour.textContent = voletsJour;
  if (elInsp) elInsp.textContent = inspecteursActifs.size;
}

function renderJournalActivite(liste) {
  const tbody = document.getElementById('tbody-activite');

  if (!liste.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="admin-empty">Aucune activité enregistrée pour le moment.</td></tr>`;
    return;
  }

  tbody.innerHTML = liste.map(a => {
    const { date, heure } = _formatDateHeure(a.derniere_modification);
    const mission = a.missions || {};
    const sfd = mission.sfd || mission.reference || '—';
    const statutHTML = a.est_valide
      ? `<span class="badge-statut valide"><i class="fas fa-check"></i> Validé</span>`
      : `<span class="badge-statut brouillon"><i class="fas fa-pen"></i> Brouillon</span>`;

    return `
      <tr>
        <td>${date}</td>
        <td>${heure}</td>
        <td>${a.modifie_par || '—'}</td>
        <td>${sfd}</td>
        <td>${a.volet_nom || a.volet_code || '—'}</td>
        <td>${statutHTML}</td>
      </tr>`;
  }).join('');
}

function appliquerFiltreJour() {
  const val = document.getElementById('filtre-jour')?.value; // "YYYY-MM-DD"
  if (!val) { renderJournalActivite(_activiteComplete); return; }

  const filtre = _activiteComplete.filter(a => {
    if (!a.derniere_modification) return false;
    // Comparaison sur la date locale (jour civil), pas l'UTC brut
    const d = new Date(a.derniere_modification);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return iso === val;
  });

  renderJournalActivite(filtre);
}

function reinitialiserFiltre() {
  const filtre = document.getElementById('filtre-jour');
  if (filtre) filtre.value = '';
  renderJournalActivite(_activiteComplete);
}