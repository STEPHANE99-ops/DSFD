/* ================================================
   DSFD — credit_tables.js
   Formulaires de saisie pour les tables crédit
   du canevas (Tables 15 à 24)
   À intégrer dans nouvelle_mission.js
   dans la fonction buildCredit()
   ================================================ */

/* ════════════════════════════════════════════
   GÉNÉRATEUR HTML — Tables crédit
   Appelé depuis buildCredit() après les sections
   existantes 4.1 à 4.5
════════════════════════════════════════════ */

/* ════════════════════════════════════════════
   MATRICE RESSOURCES — déplacée au volet ÉPARGNE
   (observation : cette matrice relève des
   indicateurs de l'épargne, pas du crédit)
════════════════════════════════════════════ */
function buildRessourcesEpargne() {
  return `
    <!-- ══════════════════════════════════════
         TABLE 16 — Ressources
    ══════════════════════════════════════ -->
    <div class="sub-title" style="margin-top:32px">
      <i class="fas fa-database"></i> Tableau — Ressources (F CFA)
    </div>
    <p style="font-size:12px;color:var(--text-muted);margin-bottom:10px">
      Renseignez les montants pour les périodes contrôlées (la période 4 est facultative).
    </p>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:12px">
      <div class="form-group-full"><label>Période 1</label><input type="text" id="res-periode1" placeholder="Ex : 31/12/2022"/></div>
      <div class="form-group-full"><label>Période 2</label><input type="text" id="res-periode2" placeholder="Ex : 31/12/2023"/></div>
      <div class="form-group-full"><label>Période 3</label><input type="text" id="res-periode3" placeholder="Ex : 31/12/2024"/></div>
      <div class="form-group-full"><label>Période 4 <span style="font-weight:400;color:var(--text-muted)">(facultatif)</span></label><input type="text" id="res-periode4" placeholder="Optionnel"/></div>
    </div>
    <div style="overflow-x:auto">
      <table class="dyn-table" id="tbl-ressources">
        <thead>
          <tr>
            <th>Ressources</th>
            <th style="width:150px">Période 1 (F CFA)</th>
            <th style="width:150px">Période 2 (F CFA)</th>
            <th style="width:150px">Période 3 (F CFA)</th>
            <th style="width:150px">Période 4 (F CFA)</th>
          </tr>
        </thead>
        <tbody>
          ${[
            ['res-inst-fin', 'Ressources des institutions financières'],
            ['res-cpt-ord-cred', 'Comptes ordinaires créditeurs'],
            ['res-dat', 'Dépôts à terme'],
            ['res-dep-gar', 'Dépôts de garantie reçus'],
            ['res-emprunts', 'Emprunts'],
            ['res-dep-membres', 'Dépôts des membres/clients'],
            ['res-cpt-ord-membres', 'Comptes ordinaires créditeurs (membres)'],
            ['res-dat-recus', 'DAT reçus'],
            ['res-epargne-spec', "Comptes d'épargne à régime spécial"],
            ['res-dep-gar2', 'Dépôts de garantie'],
            ['res-autres', 'Autres sommes dues'],
          ].map(([id, label]) => `
          <tr>
            <td>${label}</td>
            <td><input type="text" id="${id}-p1" placeholder="0" style="width:100%;text-align:right"/></td>
            <td><input type="text" id="${id}-p2" placeholder="0" style="width:100%;text-align:right"/></td>
            <td><input type="text" id="${id}-p3" placeholder="0" style="width:100%;text-align:right"/></td>
            <td><input type="text" id="${id}-p4" placeholder="0" style="width:100%;text-align:right"/></td>
          </tr>`).join('')}
          <tr style="background:#F8FAFC;font-weight:700">
            <td>Total</td>
            <td><input type="text" id="res-total-p1" placeholder="0" style="width:100%;text-align:right;font-weight:700"/></td>
            <td><input type="text" id="res-total-p2" placeholder="0" style="width:100%;text-align:right;font-weight:700"/></td>
            <td><input type="text" id="res-total-p3" placeholder="0" style="width:100%;text-align:right;font-weight:700"/></td>
            <td><input type="text" id="res-total-p4" placeholder="0" style="width:100%;text-align:right;font-weight:700"/></td>
          </tr>
        </tbody>
      </table>
    </div>

  `;
}

function buildCreditTables(g) {
  return `

    <!-- ══════════════════════════════════════
         TABLE 17 — Production de prêts
    ══════════════════════════════════════ -->
    <div class="sub-title" style="margin-top:32px">
      <i class="fas fa-chart-line"></i> Tableau — Production de prêts
    </div>
    <div style="overflow-x:auto">
      <table class="dyn-table" id="tbl-production-prets">
        <thead>
          <tr>
            <th>Rubriques</th>
            <th style="width:150px">Période 1</th>
            <th style="width:150px">Période 2</th>
            <th style="width:150px">Période 3</th>
            <th style="width:150px">Période 4</th>
          </tr>
        </thead>
        <tbody>
          ${[
            ['prod-nb-prets', 'Nombre de prêts octroyés (a)'],
            ['prod-nb-mois', "Nombre de mois d'exercice (b)"],
            ['prod-moy-prets', 'Nombre moyen des prêts octroyés par mois (i) = (a)/(b)', true],
            ['prod-montant', 'Production de prêts (c) (F CFA)'],
            ['prod-moy-montant', 'Production moyenne de prêts par mois (ii) = (c)/(b)', true],
            ['prod-evol', 'Évolution de la production des prêts par mois (%)'],
            ['prod-var', 'Variation du nombre moyen de la production par mois (%)'],
          ].map(([id, label, calc]) => `
          <tr${calc ? ' style="background:#F0FDF4"' : ''}>
            <td>${label}${calc ? ' <span style="font-size:10px;color:#16A34A">(calculé)</span>' : ''}</td>
            <td><input type="text" id="${id}-p1" placeholder="0" style="width:100%;text-align:right"${calc ? ' readonly' : ''}/></td>
            <td><input type="text" id="${id}-p2" placeholder="0" style="width:100%;text-align:right"${calc ? ' readonly' : ''}/></td>
            <td><input type="text" id="${id}-p3" placeholder="0" style="width:100%;text-align:right"${calc ? ' readonly' : ''}/></td>
            <td><input type="text" id="${id}-p4" placeholder="0" style="width:100%;text-align:right"${calc ? ' readonly' : ''}/></td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>

    <!-- ══════════════════════════════════════
         TABLE 18 — Portefeuille de crédits
    ══════════════════════════════════════ -->
    <div class="sub-title" style="margin-top:32px">
      <i class="fas fa-hand-holding-usd"></i> Tableau — Portefeuille de crédits (PAR)
    </div>
    <div style="overflow-x:auto">
      <table class="dyn-table" id="tbl-portefeuille">
        <thead>
          <tr>
            <th>Libellés</th>
            <th style="width:100px">Quantité</th>
            <th style="width:80px">Taux (%)</th>
            <th style="width:130px">Valeur (F CFA)</th>
            <th style="width:80px">Taux (%)</th>
            <th style="width:120px">Indicateur</th>
          </tr>
        </thead>
        <tbody>
          ${[
            ['port-brut',      'Encours bruts de crédits (a+b)', false, true],
            ['port-sains',     'Crédits sains (a)', false, false],
            ['port-0j',        '0 jour de retard', false, false],
            ['port-1-30j',     '1 à 30 jours de retard', false, false],
            ['port-31-60j',    '31 à 60 jours de retard', false, false],
            ['port-61-90j',    '61 à 90 jours de retard', false, false],
            ['port-souffrance','Créances en souffrance (b)', false, true],
            ['port-3-6m',      'Plus 3 à 6 mois au plus', false, false],
            ['port-6-12m',     'Plus 6 à 12 mois au plus', false, false],
            ['port-12-24m',    'Plus 12 à 24 mois au plus', false, false],
          ].map(([id, label, calc, bold]) => `
          <tr${bold ? ' style="background:#F8FAFC;font-weight:700"' : ''}>
            <td>${label}</td>
            <td><input type="text" id="${id}-qte" placeholder="0" style="width:100%;text-align:right" oninput="calcPAR()"/></td>
            <td><input type="text" id="${id}-taux" placeholder="0,00" style="width:100%;text-align:right" readonly/></td>
            <td><input type="text" id="${id}-val" placeholder="0" style="width:100%;text-align:right" oninput="calcPAR()"/></td>
            <td><input type="text" id="${id}-tvl" placeholder="0,00" style="width:100%;text-align:right" readonly/></td>
            <td id="${id}-ind" style="text-align:center;font-weight:700;font-size:12px;color:#6B7280">—</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
    <div style="display:flex;gap:16px;margin-top:10px">
      <div style="background:#EFF6FF;border:1.5px solid #BFDBFE;border-radius:8px;padding:10px 16px;font-size:13px">
        <span style="font-weight:700;color:#1D4ED8">PAR 30 = </span>
        <span id="par30-result" style="font-weight:800;color:#1D4ED8;font-size:16px">—</span>
      </div>
      <div style="background:#FEF2F2;border:1.5px solid #FCA5A5;border-radius:8px;padding:10px 16px;font-size:13px">
        <span style="font-weight:700;color:#DC2626">PAR 90 = </span>
        <span id="par90-result" style="font-weight:800;color:#DC2626;font-size:16px">—</span>
      </div>
    </div>

    <!-- ══════════════════════════════════════
         TABLE 19 — Prêts aux dirigeants
    ══════════════════════════════════════ -->
    <div class="sub-title" style="margin-top:32px">
      <i class="fas fa-user-tie"></i> Tableau — Prêts aux dirigeants
    </div>
    <div style="overflow-x:auto">
      <table class="dyn-table" id="tbl-prets-dirigeants">
        <thead>
          <tr>
            <th style="width:40px">N°</th>
            <th>Titulaire</th>
            <th>Fonction</th>
            <th style="width:130px">Montant initial (F CFA)</th>
            <th style="width:130px">Montant restant (F CFA)</th>
            <th style="width:120px">Épargne nantie (F CFA)</th>
            <th style="width:110px">Risque réel (F CFA)</th>
            <th style="width:100px">Retard (jours)</th>
          </tr>
        </thead>
        <tbody id="tbody-dirigeants">
          ${[1,2,3,4,5,6,7,8,9].map(n => `
          <tr>
            <td style="text-align:center">${n}</td>
            <td><input type="text" placeholder="Nom…" style="width:100%"/></td>
            <td><input type="text" placeholder="Fonction…" style="width:100%"/></td>
            <td><input type="text" placeholder="0" style="width:100%;text-align:right" oninput="calcTotauxDirigeants()"/></td>
            <td><input type="text" placeholder="0" style="width:100%;text-align:right" oninput="calcTotauxDirigeants()"/></td>
            <td><input type="text" placeholder="0" style="width:100%;text-align:right" oninput="calcTotauxDirigeants()"/></td>
            <td><input type="text" placeholder="0" style="width:100%;text-align:right" readonly/></td>
            <td><input type="text" placeholder="0" style="width:100%;text-align:right"/></td>
          </tr>`).join('')}
          <tr style="background:#F8FAFC;font-weight:700">
            <td colspan="3" style="text-align:right">TOTAL</td>
            <td><input type="text" id="total-dir-initial" readonly style="width:100%;text-align:right;font-weight:700"/></td>
            <td><input type="text" id="total-dir-restant" readonly style="width:100%;text-align:right;font-weight:700"/></td>
            <td><input type="text" id="total-dir-epargne" readonly style="width:100%;text-align:right;font-weight:700"/></td>
            <td><input type="text" id="total-dir-risque"  readonly style="width:100%;text-align:right;font-weight:700"/></td>
            <td></td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ══════════════════════════════════════
         TABLE 20 — Synthèse prêts par organe
    ══════════════════════════════════════ -->
    <div class="sub-title" style="margin-top:32px">
      <i class="fas fa-sitemap"></i> Tableau — Synthèse prêts par organe
    </div>
    <div style="overflow-x:auto">
      <table class="dyn-table" id="tbl-synth-organes">
        <thead>
          <tr>
            <th>Emprunteurs</th>
            <th>Organes</th>
            <th style="width:130px">Montant initial (F CFA)</th>
            <th style="width:130px">Montant restant (F CFA)</th>
            <th style="width:120px">Épargne nantie (F CFA)</th>
            <th style="width:110px">Risque réel (F CFA)</th>
            <th style="width:100px">Retard (jours)</th>
          </tr>
        </thead>
        <tbody id="tbody-organes">
          <tr>
            <td><input type="text" placeholder="Ex : Membres CA" style="width:100%"/></td>
            <td>
              <select style="width:100%;padding:6px;border:1.5px solid var(--border);border-radius:6px">
                <option value="">-- Sélectionner --</option>
                <option>Conseil d'Administration</option>
                <option>Comité de Crédit</option>
                <option>Conseil de Surveillance</option>
                <option>Direction Générale</option>
                <option>Personnel</option>
              </select>
            </td>
            <td><input type="text" placeholder="0" style="width:100%;text-align:right"/></td>
            <td><input type="text" placeholder="0" style="width:100%;text-align:right"/></td>
            <td><input type="text" placeholder="0" style="width:100%;text-align:right"/></td>
            <td><input type="text" placeholder="0" style="width:100%;text-align:right"/></td>
            <td><input type="text" placeholder="0" style="width:100%;text-align:right"/></td>
          </tr>
          <tr style="background:#F8FAFC;font-weight:700">
            <td colspan="2" style="text-align:right">Total</td>
            <td><input type="text" readonly placeholder="0" style="width:100%;text-align:right;font-weight:700"/></td>
            <td><input type="text" readonly placeholder="0" style="width:100%;text-align:right;font-weight:700"/></td>
            <td><input type="text" readonly placeholder="0" style="width:100%;text-align:right;font-weight:700"/></td>
            <td><input type="text" readonly placeholder="0" style="width:100%;text-align:right;font-weight:700"/></td>
            <td></td>
          </tr>
        </tbody>
      </table>
    </div>
    <button class="add-btn" onclick="ajouterLigneOrgane()">
      <i class="fas fa-plus"></i> Ajouter une ligne
    </button>

    <!-- ══════════════════════════════════════
         TABLE 21 — Prêts au personnel
    ══════════════════════════════════════ -->
    <div class="sub-title" style="margin-top:32px">
      <i class="fas fa-users"></i> Tableau — Prêts au personnel
    </div>
    <div style="overflow-x:auto">
      <table class="dyn-table" id="tbl-prets-personnel">
        <thead>
          <tr>
            <th style="width:40px">N°</th>
            <th>Emprunteurs</th>
            <th>Fonction</th>
            <th style="width:130px">Montant initial (F CFA)</th>
            <th style="width:130px">Montant restant (F CFA)</th>
            <th style="width:120px">Épargne nantie (F CFA)</th>
            <th style="width:110px">Risque réel (F CFA)</th>
            <th style="width:100px">Retard (jours)</th>
          </tr>
        </thead>
        <tbody id="tbody-personnel">
          ${[1,2,3,4,5,6,7].map(n => `
          <tr>
            <td style="text-align:center">${n}</td>
            <td><input type="text" placeholder="Nom…" style="width:100%"/></td>
            <td><input type="text" placeholder="Fonction…" style="width:100%"/></td>
            <td><input type="text" placeholder="0" style="width:100%;text-align:right"/></td>
            <td><input type="text" placeholder="0" style="width:100%;text-align:right"/></td>
            <td><input type="text" placeholder="0" style="width:100%;text-align:right"/></td>
            <td><input type="text" placeholder="0" style="width:100%;text-align:right" readonly/></td>
            <td><input type="text" placeholder="0" style="width:100%;text-align:right"/></td>
          </tr>`).join('')}
          <tr style="background:#F8FAFC;font-weight:700">
            <td colspan="3" style="text-align:right">TOTAL</td>
            <td><input type="text" readonly style="width:100%;text-align:right;font-weight:700"/></td>
            <td><input type="text" readonly style="width:100%;text-align:right;font-weight:700"/></td>
            <td><input type="text" readonly style="width:100%;text-align:right;font-weight:700"/></td>
            <td><input type="text" readonly style="width:100%;text-align:right;font-weight:700"/></td>
            <td></td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ══════════════════════════════════════
         TABLE 22 — Gros risques
    ══════════════════════════════════════ -->
    <div class="sub-title" style="margin-top:32px">
      <i class="fas fa-exclamation-circle"></i> Tableau — Gros risques
    </div>
    <p style="font-size:12px;color:var(--text-muted);margin-bottom:10px">
      Emprunteurs dont l'encours représente plus de 5% des fonds propres nets.
    </p>
    <div style="overflow-x:auto">
      <table class="dyn-table" id="tbl-gros-risques">
        <thead>
          <tr>
            <th>Emprunteurs</th>
            <th style="width:130px">Montant initial (F CFA)</th>
            <th style="width:130px">Montant restant (F CFA)</th>
            <th style="width:120px">Épargne nantie (F CFA)</th>
            <th style="width:110px">Risque réel (F CFA)</th>
            <th style="width:100px">Jours de retard</th>
          </tr>
        </thead>
        <tbody id="tbody-gros-risques">
          ${[1,2,3,4,5,6,7,8,9,10].map(n => `
          <tr>
            <td><input type="text" placeholder="Emprunteur ${n}…" style="width:100%"/></td>
            <td><input type="text" placeholder="0" style="width:100%;text-align:right"/></td>
            <td><input type="text" placeholder="0" style="width:100%;text-align:right"/></td>
            <td><input type="text" placeholder="0" style="width:100%;text-align:right"/></td>
            <td><input type="text" placeholder="0" style="width:100%;text-align:right" readonly/></td>
            <td><input type="text" placeholder="0" style="width:100%;text-align:right"/></td>
          </tr>`).join('')}
          <tr style="background:#F8FAFC;font-weight:700">
            <td style="text-align:right">Total</td>
            <td><input type="text" readonly style="width:100%;text-align:right;font-weight:700"/></td>
            <td><input type="text" readonly style="width:100%;text-align:right;font-weight:700"/></td>
            <td><input type="text" readonly style="width:100%;text-align:right;font-weight:700"/></td>
            <td><input type="text" readonly style="width:100%;text-align:right;font-weight:700"/></td>
            <td></td>
          </tr>
        </tbody>
      </table>
    </div>
    <button class="add-btn" onclick="addRow('tbl-gros-risques','<td><input type=text placeholder=Emprunteur… style=width:100%/></td><td><input type=text placeholder=0 style=width:100%;text-align:right/></td><td><input type=text placeholder=0 style=width:100%;text-align:right/></td><td><input type=text placeholder=0 style=width:100%;text-align:right/></td><td><input type=text placeholder=0 style=width:100%;text-align:right readonly/></td><td><input type=text placeholder=0 style=width:100%;text-align:right/></td>')">
      <i class="fas fa-plus"></i> Ajouter une ligne
    </button>

    <!-- ══════════════════════════════════════
         TABLE 23 — Crédits virés en perte
    ══════════════════════════════════════ -->
    <div class="sub-title" style="margin-top:32px">
      <i class="fas fa-times-circle"></i> Tableau — Crédits virés en perte
    </div>
    <div style="overflow-x:auto">
      <table class="dyn-table" id="tbl-credits-perte">
        <thead>
          <tr>
            <th>Rubriques</th>
            <th style="width:150px">Période 1</th>
            <th style="width:150px">Période 2</th>
            <th style="width:150px">Période 3</th>
            <th style="width:150px">Période 4</th>
          </tr>
        </thead>
        <tbody>
          ${[
            ['perte-nb',    'Nombre de crédits virés en perte'],
            ['perte-mnt',   'Montant des crédits virés en perte (a) (F CFA)'],
            ['perte-recup', 'Récupérations sur créances virées en perte (b) (F CFA)'],
            ['perte-enc',   'Encours de crédits (c) (F CFA)'],
            ['perte-taux',  'Taux de perte sur créances (a)/(c) (%)', true],
            ['perte-recouvr','Taux de recouvrement sur créances (b)/(a) (%)', true],
          ].map(([id, label, calc]) => `
          <tr${calc ? ' style="background:#F0FDF4"' : ''}>
            <td>${label}${calc ? ' <span style="font-size:10px;color:#16A34A">(calculé)</span>' : ''}</td>
            <td><input type="text" id="${id}-p1" placeholder="0" style="width:100%;text-align:right"${calc ? ' readonly' : ''} oninput="calcTauxPerte()"/></td>
            <td><input type="text" id="${id}-p2" placeholder="0" style="width:100%;text-align:right"${calc ? ' readonly' : ''} oninput="calcTauxPerte()"/></td>
            <td><input type="text" id="${id}-p3" placeholder="0" style="width:100%;text-align:right"${calc ? ' readonly' : ''} oninput="calcTauxPerte()"/></td>
            <td><input type="text" id="${id}-p4" placeholder="0" style="width:100%;text-align:right"${calc ? ' readonly' : ''} oninput="calcTauxPerte()"/></td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>

    <!-- ══════════════════════════════════════
         TABLE 24 — Prêts salariés (TEG)
    ══════════════════════════════════════ -->
    <div class="sub-title" style="margin-top:32px">
      <i class="fas fa-percentage"></i> Tableau — Prêts salariés / Taux effectif global (TEG)
    </div>
    <p style="font-size:12px;color:var(--text-muted);margin-bottom:10px">
      Vérification du respect du taux d'usure (TEG ≤ 24%).
    </p>
    <div style="overflow-x:auto">
      <table class="dyn-table" id="tbl-prets-salaries">
        <thead>
          <tr>
            <th>Emprunteurs</th>
            <th style="width:130px">Montant prêt (F CFA)</th>
            <th style="width:100px">Taux annuel (%)</th>
            <th style="width:120px">Nombre d'échéances</th>
            <th style="width:100px">TEG (%)</th>
            <th style="width:80px">Conforme</th>
          </tr>
        </thead>
        <tbody id="tbody-salaries">
          ${[1,2,3,4,5].map(n => `
          <tr>
            <td><input type="text" placeholder="Emprunteur ${n}…" style="width:100%"/></td>
            <td><input type="text" placeholder="0" style="width:100%;text-align:right"/></td>
            <td><input type="text" placeholder="0,00" style="width:100%;text-align:right"/></td>
            <td><input type="text" placeholder="0" style="width:100%;text-align:right"/></td>
            <td><input type="text" placeholder="0,00" style="width:100%;text-align:right" oninput="checkTEG(this)"/></td>
            <td id="teg-check-${n}" style="text-align:center;font-size:18px">—</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
    <button class="add-btn" onclick="ajouterLigneSalarie()">
      <i class="fas fa-plus"></i> Ajouter une ligne
    </button>

  `;
}


/* ════════════════════════════════════════════
   FONCTIONS DE CALCUL AUTOMATIQUE
════════════════════════════════════════════ */


function calcPAR() {
  const brutsVal = parseFloat((document.getElementById('port-brut-val')?.value || '0').replace(/\s/g,'').replace(',','.')) || 0;
  if (brutsVal === 0) return;

  // PAR 30 : créances en souffrance / encours bruts
  const sS = parseFloat((document.getElementById('port-souffrance-val')?.value || '0').replace(/\s/g,'').replace(',','.')) || 0;
  const par30 = brutsVal > 0 ? ((sS / brutsVal) * 100).toFixed(2) : '—';

  // PAR 90 : 6-12m + 12-24m / encours bruts
  const v612 = parseFloat((document.getElementById('port-6-12m-val')?.value || '0').replace(/\s/g,'').replace(',','.')) || 0;
  const v1224 = parseFloat((document.getElementById('port-12-24m-val')?.value || '0').replace(/\s/g,'').replace(',','.')) || 0;
  const par90 = brutsVal > 0 ? (((v612 + v1224) / brutsVal) * 100).toFixed(2) : '—';

  const par30El = document.getElementById('par30-result');
  const par90El = document.getElementById('par90-result');

  if (par30El) {
    par30El.textContent = par30 + ' %';
    par30El.style.color = parseFloat(par30) > 5 ? '#DC2626' : '#1D4ED8';
  }
  if (par90El) {
    par90El.textContent = par90 + ' %';
    par90El.style.color = parseFloat(par90) > 3 ? '#DC2626' : '#16A34A';
  }
}

function calcTotauxDirigeants() {
  let totInitial = 0, totRestant = 0, totEpargne = 0;
  document.querySelectorAll('#tbody-dirigeants tr:not(:last-child)').forEach(tr => {
    const inputs = tr.querySelectorAll('input');
    if (inputs.length >= 6) {
      const initial  = parseFloat((inputs[3]?.value || '0').replace(/\s/g,'').replace(',','.')) || 0;
      const restant  = parseFloat((inputs[4]?.value || '0').replace(/\s/g,'').replace(',','.')) || 0;
      const epargne  = parseFloat((inputs[5]?.value || '0').replace(/\s/g,'').replace(',','.')) || 0;
      totInitial += initial;
      totRestant += restant;
      totEpargne += epargne;
      // Risque réel = restant - epargne
      if (inputs[6]) inputs[6].value = Math.max(0, restant - epargne).toLocaleString('fr-FR');
    }
  });
  const ti = document.getElementById('total-dir-initial');
  const tr2 = document.getElementById('total-dir-restant');
  const te = document.getElementById('total-dir-epargne');
  const trisque = document.getElementById('total-dir-risque');
  if (ti) ti.value = totInitial.toLocaleString('fr-FR');
  if (tr2) tr2.value = totRestant.toLocaleString('fr-FR');
  if (te) te.value = totEpargne.toLocaleString('fr-FR');
  if (trisque) trisque.value = Math.max(0, totRestant - totEpargne).toLocaleString('fr-FR');
}

function calcTauxPerte() {
  ['p1','p2','p3','p4'].forEach(p => {
    const mnt    = parseFloat((document.getElementById(`perte-mnt-${p}`)?.value   || '0').replace(/\s/g,'').replace(',','.')) || 0;
    const recup  = parseFloat((document.getElementById(`perte-recup-${p}`)?.value || '0').replace(/\s/g,'').replace(',','.')) || 0;
    const enc    = parseFloat((document.getElementById(`perte-enc-${p}`)?.value   || '0').replace(/\s/g,'').replace(',','.')) || 0;
    const tauxEl = document.getElementById(`perte-taux-${p}`);
    const recouvEl = document.getElementById(`perte-recouvr-${p}`);
    if (tauxEl)   tauxEl.value   = enc   > 0 ? ((mnt   / enc)   * 100).toFixed(2) + ' %' : '—';
    if (recouvEl) recouvEl.value = mnt   > 0 ? ((recup / mnt)   * 100).toFixed(2) + ' %' : '—';
  });
}

function checkTEG(input) {
  const val = parseFloat(input.value.replace(',','.'));
  const tr = input.closest('tr');
  if (!tr) return;
  const checkCell = tr.cells[tr.cells.length - 1];
  if (!checkCell) return;
  if (isNaN(val)) { checkCell.textContent = '—'; return; }
  if (val <= 24) {
    checkCell.innerHTML = '<span style="color:#16A34A;font-size:18px">✓</span>';
    checkCell.title = 'Conforme — TEG ≤ 24%';
  } else {
    checkCell.innerHTML = '<span style="color:#EF4444;font-size:18px">✗</span>';
    checkCell.title = `Non conforme — TEG ${val}% > 24%`;
  }
}

function ajouterLigneOrgane() {
  const tbody = document.getElementById('tbody-organes');
  if (!tbody) return;
  // Insérer avant la ligne Total
  const totalRow = tbody.lastElementChild;
  const newRow = document.createElement('tr');
  newRow.innerHTML = `
    <td><input type="text" placeholder="Emprunteur…" style="width:100%"/></td>
    <td>
      <select style="width:100%;padding:6px;border:1.5px solid var(--border);border-radius:6px">
        <option value="">-- Sélectionner --</option>
        <option>Conseil d'Administration</option>
        <option>Comité de Crédit</option>
        <option>Conseil de Surveillance</option>
        <option>Direction Générale</option>
        <option>Personnel</option>
      </select>
    </td>
    <td><input type="text" placeholder="0" style="width:100%;text-align:right"/></td>
    <td><input type="text" placeholder="0" style="width:100%;text-align:right"/></td>
    <td><input type="text" placeholder="0" style="width:100%;text-align:right"/></td>
    <td><input type="text" placeholder="0" style="width:100%;text-align:right"/></td>
    <td><input type="text" placeholder="0" style="width:100%;text-align:right"/></td>
  `;
  tbody.insertBefore(newRow, totalRow);
}

function ajouterLigneSalarie() {
  const tbody = document.getElementById('tbody-salaries');
  if (!tbody) return;
  const n = tbody.rows.length + 1;
  const newRow = document.createElement('tr');
  newRow.innerHTML = `
    <td><input type="text" placeholder="Emprunteur…" style="width:100%"/></td>
    <td><input type="text" placeholder="0" style="width:100%;text-align:right"/></td>
    <td><input type="text" placeholder="0,00" style="width:100%;text-align:right"/></td>
    <td><input type="text" placeholder="0" style="width:100%;text-align:right"/></td>
    <td><input type="text" placeholder="0,00" style="width:100%;text-align:right" oninput="checkTEG(this)"/></td>
    <td style="text-align:center;font-size:18px">—</td>
  `;
  tbody.appendChild(newRow);
}


/* ════════════════════════════════════════════
   COLLECTE DES DONNÉES CRÉDIT (Tables 15-24)
   À appeler dans collecterDonneesDrawer()
   quand bloc.id === 'cred'
════════════════════════════════════════════ */

/* Collecte de la matrice Ressources — appelée par volets_save
   lors de la sauvegarde du volet ÉPARGNE */
function collecterRessourcesEpargne() {
  const data = {};
  data.ressources = {
    periodes: [
      document.getElementById('res-periode1')?.value || '',
      document.getElementById('res-periode2')?.value || '',
      document.getElementById('res-periode3')?.value || '',
      document.getElementById('res-periode4')?.value || '',
    ],
    lignes: [
      'res-inst-fin','res-cpt-ord-cred','res-dat','res-dep-gar','res-emprunts',
      'res-dep-membres','res-cpt-ord-membres','res-dat-recus','res-epargne-spec',
      'res-dep-gar2','res-autres'
    ].map(id => ({
      id,
      p1: document.getElementById(`${id}-p1`)?.value || '',
      p2: document.getElementById(`${id}-p2`)?.value || '',
      p3: document.getElementById(`${id}-p3`)?.value || '',
      p4: document.getElementById(`${id}-p4`)?.value || '',
    })),
    totaux: {
      p1: document.getElementById('res-total-p1')?.value || '',
      p2: document.getElementById('res-total-p2')?.value || '',
      p3: document.getElementById('res-total-p3')?.value || '',
      p4: document.getElementById('res-total-p4')?.value || '',
    }
  };
  return data;
}

function collecterTablesCrédit() {
  const data = {};

  // (Tables 15 et 16 déplacées au volet Épargne :
  //  10 plus gros épargnants → nouveau tableau epggros de buildStructureEpargne,
  //  Ressources → buildRessourcesEpargne / collecterRessourcesEpargne)
  // Table 17 — Production de prêts
  data.production_prets = ['prod-nb-prets','prod-nb-mois','prod-montant','prod-evol','prod-var'].reduce((acc, id) => {
    acc[id] = {
      p1: document.getElementById(`${id}-p1`)?.value || '',
      p2: document.getElementById(`${id}-p2`)?.value || '',
      p3: document.getElementById(`${id}-p3`)?.value || '',
      p4: document.getElementById(`${id}-p4`)?.value || '',
    };
    return acc;
  }, {});

  // Table 18 — Portefeuille
  data.portefeuille = {
    par30: document.getElementById('par30-result')?.textContent || '',
    par90: document.getElementById('par90-result')?.textContent || '',
    lignes: ['port-brut','port-sains','port-0j','port-1-30j','port-31-60j','port-61-90j',
             'port-souffrance','port-3-6m','port-6-12m','port-12-24m'].map(id => ({
      id,
      qte:  document.getElementById(`${id}-qte`)?.value  || '',
      val:  document.getElementById(`${id}-val`)?.value  || '',
    }))
  };

  // Table 19 — Prêts dirigeants
  const pretsDirigeants = [];
  document.querySelectorAll('#tbody-dirigeants tr:not(:last-child)').forEach(tr => {
    const inputs = tr.querySelectorAll('input');
    if (inputs[1]?.value?.trim()) {
      pretsDirigeants.push({
        titulaire: inputs[1].value.trim(),
        fonction:  inputs[2]?.value?.trim() || '',
        initial:   inputs[3]?.value?.trim() || '',
        restant:   inputs[4]?.value?.trim() || '',
        epargne:   inputs[5]?.value?.trim() || '',
        risque:    inputs[6]?.value?.trim() || '',
        retard:    inputs[7]?.value?.trim() || '',
      });
    }
  });
  data.prets_dirigeants = pretsDirigeants;

  // ── FIX : Table 20 — Synthèse prêts par organe ──
  // Cette collecte était totalement absente auparavant : les données
  // saisies dans le tableau "Synthèse prêts par organe" (#tbody-organes)
  // n'étaient donc jamais envoyées à l'API ni transmises au générateur
  // de rapport, qui pourtant lit bien mission_data['synth_organes'].
  const synthOrganes = [];
  document.querySelectorAll('#tbody-organes tr').forEach(tr => {
    const inputs = tr.querySelectorAll('input');
    const select = tr.querySelector('select');
    if (inputs[0]?.value?.trim()) {
      synthOrganes.push({
        emprunteur: inputs[0].value.trim(),
        organe:     select?.value?.trim()      || '',
        initial:    inputs[1]?.value?.trim()   || '',
        restant:    inputs[2]?.value?.trim()   || '',
        epargne:    inputs[3]?.value?.trim()   || '',
        risque:     inputs[4]?.value?.trim()   || '',
        retard:     inputs[5]?.value?.trim()   || '',
      });
    }
  });
  data.synth_organes = synthOrganes;

  // Table 21 — Prêts personnel
  const pretsPersonnel = [];
  document.querySelectorAll('#tbody-personnel tr:not(:last-child)').forEach(tr => {
    const inputs = tr.querySelectorAll('input');
    if (inputs[1]?.value?.trim()) {
      pretsPersonnel.push({
        nom:      inputs[1].value.trim(),
        fonction: inputs[2]?.value?.trim() || '',
        initial:  inputs[3]?.value?.trim() || '',
        restant:  inputs[4]?.value?.trim() || '',
        epargne:  inputs[5]?.value?.trim() || '',
        risque:   inputs[6]?.value?.trim() || '',
        retard:   inputs[7]?.value?.trim() || '',
      });
    }
  });
  data.prets_personnel = pretsPersonnel;

  // Table 22 — Gros risques
  const grosRisques = [];
  document.querySelectorAll('#tbl-gros-risques tbody tr:not(:last-child)').forEach(tr => {
    const inputs = tr.querySelectorAll('input');
    if (inputs[0]?.value?.trim()) {
      grosRisques.push({
        emprunteur: inputs[0].value.trim(),
        initial:    inputs[1]?.value?.trim() || '',
        restant:    inputs[2]?.value?.trim() || '',
        epargne:    inputs[3]?.value?.trim() || '',
        risque:     inputs[4]?.value?.trim() || '',
        retard:     inputs[5]?.value?.trim() || '',
      });
    }
  });
  data.gros_risques = grosRisques;

  // Table 23 — Crédits virés en perte
  data.credits_perte = ['perte-nb','perte-mnt','perte-recup','perte-enc','perte-taux','perte-recouvr'].reduce((acc, id) => {
    acc[id] = {
      p1: document.getElementById(`${id}-p1`)?.value || '',
      p2: document.getElementById(`${id}-p2`)?.value || '',
      p3: document.getElementById(`${id}-p3`)?.value || '',
      p4: document.getElementById(`${id}-p4`)?.value || '',
    };
    return acc;
  }, {});

  // Table 24 — Prêts salariés TEG
  const pretsSalaries = [];
  document.querySelectorAll('#tbody-salaries tr').forEach(tr => {
    const inputs = tr.querySelectorAll('input');
    if (inputs[0]?.value?.trim()) {
      pretsSalaries.push({
        emprunteur: inputs[0].value.trim(),
        montant:    inputs[1]?.value?.trim() || '',
        taux:       inputs[2]?.value?.trim() || '',
        echeances:  inputs[3]?.value?.trim() || '',
        teg:        inputs[4]?.value?.trim() || '',
      });
    }
  });
  data.prets_salaries = pretsSalaries;

  return data;
}