/* ════════════════════════════════════════════
   DSFD — administration.js
   Page Administration : approbation des comptes
   + journal d'activité (remplissage des volets)
   Réservé au rôle "directeur".
════════════════════════════════════════════ */

let _activiteComplete = []; // liste brute reçue du backend, avant filtre jour
let _adminUser = null;      // profil de la directrice, pour la carte "Mon profil"
let _dernierLienInvitation = null; // lien de la dernière invitation créée, pour le bouton "Copier"

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

  _adminUser = typeof _lireUtilisateurLocal === 'function'
    ? _lireUtilisateurLocal({})
    : JSON.parse(localStorage.getItem('utilisateur') || '{}');
  remplirProfilAdmin(_adminUser);

  await Promise.all([
    chargerComptesUtilisateurs(),
    chargerJournalActivite(),
  ]);

  const filtre = document.getElementById('filtre-jour');
  if (filtre) filtre.addEventListener('change', appliquerFiltreJour);

  // FIX : "Mon profil" est désormais une modale ouverte en cliquant sur
  // l'avatar/le nom en haut à droite, plutôt qu'une carte fixe dans la
  // page — libère la mise en page principale de la barre du haut.
  const ouvrirBtn = document.getElementById('btn-ouvrir-profil');
  if (ouvrirBtn) {
    ouvrirBtn.addEventListener('click', ouvrirProfilModal);
    ouvrirBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ouvrirProfilModal(); }
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') fermerProfilModal();
  });
});

function ouvrirProfilModal() {
  remplirProfilAdmin(_adminUser); // resynchronise les champs avant affichage
  document.getElementById('modal-profil-overlay')?.classList.add('open');
}

function fermerProfilModal() {
  document.getElementById('modal-profil-overlay')?.classList.remove('open');
}

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
   COMPTES UTILISATEURS — liste complète + gestion des accès
════════════════════════════════════════════ */
const LABEL_ROLE_COMPTE = { inspecteur: 'Inspecteur', chef_mission: 'Chef de mission', directeur: 'Directeur' };

const BADGE_STATUT = {
  approuve:   { texte: 'Actif',        classe: 'actif' },
  invite:     { texte: 'Invité',       classe: 'invite' },
  en_attente: { texte: 'En attente',   classe: 'attente' },
  rejete:     { texte: 'Rejeté',       classe: 'rejete' },
  desactive:  { texte: 'Désactivé',    classe: 'desactive' },
};

async function chargerComptesUtilisateurs() {
  const tbody = document.getElementById('tbody-comptes');
  try {
    const res = await fetch(`${API_URL}/utilisateurs/admin/tous`, {
      headers: _authHeaders()
    });
    if (!res.ok) throw new Error();
    const data = await res.json();
    const liste = data.utilisateurs || [];

    const actifs = liste.filter(u => (u.statut_compte || 'approuve') === 'approuve').length;
    const kpiEl = document.getElementById('kpi-comptes-actifs');
    if (kpiEl) kpiEl.textContent = actifs;

    if (!liste.length) {
      tbody.innerHTML = `<tr><td colspan="5" class="admin-empty">Aucun compte.</td></tr>`;
      return;
    }

    // Le compte actuellement connecté ne doit pas pouvoir se désactiver
    const monId = _adminUser?.id;

    tbody.innerHTML = liste.map(u => {
      const statut = u.statut_compte || 'approuve';
      const badge = BADGE_STATUT[statut] || { texte: statut, classe: 'attente' };
      const estMoi = String(u.id) === String(monId);

      let actionsHTML = '';
      if (estMoi) {
        actionsHTML = `<span style="font-size:11.5px;color:var(--text-muted)">— vous —</span>`;
      } else if (statut === 'desactive') {
        actionsHTML = `<button class="btn-approuver" onclick="reactiverCompte(${u.id})">
                          <i class="fas fa-rotate-left"></i> Réactiver
                        </button>`;
      } else if (statut === 'approuve') {
        actionsHTML = `<button class="btn-rejeter-compte" onclick="desactiverCompte(${u.id})">
                          <i class="fas fa-ban"></i> Désactiver
                        </button>`;
      } else {
        actionsHTML = `<span style="font-size:11.5px;color:var(--text-muted)">—</span>`;
      }

      return `
        <tr id="row-user-${u.id}">
          <td style="font-weight:700">${u.nom || ''} ${u.prenoms || ''}</td>
          <td>${u.email || ''}</td>
          <td>${LABEL_ROLE_COMPTE[u.role] || u.role || '—'}</td>
          <td><span class="badge-statut ${badge.classe}">${badge.texte}</span></td>
          <td>${actionsHTML}</td>
        </tr>`;
    }).join('');
  } catch {
    tbody.innerHTML = `<tr><td colspan="5" class="admin-empty">❌ Erreur de chargement.</td></tr>`;
  }
}

async function desactiverCompte(id) {
  if (!confirm('Désactiver l\'accès de ce compte ? La personne ne pourra plus se connecter.')) return;

  const row = document.getElementById(`row-user-${id}`);
  row?.querySelectorAll('button').forEach(b => b.disabled = true);
  try {
    const res = await fetch(`${API_URL}/utilisateurs/${id}/desactiver`, {
      method : 'POST',
      headers: _authHeaders(),
    });
    const data = await res.json();
    if (res.ok) {
      showToast('Accès désactivé');
      chargerComptesUtilisateurs();
    } else {
      showToast('❌ ' + (data.detail || 'Erreur.'));
      row?.querySelectorAll('button').forEach(b => b.disabled = false);
    }
  } catch {
    showToast('❌ Serveur inaccessible.');
    row?.querySelectorAll('button').forEach(b => b.disabled = false);
  }
}

async function reactiverCompte(id) {
  const row = document.getElementById(`row-user-${id}`);
  row?.querySelectorAll('button').forEach(b => b.disabled = true);
  try {
    const res = await fetch(`${API_URL}/utilisateurs/${id}/reactiver`, {
      method : 'POST',
      headers: _authHeaders(),
    });
    const data = await res.json();
    if (res.ok) {
      showToast('✅ Accès réactivé');
      chargerComptesUtilisateurs();
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

/* ════════════════════════════════════════════
   MON PROFIL — carte dédiée dans Administration.html
   (la directrice ne quitte jamais cette page)
════════════════════════════════════════════ */
function remplirProfilAdmin(u) {
  if (!u) return;

  const initiales = ((u.nom?.[0] || '') + (u.prenoms?.[0] || '')).toUpperCase();
  const avatarEl = document.getElementById('profil-avatar-big');
  if (avatarEl) {
    if (u.photo) {
      avatarEl.innerHTML = `<img src="${u.photo}" alt="Photo de profil"
        style="width:100%;height:100%;object-fit:cover"/>`;
    } else {
      avatarEl.textContent = initiales || '?';
    }
  }

  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val || '';
  };
  setVal('admin-input-nom', u.nom);
  setVal('admin-input-prenoms', u.prenoms);
  setVal('admin-input-tel', u.telephone);
}

async function enregistrerProfilAdmin() {
  if (!_adminUser?.id) return;

  const nom     = document.getElementById('admin-input-nom')?.value.trim();
  const prenoms = document.getElementById('admin-input-prenoms')?.value.trim();
  const tel     = document.getElementById('admin-input-tel')?.value.trim();
  const msgEl   = document.getElementById('profil-admin-msg');

  const message = (txt, ok) => {
    if (msgEl) {
      msgEl.textContent = txt;
      msgEl.style.color = ok ? '#16A34A' : '#DC2626';
      setTimeout(() => { msgEl.textContent = ''; }, 5000);
    }
  };

  if (!nom || !prenoms) {
    message('⚠️ Nom et prénoms sont obligatoires.', false);
    return;
  }

  const payload = { nom, prenoms };
  if (tel) payload.telephone = tel;

  try {
    const res = await fetch(`${API_URL}/utilisateurs/${_adminUser.id}`, {
      method : 'PUT',
      headers: _authHeaders(),
      body   : JSON.stringify(payload),
    });
    const data = await res.json();

    if (res.ok) {
      _adminUser = { ..._adminUser, ...payload };
      localStorage.setItem('utilisateur', JSON.stringify(_adminUser));
      remplirProfilAdmin(_adminUser);
      if (typeof afficherUtilisateur === 'function') afficherUtilisateur();
      message('✅ Profil mis à jour.', true);
    } else {
      message('❌ ' + (data.detail || 'Erreur lors de la modification.'), false);
    }
  } catch {
    message('❌ Serveur inaccessible.', false);
  }
}

function changerPhotoAdmin(input) {
  const file = input.files && input.files[0];
  if (!file) return;

  const msgEl = document.getElementById('profil-admin-msg');
  const message = (txt, ok) => {
    if (msgEl) {
      msgEl.textContent = txt;
      msgEl.style.color = ok ? '#16A34A' : '#DC2626';
      setTimeout(() => { msgEl.textContent = ''; }, 5000);
    }
  };

  if (!file.type.startsWith('image/')) {
    message('⚠️ Veuillez choisir une image.', false);
    return;
  }

  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = async () => {
      // Recadrage carré centré + redimensionnement à 256px, pour rester léger
      const TAILLE = 256;
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = TAILLE;
      const ctx  = canvas.getContext('2d');
      const cote = Math.min(img.width, img.height);
      const sx   = (img.width  - cote) / 2;
      const sy   = (img.height - cote) / 2;
      ctx.drawImage(img, sx, sy, cote, cote, 0, 0, TAILLE, TAILLE);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

      try {
        const res = await fetch(`${API_URL}/utilisateurs/${_adminUser.id}`, {
          method : 'PUT',
          headers: _authHeaders(),
          body   : JSON.stringify({ photo: dataUrl }),
        });
        const data = await res.json();
        if (res.ok) {
          _adminUser.photo = dataUrl;
          localStorage.setItem('utilisateur', JSON.stringify(_adminUser));
          remplirProfilAdmin(_adminUser);
          if (typeof afficherUtilisateur === 'function') afficherUtilisateur();
          message('✅ Photo mise à jour.', true);
        } else {
          message('❌ ' + (data.detail || 'Erreur lors de la mise à jour.'), false);
        }
      } catch {
        message('❌ Serveur inaccessible.', false);
      }
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
  input.value = '';
}

/* ════════════════════════════════════════════
   CRÉER UN COMPTE UTILISATEUR
   (remplace l'inscription publique, désactivée)
════════════════════════════════════════════ */
async function inviterUtilisateur() {
  const nom     = document.getElementById('invite-nom')?.value.trim();
  const prenoms = document.getElementById('invite-prenoms')?.value.trim();
  const email   = document.getElementById('invite-email')?.value.trim();
  const role    = document.getElementById('invite-role')?.value;
  const btn     = document.getElementById('btn-inviter');
  const msgEl   = document.getElementById('invite-msg');

  const message = (txt, ok) => {
    if (msgEl) {
      msgEl.textContent = txt;
      msgEl.style.color = ok ? '#16A34A' : '#DC2626';
    }
  };

  if (!nom || !prenoms || !email || !role) {
    message('⚠️ Tous les champs sont obligatoires.', false);
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    message('⚠️ Adresse email invalide.', false);
    return;
  }

  btn.disabled = true;
  message('Envoi en cours…', true);

  try {
    const res = await fetch(`${API_URL}/utilisateurs/inviter`, {
      method : 'POST',
      headers: _authHeaders(),
      body   : JSON.stringify({ nom, prenoms, email, role }),
    });
    const data = await res.json();

    if (res.ok) {
      _dernierLienInvitation = data.lien_invitation || null;
      document.getElementById('form-inviter').reset();
      showToast('Invitation créée');
      chargerComptesUtilisateurs();

      if (msgEl) {
        if (_dernierLienInvitation) {
          // FIX : le lien est toujours affiché avec un bouton "Copier" — la
          // directrice peut le transmettre elle-même (WhatsApp, SMS…) tant
          // que l'envoi automatique d'email est limité (mode test Resend,
          // pas encore de domaine vérifié), et ça reste utile ensuite comme
          // solution de secours si l'email échoue ponctuellement.
          msgEl.innerHTML = `✅ ${data.message} <button type="button" class="btn-secondary" style="margin-left:8px;padding:4px 10px" onclick="copierLienInvitation()"><i class="fas fa-copy"></i> Copier le lien</button>`;
          msgEl.style.color = '#16A34A';
        } else {
          message('✅ ' + data.message, true);
        }
      }
    } else {
      message('❌ ' + (data.detail || 'Erreur lors de la création du compte.'), false);
    }
  } catch {
    message('❌ Serveur inaccessible.', false);
  } finally {
    btn.disabled = false;
  }
}

function copierLienInvitation() {
  if (!_dernierLienInvitation) return;
  navigator.clipboard.writeText(_dernierLienInvitation).then(() => {
    showToast('Lien copié dans le presse-papiers');
  }).catch(() => {
    // Repli si l'API presse-papiers est indisponible (ancien navigateur,
    // contexte non sécurisé) : affiche le lien pour copie manuelle.
    prompt('Copiez ce lien :', _dernierLienInvitation);
  });
}