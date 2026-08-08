/* ════════════════════════════════════════════
   DSFD — profil.js
   Page « Mon profil » : affichage et modification
   des informations personnelles + mot de passe
════════════════════════════════════════════ */

let _profilUser = null;

/* ── Chargement initial ─────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {
  // Protège la page et revalide la session
  if (typeof requireAuth === 'function') await requireAuth();

  await chargerProfil();
  initNavProfil();
});

async function chargerProfil() {
  const token = localStorage.getItem('token');

  // 1) Affichage immédiat depuis le localStorage
  _profilUser = JSON.parse(localStorage.getItem('utilisateur') || 'null');
  if (_profilUser) remplirProfil(_profilUser);

  // 2) Rafraîchissement depuis le backend (données à jour)
  try {
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      _profilUser = data.utilisateur;
      localStorage.setItem('utilisateur', JSON.stringify(_profilUser));
      remplirProfil(_profilUser);
      if (typeof afficherUtilisateur === 'function') afficherUtilisateur();
    }
  } catch (e) {
    console.error('Erreur chargement profil :', e);
  }
}

function remplirProfil(u) {
  if (!u) return;

  const initiales = ((u.nom?.[0] || '') + (u.prenoms?.[0] || '')).toUpperCase();

  const avatarBig = document.getElementById('avatar-big');
  const fullname  = document.getElementById('profil-fullname');
  const emailEl   = document.getElementById('profil-email');

  if (avatarBig) avatarBig.textContent = initiales || '?';
  if (fullname)  fullname.textContent  = `${u.nom || ''} ${u.prenoms || ''}`.trim();
  if (emailEl)   emailEl.textContent   = u.email || '';

  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val || '';
  };
  set('input-nom',       u.nom);
  set('input-prenom',    u.prenoms);
  set('input-email',     u.email);
  set('input-tel',       u.telephone);
  set('input-fonction',  u.fonction);
  set('input-structure', u.structure);
}

/* ── Navigation latérale du profil ──────────── */
function initNavProfil() {
  document.querySelectorAll('.profil-nav').forEach(link => {
    link.addEventListener('click', function () {
      document.querySelectorAll('.profil-nav').forEach(l => l.classList.remove('active'));
      this.classList.add('active');
    });
  });
}

/* ── Messages inline ────────────────────────── */
function afficherMessage(apresElementId, texte, ok) {
  let msg = document.getElementById(apresElementId + '-msg');
  if (!msg) {
    msg = document.createElement('p');
    msg.id = apresElementId + '-msg';
    msg.style.cssText = 'margin-top:10px;font-size:13px;font-weight:600';
    const card = document.getElementById(apresElementId);
    if (card) card.appendChild(msg);
  }
  msg.textContent = texte;
  msg.style.color = ok ? '#16A34A' : '#DC2626';
  setTimeout(() => { if (msg) msg.textContent = ''; }, 5000);
}

/* ── Enregistrer les informations ───────────── */
async function saveInfos() {
  if (!_profilUser?.id) {
    afficherMessage('infos', '❌ Session invalide, reconnectez-vous.', false);
    return;
  }

  const nom     = document.getElementById('input-nom')?.value.trim();
  const prenoms = document.getElementById('input-prenom')?.value.trim();
  const email   = document.getElementById('input-email')?.value.trim();

  if (!nom || !prenoms || !email) {
    afficherMessage('infos', '⚠️ Nom, prénom et email sont obligatoires.', false);
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    afficherMessage('infos', '⚠️ Adresse email invalide.', false);
    return;
  }

  // Champs optionnels : envoyés uniquement s'ils sont renseignés
  // (évite une erreur si les colonnes n'existent pas encore en base)
  const payload = { nom, prenoms, email };
  const tel       = document.getElementById('input-tel')?.value.trim();
  const fonction  = document.getElementById('input-fonction')?.value.trim();
  const structure = document.getElementById('input-structure')?.value.trim();
  if (tel)       payload.telephone = tel;
  if (fonction)  payload.fonction  = fonction;
  if (structure) payload.structure = structure;

  try {
    const res = await fetch(`${API_URL}/utilisateurs/${_profilUser.id}`, {
      method : 'PUT',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (res.ok) {
      // Mettre à jour la session locale et tous les affichages
      _profilUser = { ..._profilUser, ...payload };
      localStorage.setItem('utilisateur', JSON.stringify(_profilUser));
      remplirProfil(_profilUser);
      if (typeof afficherUtilisateur === 'function') afficherUtilisateur();
      afficherMessage('infos', '✅ Informations enregistrées.', true);
    } else {
      afficherMessage('infos', '❌ ' + (data.detail || 'Erreur lors de la modification.'), false);
    }
  } catch {
    afficherMessage('infos', '❌ Serveur inaccessible.', false);
  }
}

/* ── Changer le mot de passe ────────────────── */
async function savePw() {
  const actuel  = document.getElementById('input-pw-actuel')?.value;
  const nouveau = document.getElementById('input-pw-new')?.value;
  const confirm = document.getElementById('input-pw-confirm')?.value;
  const msgEl   = document.getElementById('pw-message');

  const message = (txt, ok) => {
    if (msgEl) {
      msgEl.textContent = txt;
      msgEl.style.color = ok ? '#16A34A' : '#DC2626';
    }
  };

  if (!actuel || !nouveau || !confirm) {
    message('⚠️ Veuillez remplir les trois champs.', false);
    return;
  }
  if (nouveau.length < 8) {
    message('⚠️ Le nouveau mot de passe doit contenir au moins 8 caractères.', false);
    return;
  }
  if (nouveau !== confirm) {
    message('⚠️ La confirmation ne correspond pas au nouveau mot de passe.', false);
    return;
  }
  if (nouveau === actuel) {
    message('⚠️ Le nouveau mot de passe doit être différent de l\'actuel.', false);
    return;
  }

  try {
    const res = await fetch(`${API_URL}/auth/changer-mot-de-passe`, {
      method : 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        mot_de_passe_actuel: actuel,
        nouveau_mot_de_passe: nouveau
      })
    });
    const data = await res.json();

    if (res.ok) {
      message('✅ Mot de passe modifié avec succès.', true);
      document.getElementById('input-pw-actuel').value  = '';
      document.getElementById('input-pw-new').value     = '';
      document.getElementById('input-pw-confirm').value = '';
    } else {
      message('❌ ' + (data.detail || 'Erreur lors du changement de mot de passe.'), false);
    }
  } catch {
    message('❌ Serveur inaccessible.', false);
  }
}