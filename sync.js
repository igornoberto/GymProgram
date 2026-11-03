'use strict';

/* =====================================================================
   Sincronização em nuvem (Firebase Auth + Firestore)
   - O app continua local-first: tudo é salvo no aparelho e funciona offline.
   - Cada registro tem `u` (última alteração). Vence a alteração mais recente.
   - Exclusões viram "tombstones" (S.tomb) para também chegarem aos outros aparelhos.
   Dados em: users/{uid}/records/{id}  →  { kind, u, deleted, json }
   ===================================================================== */
const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyAEg8agFjlsKsgdTC1ZQXZVmj97zkuWDkM',
  authDomain: 'gymprogram-eea53.firebaseapp.com',
  projectId: 'gymprogram-eea53',
  storageBucket: 'gymprogram-eea53.firebasestorage.app',
  messagingSenderId: '97794428924',
  appId: '1:97794428924:web:7566ecc27c7641a72fec79',
};

const Sync = (() => {
  const available = typeof firebase !== 'undefined';
  let auth, db, user = null, unsub = null, timer = null, pushing = false, again = false;
  let status = 'off', lastOk = null, lastErr = '';

  const col = () => db.collection('users').doc(user.uid).collection('records');

  function setStatus(s, err) {
    status = s; lastErr = err || '';
    if (s === 'ok') lastOk = new Date();
    updateSyncUI();
  }

  function init() {
    if (!available) return;
    firebase.initializeApp(FIREBASE_CONFIG);
    auth = firebase.auth();
    db = firebase.firestore();
    auth.onAuthStateChanged(u => {
      user = u;
      if (unsub) { unsub(); unsub = null; }
      if (u) start(); else setStatus('off');
    });
    window.addEventListener('online', () => { if (user) { setStatus('syncing'); push(); } });
    window.addEventListener('offline', () => { if (user) setStatus('offline'); });
  }

  function start() {
    if (S.uid && S.uid !== user.uid) S.pushed = {}; // outra conta: reenvia tudo
    S.uid = user.uid;
    // registros antigos (criados antes da nuvem) ainda não têm carimbo
    const t = Date.now();
    S.programs.forEach(p => { if (!p.u) p.u = t; });
    S.checkins.forEach(c => { if (!c.u) c.u = t; });
    if (!S.metaU && (S.programs.length || S.checkins.length)) S.metaU = t;
    persist();
    setStatus(navigator.onLine ? 'syncing' : 'offline');
    unsub = col().onSnapshot(snap => {
      let changed = false;
      snap.docChanges().forEach(ch => { if (ch.type !== 'removed') changed = mergeRemote(ch.doc.id, ch.doc.data()) || changed; });
      if (changed) {
        if (!S.programs.some(p => p.id === S.activeProgramId)) S.activeProgramId = S.programs[0] ? S.programs[0].id : null;
        persist();
        if (!sheetOpen) render();
      }
      push();
    }, err => setStatus('error', err.code || err.message));
  }

  function mergeRemote(id, d) {
    const u = d.u || 0;
    if (d.kind === 'meta') {
      if (u > (S.metaU || 0)) {
        const m = JSON.parse(d.json);
        S.activeProgramId = m.activeProgramId || null;
        S.customMuscles = [...new Set([...(S.customMuscles || []), ...(m.customMuscles || [])])];
        S.metaU = u; S.pushed.meta = u;
        return true;
      }
      if (u === (S.metaU || 0)) S.pushed.meta = u;
      return false;
    }
    const list = d.kind === 'program' ? S.programs : S.checkins;
    const i = list.findIndex(x => x.id === id);
    const localU = i >= 0 ? (list[i].u || 0) : (S.tomb[id] ? S.tomb[id].u : -1);
    if (u <= localU) { if (u === localU) S.pushed[id] = u; return false; }
    if (d.deleted) {
      if (i >= 0) list.splice(i, 1);
      S.tomb[id] = { k: d.kind, u };
    } else {
      const rec = JSON.parse(d.json); rec.u = u;
      if (i >= 0) list[i] = rec; else list.push(rec);
      delete S.tomb[id];
    }
    S.pushed[id] = u;
    return true;
  }

  async function push() {
    if (!user) return;
    if (!navigator.onLine) return setStatus('offline');
    if (pushing) { again = true; return; }
    pushing = true;
    try {
      const ops = [];
      const add = (id, kind, u, deleted, obj) => { if (S.pushed[id] !== u) ops.push({ id, kind, u, deleted, obj }); };
      S.programs.forEach(p => add(p.id, 'program', p.u || 0, false, p));
      S.checkins.forEach(c => add(c.id, 'checkin', c.u || 0, false, c));
      Object.entries(S.tomb).forEach(([id, t]) => add(id, t.k, t.u, true, null));
      add('meta', 'meta', S.metaU || 0, false, { activeProgramId: S.activeProgramId, customMuscles: S.customMuscles });
      for (let i = 0; i < ops.length; i += 400) {
        const chunk = ops.slice(i, i + 400), batch = db.batch();
        chunk.forEach(o => batch.set(col().doc(o.id), { kind: o.kind, u: o.u, deleted: o.deleted, json: o.obj ? JSON.stringify(o.obj) : '' }));
        await batch.commit();
        chunk.forEach(o => { S.pushed[o.id] = o.u; });
      }
      persist();
      setStatus('ok');
    } catch (e) {
      setStatus('error', e.code || e.message);
    } finally {
      pushing = false;
      if (again) { again = false; push(); }
    }
  }

  function soon() {
    if (!user) return;
    clearTimeout(timer);
    timer = setTimeout(() => { setStatus(navigator.onLine ? 'syncing' : 'offline'); push(); }, 1200);
  }

  async function login() {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
      await auth.signInWithPopup(provider);
    } catch (e) {
      if (['auth/popup-blocked', 'auth/operation-not-supported-in-this-environment'].includes(e.code)) {
        return auth.signInWithRedirect(provider);
      }
      if (e.code !== 'auth/popup-closed-by-user' && e.code !== 'auth/cancelled-popup-request') toast('Não foi possível entrar: ' + (e.code || e.message));
    }
  }
  const logout = () => auth.signOut();
  const now = () => { if (user) { setStatus('syncing'); push(); } };

  function cardHtml() {
    if (!available) return '<p class="sub" style="margin:0">Sincronização indisponível nesta versão (SDK não carregado).</p>';
    if (!user) return `<p class="sub" style="margin:-6px 0 12px">Entre com sua conta Google para guardar seus treinos na nuvem e usar em outros aparelhos.</p>
      <button class="btn sm" data-act="login">Entrar com Google</button>`;
    const label = { ok: `Sincronizado${lastOk ? ' às ' + pad(lastOk.getHours()) + ':' + pad(lastOk.getMinutes()) : ''}`, syncing: 'Sincronizando…', offline: 'Sem conexão. Sincroniza quando voltar a internet.', error: 'Erro ao sincronizar' + (lastErr ? ` (${esc(lastErr)})` : ''), off: '' }[status];
    return `<p style="margin:-6px 0 4px;font-weight:600">${esc(user.displayName || user.email)}</p>
      <p class="sub" style="margin:0 0 12px">${esc(user.email || '')}<br>${label}</p>
      <div class="actions" style="margin-top:0"><button class="btn sm" data-act="sync-now">Sincronizar agora</button><button class="btn ghost sm" data-act="logout">Sair</button></div>`;
  }

  return { init, soon, login, logout, now, cardHtml, available };
})();

function syncSoon() { Sync.soon(); }
function updateSyncUI() {
  const el = document.getElementById('sync-card');
  if (el) el.innerHTML = Sync.cardHtml();
}
Sync.init();
