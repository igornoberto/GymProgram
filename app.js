'use strict';

/* =====================================================================
   Meu Treino — registro de treinos de musculação (PWA, 100% offline)
   ===================================================================== */

/* ---------- utilidades ---------- */
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => String(n).padStart(2, '0');
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseISO = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const today0 = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
const nowTime = () => { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const fmt1 = n => n.toFixed(1).replace('.', ',');
const brDate = s => { const [y, m, d] = s.split('-'); return `${d}/${m}/${y}`; };
const brShort = s => { const [, m, d] = s.split('-'); return `${d}/${m}`; };
const hourOf = t => parseInt(t.slice(0, 2), 10);
const LETTERS = 'ABCDEFG';
const WD = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const WD1 = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const WD_LONG = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const WD_PLURAL = ['domingos', 'segundas', 'terças', 'quartas', 'quintas', 'sextas', 'sábados'];
const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

/* ---------- grupos musculares ---------- */
const DEFAULT_MUSCLES = ['Peito', 'Costas', 'Ombro frontal', 'Ombro lateral', 'Ombro posterior', 'Bíceps', 'Tríceps', 'Quadríceps', 'Posteriores', 'Glúteos', 'Panturrilha', 'Abdômen', 'Antebraço', 'Trapézio'];
const COLORS = {
  Peito: '#ff5a5f', Costas: '#3e91ff', Ombros: '#ffa726', 'Ombro frontal': '#ffa726', 'Ombro lateral': '#f57c00', 'Ombro posterior': '#ffcc80', 'Bíceps': '#ab47bc', 'Tríceps': '#26c6da',
  'Quadríceps': '#43a047', Posteriores: '#8d6e63', 'Glúteos': '#ec407a', Panturrilha: '#9ccc65',
  'Abdômen': '#fbc02d', Antebraço: '#78909c', 'Trapézio': '#5c6bc0',
};
const EXTRA = ['#00acc1', '#7e57c2', '#ef6c00', '#6d4c41', '#c2185b', '#2e7d32', '#455a64'];
const colorOf = m => COLORS[m] || EXTRA[[...m].reduce((a, c) => a + c.charCodeAt(0), 0) % EXTRA.length];
const allMuscles = () => [...DEFAULT_MUSCLES, ...S.customMuscles.filter(m => !DEFAULT_MUSCLES.includes(m))];

const TEMPLATES = {
  2: [['Peito', 'Costas', 'Ombro frontal', 'Ombro lateral', 'Ombro posterior', 'Bíceps', 'Tríceps'], ['Quadríceps', 'Posteriores', 'Glúteos', 'Panturrilha', 'Abdômen']],
  3: [['Peito', 'Ombro frontal', 'Ombro lateral', 'Tríceps'], ['Costas', 'Ombro posterior', 'Bíceps', 'Trapézio'], ['Quadríceps', 'Posteriores', 'Glúteos', 'Panturrilha']],
  4: [['Peito', 'Tríceps'], ['Costas', 'Bíceps'], ['Quadríceps', 'Panturrilha'], ['Ombro frontal', 'Ombro lateral', 'Ombro posterior', 'Posteriores', 'Abdômen']],
  5: [['Peito'], ['Costas'], ['Ombro frontal', 'Ombro lateral', 'Ombro posterior', 'Trapézio'], ['Bíceps', 'Tríceps'], ['Quadríceps', 'Posteriores', 'Glúteos', 'Panturrilha']],
  6: [['Peito'], ['Costas'], ['Quadríceps', 'Panturrilha'], ['Ombro frontal', 'Ombro lateral', 'Ombro posterior'], ['Bíceps', 'Tríceps'], ['Posteriores', 'Glúteos', 'Abdômen']],
};
const DEFAULT_DAYS = { 1: [1], 2: [1, 4], 3: [1, 3, 5], 4: [1, 2, 4, 5], 5: [1, 2, 3, 4, 5], 6: [1, 2, 3, 4, 5, 6], 7: [0, 1, 2, 3, 4, 5, 6] };

/* ---------- ícones ---------- */
const svg = p => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
const IC = {
  home: svg('<path d="M3 11l9-8 9 8"/><path d="M5 10v10h5v-6h4v6h5V10"/>'),
  cal: svg('<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
  chart: svg('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
  prog: svg('<path d="M3 9v6M6 6v12M18 6v12M21 9v6M6 12h12"/>'),
  gear: svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/>'),
  left: svg('<path d="M15 5l-7 7 7 7"/>'),
  right: svg('<path d="M9 5l7 7-7 7"/>'),
  x: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
  check: svg('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
};

/* ---------- armazenamento ---------- */
const KEY = 'meutreino.v1';
const blank = () => ({ v: 1, programs: [], checkins: [], activeProgramId: null, customMuscles: [], tomb: {}, pushed: {}, metaU: 0 });
function load() {
  try { const r = localStorage.getItem(KEY); if (r) return Object.assign(blank(), JSON.parse(r)); } catch (e) { /* ignora */ }
  return blank();
}
let S = load();
function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast('Não foi possível salvar os dados'); }
}
/** salva no aparelho e agenda o envio para a nuvem (sync.js) */
function save() {
  persist();
  if (typeof syncSoon === 'function') syncSoon();
}
const stamp = () => Date.now();
function tombstone(kind, id) { S.tomb[id] = { k: kind, u: stamp() }; }

/* ---------- domínio ---------- */
const activeProgram = () => S.programs.find(p => p.id === S.activeProgramId) || null;
const programById = id => S.programs.find(p => p.id === id);
const programEnd = p => (p.weeks > 0 ? addDays(parseISO(p.start), p.weeks * 7 - 1) : null);

const isRolling = p => p.mode === 'rolling';
const availDays = p => p.avail || [0, 1, 2, 3, 4, 5, 6];
const inPlan = (p, d) => { if (d < parseISO(p.start)) return false; const e = programEnd(p); return !(e && d > e); };
/** o dia faz parte da rotina do programa (antes de considerar os dias marcados para pular) */
const baseDay = (p, d) => inPlan(p, d) && (isRolling(p) ? availDays(p).includes(d.getDay()) : !!p.schedule[d.getDay()]);
const isSkipped = (p, d) => (p.skips || []).includes(iso(d));
const isPlanned = (p, d) => baseDay(p, d) && !isSkipped(p, d);

/** programação corrida: a próxima rotina é a seguinte à do último check-in */
function nextRollingIdx(p) {
  const last = S.checkins
    .filter(c => c.programId === p.id && p.days.some(x => x.key === c.dayKey))
    .sort((x, y) => (y.date + y.time).localeCompare(x.date + x.time))[0];
  return last ? (p.days.findIndex(x => x.key === last.dayKey) + 1) % p.days.length : 0;
}
/** rotina prevista para o dia (null = descanso, pulo ou fora do plano) */
function planKey(p, d) {
  if (!isPlanned(p, d)) return null;
  if (!isRolling(p)) return p.schedule[d.getDay()];
  const di = iso(d), done = S.checkins.find(c => c.programId === p.id && c.date === di);
  if (done) return done.dayKey;
  const t = today0();
  if (d < t) return null;
  let idx = nextRollingIdx(p);
  for (let x = S.checkins.some(c => c.programId === p.id && c.date === iso(t)) ? addDays(t, 1) : t; x <= d; x = addDays(x, 1)) {
    if (!isPlanned(p, x)) continue;
    if (iso(x) === di) return p.days[idx % p.days.length].key;
    idx++;
  }
  return null;
}
/** próximos treinos ainda não feitos */
function upcoming(p, n = 7) {
  const t = today0(), out = [];
  for (let i = 0; i < 60 && out.length < n; i++) {
    const d = addDays(t, i), k = planKey(p, d);
    if (k && !S.checkins.some(c => c.programId === p.id && c.date === iso(d))) out.push({ date: d, key: k });
  }
  return out;
}
/** quantas vezes por semana cada grupo entra no programa */
function weeklyFreq(p) {
  const f = {};
  p.days.forEach(d => d.muscles.forEach(m => { f[m] = 0; }));
  if (isRolling(p)) {
    const per = availDays(p).length / p.days.length;
    p.days.forEach(d => d.muscles.forEach(m => { f[m] += per; }));
  } else {
    Object.values(p.schedule).forEach(k => dayMuscles(p, k).forEach(m => { f[m] += 1; }));
  }
  return f;
}
const MIN_WEEK = 2;
const meets = v => v >= MIN_WEEK - 1e-9;
const dayMuscles = (p, key) => (p.days.find(d => d.key === key) || { muscles: [] }).muscles;
const ciAvg = c => {
  const v = Object.values(c.ratings).filter(x => x > 0);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
};
const mean = a => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
const sortedCheckins = () => [...S.checkins].sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
const ciOn = (date, programId) => S.checkins.filter(c => c.date === date && (!programId || c.programId === programId));

/** dias planejados de um programa entre from e to (inclusive), com status. Hoje só entra se já houve check-in. */
function plannedDays(p, from, to) {
  const t = today0();
  const start = parseISO(p.start);
  let d = from && from > start ? from : start;
  const end = programEnd(p);
  let last = to < t ? to : t;
  if (end && end < last) last = end;
  const out = [];
  for (; d <= last; d = addDays(d, 1)) {
    if (!isPlanned(p, d)) continue;
    const done = S.checkins.some(c => c.programId === p.id && c.date === iso(d));
    if (!done && d.getTime() === t.getTime()) continue;
    out.push({ date: d, key: planKey(p, d), done });
  }
  return out;
}

function streak() {
  const days = [];
  S.programs.forEach(p => plannedDays(p, null, today0()).forEach(x => days.push(x)));
  days.sort((a, b) => b.date - a.date);
  let n = 0;
  for (const x of days) { if (!x.done) break; n++; }
  return n;
}

/* ---------- estado da interface ---------- */
const now0 = new Date();
const ui = {
  tab: 'home',
  cal: { y: now0.getFullYear(), m: now0.getMonth(), prog: 'all', muscle: 'all', mode: 'month' },
  stats: { range: 90, prog: 'all' },
};
let installPrompt = null;

/* ---------- componentes ---------- */
const stars = v => {
  const n = Math.round(v);
  return `<span class="stars">${'★'.repeat(n)}<span class="off">${'★'.repeat(5 - n)}</span></span>`;
};
const chip = m => `<span class="chip"><i class="dot" style="background:${colorOf(m)}"></i>${esc(m)}</span>`;
const ring = (pct, color, label, sub) => {
  const r = 48, c = 2 * Math.PI * r;
  return `<div class="ring"><svg viewBox="0 0 112 112" width="112" height="112">
    <circle cx="56" cy="56" r="${r}" fill="none" stroke="var(--card2)" stroke-width="12"/>
    <circle cx="56" cy="56" r="${r}" fill="none" stroke="${color}" stroke-width="12" stroke-linecap="round"
      stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - Math.min(1, pct))}" transform="rotate(-90 56 56)"/></svg>
    <div class="c"><div><b>${label}</b><span>${sub}</span></div></div></div>`;
};
const hbar = (label, pct, right, color, dot) => `<div class="hbar">
  <div class="lb">${dot ? `<i class="dot" style="background:${dot}"></i>` : ''}${esc(label)}</div>
  <div class="track"><div class="fill" style="width:${Math.max(0, Math.min(100, pct))}%;${color ? `background:${color}` : ''}"></div></div>
  <div class="v">${right}</div></div>`;
const emptyState = (icon, title, text, btn) => `<div class="empty"><div class="big">${icon}</div><h2>${title}</h2><p>${text}</p>${btn || ''}</div>`;

let toastT;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2400);
}

/* ---------- sheet (folha inferior) ---------- */
let sheetOpen = false;
function setSheet(html, keepScroll) {
  const sh = $('#sheet'), y = sh.scrollTop;
  sh.innerHTML = `<div class="grab"></div>${html}`;
  $('#overlay').hidden = false;
  sh.scrollTop = keepScroll ? y : 0;
  if (!sheetOpen) { sheetOpen = true; history.pushState({ sheet: 1 }, ''); }
}
function hideSheet() {
  sheetOpen = false; $('#overlay').hidden = true; $('#sheet').innerHTML = ''; render();
}
function closeSheet() { if (sheetOpen) history.back(); }
window.addEventListener('popstate', () => { if (sheetOpen) hideSheet(); });
$('#overlay').addEventListener('click', e => { if (e.target.id === 'overlay') closeSheet(); });
const sheetHead = title => `<div class="sheet-h"><h2>${title}</h2><button class="x" data-act="close" aria-label="Fechar">${IC.x}</button></div>`;

/* ---------- diálogos próprios (confirm/prompt nativos não funcionam em todo ambiente) ---------- */
function dialog(body, setup) {
  return new Promise(resolve => {
    const o = document.createElement('div');
    o.id = 'dlg';
    o.innerHTML = `<div class="dlg-box">${body}</div>`;
    document.body.appendChild(o);
    const done = v => { o.remove(); resolve(v); };
    o.addEventListener('click', e => { if (e.target === o) done(null); });
    setup(o, done);
  });
}
const confirmBox = (msg, ok = 'Confirmar') => dialog(
  `<p>${esc(msg)}</p><div class="actions"><button class="btn ghost sm" data-r="0">Cancelar</button><button class="btn danger sm" data-r="1">${esc(ok)}</button></div>`,
  (o, done) => o.querySelectorAll('[data-r]').forEach(b => b.onclick = () => done(b.dataset.r === '1')),
).then(v => !!v);
const promptBox = msg => dialog(
  `<p>${esc(msg)}</p><input class="in" maxlength="24" id="dlg-in"><div class="actions" style="margin-top:14px"><button class="btn ghost sm" data-r="0">Cancelar</button><button class="btn sm" data-r="1">Adicionar</button></div>`,
  (o, done) => {
    const i = o.querySelector('input'); i.focus();
    i.onkeydown = e => { if (e.key === 'Enter') done(i.value); };
    o.querySelectorAll('[data-r]').forEach(b => b.onclick = () => done(b.dataset.r === '1' ? i.value : null));
  },
);

/* =====================================================================
   TELAS
   ===================================================================== */
function render() {
  $('#nav').innerHTML = [['home', 'Início', IC.home], ['cal', 'Calendário', IC.cal], ['stats', 'Estatísticas', IC.chart], ['prog', 'Programa', IC.prog]]
    .map(([k, l, i]) => `<button class="${ui.tab === k ? 'on' : ''}" data-act="tab" data-tab="${k}"><span class="pill">${i}</span>${l}</button>`).join('');
  const v = $('#view');
  v.innerHTML = { home: viewHome, cal: viewCal, stats: viewStats, prog: viewProg }[ui.tab]();
}

function pageHead(title, subtitle, right) {
  return `<div class="head"><div><h1>${title}</h1>${subtitle ? `<p>${subtitle}</p>` : ''}</div>${right || ''}</div>`;
}
const gearBtn = `<button class="icon-btn" data-act="settings" aria-label="Configurações">${IC.gear}</button>`;

/* ---------- Início ---------- */
function nextWorkoutText(p, t) {
  const n = upcoming(p, 1)[0];
  if (!n) return '';
  const diff = Math.round((n.date - t) / 864e5);
  return `Próximo: Treino ${n.key} · ${diff === 1 ? 'amanhã' : WD_LONG[n.date.getDay()]}.`;
}
function viewHome() {
  const t = today0(), ti = iso(t), p = activeProgram();
  const sub = `${WD_LONG[t.getDay()]}, ${t.getDate()} de ${MONTHS[t.getMonth()]}`;
  const head = pageHead('Meu Treino', sub.charAt(0).toUpperCase() + sub.slice(1), gearBtn);
  if (!p) {
    return head + `<div class="card">${emptyState(IC.prog, 'Monte seu programa', 'Defina a rotina (ABC, ABCD…), os grupos musculares de cada dia e os dias da semana do seu plano.',
      '<button class="btn" data-act="prog-new">Criar programa</button>')}</div>`;
  }

  /* cartão de hoje */
  const key = planKey(p, t), todays = ciOn(ti, p.id);
  let hero;
  if (todays.length) {
    const c = todays[0], a = ciAvg(c);
    hero = `<div class="hero done"><div class="kicker">Hoje · concluído</div><h2>Treino ${c.dayKey} ✓</h2>
      <div class="chips">${Object.keys(c.ratings).map(m => chip(m)).join('')}</div>
      <p style="margin:12px 0 0;position:relative;z-index:1">${c.time}${a ? ` · nota média ${fmt1(a)} ★` : ''}</p>
      <button class="btn light sm" data-act="checkin" data-date="${ti}" data-key="${key || ''}">Registrar outro</button></div>`;
  } else if (isSkipped(p, t) && baseDay(p, t)) {
    hero = `<div class="hero rest"><div class="kicker">Hoje</div><h2>Dia sem treino</h2><p style="margin:0;position:relative;z-index:1">Você marcou hoje para pular. ${nextWorkoutText(p, t)}</p>
      <div class="hero-actions"><button class="btn light sm" data-act="skip-toggle" data-date="${ti}">Desmarcar</button><button class="btn glass sm" data-act="checkin" data-date="${ti}" data-key="">Treinar mesmo assim</button></div></div>`;
  } else if (key) {
    hero = `<div class="hero"><div class="kicker">Hoje${isRolling(p) ? ' · próxima da sequência' : ''}</div><h2>Treino ${key}</h2>
      <div class="chips">${dayMuscles(p, key).map(chip).join('')}</div>
      <div class="hero-actions"><button class="btn light" data-act="checkin" data-date="${ti}" data-key="${key}">Fazer check-in</button><button class="btn glass sm" data-act="skip-toggle" data-date="${ti}">Hoje não vou</button></div></div>`;
  } else {
    let msg = 'Dia de descanso', extra = '';
    if (t < parseISO(p.start)) msg = `Seu plano começa em ${brDate(p.start)}`;
    else if (programEnd(p) && t > programEnd(p)) { msg = 'Seu plano terminou'; extra = ' Renove no Programa.'; }
    hero = `<div class="hero rest"><div class="kicker">Hoje</div><h2>${msg}</h2><p style="margin:0;position:relative;z-index:1">${nextWorkoutText(p, t)}${extra}</p>
      <button class="btn light sm" data-act="checkin" data-date="${ti}" data-key="">Treinar mesmo assim</button></div>`;
  }

  /* semana */
  const wkStart = addDays(t, -t.getDay());
  let weekDone = 0, weekPlanned = 0;
  const cells = [];
  for (let i = 0; i < 7; i++) {
    const d = addDays(wkStart, i), di = iso(d), k = planKey(p, d), pl = isPlanned(p, d), done = S.checkins.some(c => c.date === di);
    if (pl) weekPlanned++;
    if (done) weekDone++;
    let cls = '', inner = k || '·';
    if (done) { cls = 'done'; inner = IC.check; }
    else if (isSkipped(p, d) && baseDay(p, d)) { cls = 'skip'; inner = '–'; }
    else if (pl && d < t) { cls = 'miss'; inner = IC.x; }
    else if (pl) cls = 'plan';
    if (di === ti) cls += ' today';
    cells.push(`<button data-act="day" data-date="${di}"><div class="wd">${WD[i]}</div><div class="day-c ${cls}">${inner}</div><div class="dn">${d.getDate()}</div></button>`);
  }

  /* estatísticas rápidas */
  const t30 = iso(addDays(t, -29));
  const avg30 = mean(S.checkins.filter(c => c.date >= t30).map(ciAvg).filter(x => x));
  const month = S.checkins.filter(c => c.date.startsWith(ti.slice(0, 7))).length;
  const pd = S.programs.flatMap(x => plannedDays(x, null, t));
  const adh = pd.length ? Math.round(100 * pd.filter(x => x.done).length / pd.length) : null;
  const pct = weekPlanned ? weekDone / weekPlanned : (weekDone ? 1 : 0);

  /* progresso do plano */
  let progress = '';
  if (p.weeks > 0) {
    const elapsed = Math.floor((t - parseISO(p.start)) / 864e5);
    const wk = Math.min(p.weeks, Math.max(0, Math.floor(elapsed / 7) + 1));
    const f = Math.max(0, Math.min(1, elapsed / (p.weeks * 7)));
    progress = `<div class="card span2"><div class="card-h"><h2>${esc(p.name)}</h2><span class="sub">${t < parseISO(p.start) ? 'não iniciou' : `semana ${wk} de ${p.weeks}`}</span></div>
      <div class="track" style="height:12px;background:var(--card2);border-radius:6px;overflow:hidden"><div style="height:100%;width:${f * 100}%;background:var(--accent);border-radius:6px"></div></div>
      <p class="sub" style="margin:10px 0 0">${brDate(p.start)} → ${brDate(iso(programEnd(p)))}</p></div>`;
  } else {
    progress = `<div class="card span2"><div class="card-h"><h2>${esc(p.name)}</h2><span class="sub">desde ${brDate(p.start)}</span></div></div>`;
  }

  const recent = sortedCheckins().slice(0, 4).map(c => ciRow(c)).join('');

  return head + `<div class="grid">
    <div>${hero}</div>
    <div class="card center"><div class="card-h"><h2>Esta semana</h2><span class="sub">${weekDone} de ${weekPlanned || '–'} treinos</span></div><div class="week">${cells.join('')}</div></div>
    <div class="card span2"><div class="ring-row">${ring(pct, 'var(--ok)', `${weekDone}/${weekPlanned}`, 'semana')}
      <div class="tiles">
        <div class="tile"><b>${streak()}</b><span>treinos seguidos</span></div>
        <div class="tile"><b>${month}</b><span>treinos no mês</span></div>
        <div class="tile"><b>${avg30 ? fmt1(avg30) + ' ★' : '–'}</b><span>nota média (30 d)</span></div>
        <div class="tile"><b>${adh === null ? '–' : adh + '%'}</b><span>aderência ao plano</span></div>
      </div></div></div>
    ${progress}
    <div class="card span2"><div class="card-h"><h2>Recentes</h2><button class="link" data-act="tab" data-tab="cal">Ver tudo</button></div>
      ${recent || '<p class="sub" style="margin:0">Seus check-ins aparecerão aqui.</p>'}</div>
  </div>`;
}

function ciRow(c) {
  const d = parseISO(c.date), p = programById(c.programId), a = ciAvg(c);
  return `<button class="row" style="width:100%;text-align:left" data-act="day" data-date="${c.date}">
    <div class="date-badge"><b>${d.getDate()}</b><span>${WD[d.getDay()]}</span></div>
    <div class="grow"><div class="t">Treino ${c.dayKey} <span class="sub">· ${c.time}</span></div>
      <div class="sub" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${Object.keys(c.ratings).map(esc).join(' · ')}</div></div>
    ${a ? `<span class="avg">${fmt1(a)}</span>` : ''}</button>`;
}

/* ---------- Calendário ---------- */
function calFiltered(c) {
  const f = ui.cal;
  return (f.prog === 'all' || c.programId === f.prog) && (f.muscle === 'all' || f.muscle in c.ratings);
}
function viewCal() {
  const f = ui.cal, t = today0();
  const filters = `<div class="filters stack">
    <div class="scroll-x">
      <button class="chip ${f.prog === 'all' ? 'on' : ''}" data-act="cal-prog" data-v="all">Todos os programas</button>
      ${S.programs.map(p => `<button class="chip ${f.prog === p.id ? 'on' : ''}" data-act="cal-prog" data-v="${p.id}">${esc(p.name)}</button>`).join('')}
    </div>
    <div class="scroll-x">
      <button class="chip ${f.muscle === 'all' ? 'on' : ''}" data-act="cal-muscle" data-v="all">Todos os grupos</button>
      ${allMuscles().map(m => `<button class="chip ${f.muscle === m ? 'on' : ''}" data-act="cal-muscle" data-v="${esc(m)}"><i class="dot" style="background:${colorOf(m)}"></i>${esc(m)}</button>`).join('')}
    </div></div>`;
  const head = pageHead('Calendário', '', `<div class="seg"><button class="${f.mode === 'month' ? 'on' : ''}" data-act="cal-mode" data-v="month">Mês</button><button class="${f.mode === 'list' ? 'on' : ''}" data-act="cal-mode" data-v="list">Histórico</button></div>`);

  if (f.mode === 'list') {
    const list = sortedCheckins().filter(calFiltered);
    if (!list.length) return head + filters + `<div class="card">${emptyState(IC.cal, 'Nada por aqui', 'Nenhum check-in para este filtro.')}</div>`;
    let html = '', cur = '';
    list.forEach(c => {
      const ym = c.date.slice(0, 7);
      if (ym !== cur) {
        if (cur) html += '</div>';
        cur = ym;
        const [y, m] = ym.split('-');
        const n = list.filter(x => x.date.startsWith(ym)).length;
        html += `<div class="card-h" style="margin:18px 4px 8px"><h2 style="text-transform:capitalize">${MONTHS[+m - 1]} ${y}</h2><span class="sub">${n} treinos</span></div><div class="card flat">`;
      }
      html += ciRow(c);
    });
    return head + filters + html + '</div>';
  }

  const first = new Date(f.y, f.m, 1), days = new Date(f.y, f.m + 1, 0).getDate();
  const progs = f.prog === 'all' ? S.programs : S.programs.filter(p => p.id === f.prog);
  let cells = WD1.map(d => `<div class="dow">${d}</div>`).join('') + '<div></div>'.repeat(first.getDay());
  const monthCis = [];
  for (let n = 1; n <= days; n++) {
    const d = new Date(f.y, f.m, n), di = iso(d);
    const cis = ciOn(di).filter(calFiltered);
    monthCis.push(...cis);
    let key = null, pr = null, planned = false, skipped = false;
    for (const p of progs) {
      if (isSkipped(p, d) && baseDay(p, d)) skipped = true;
      if (!isPlanned(p, d)) continue;
      const k = planKey(p, d);
      if (f.muscle === 'all' || (k && dayMuscles(p, k).includes(f.muscle))) { key = k; pr = p; planned = true; break; }
    }
    let cls = '';
    if (cis.length) cls = 'done';
    else if (planned && d < t && !S.checkins.some(c => c.programId === pr.id && c.date === di)) cls = 'miss';
    else if (planned) cls = 'plan';
    else if (skipped && f.muscle === 'all') cls = 'skip';
    if (d.getTime() === t.getTime()) cls += ' today';
    const ms = [...new Set(cis.flatMap(c => Object.keys(c.ratings)))].slice(0, 5);
    cells += `<button class="cell ${cls}" data-act="day" data-date="${di}">${key ? `<span class="lt">${key}</span>` : ''}<span class="n">${n}</span>
      <span class="dots">${ms.map(m => `<i style="background:${colorOf(m)}"></i>`).join('')}</span></button>`;
  }
  const avg = mean(monthCis.map(ciAvg).filter(x => x));
  const title = `${MONTHS[f.m]} ${f.y}`;
  return head + filters + `<div class="cal-wrap"><div><div class="card"><div class="cal-head"><h2>${title}</h2><div class="nav">
      <button data-act="cal-nav" data-v="-1" aria-label="Mês anterior">${IC.left}</button>
      <button data-act="cal-today" style="width:auto;padding:0 14px;border-radius:20px;font-size:14px;font-weight:600">Hoje</button>
      <button data-act="cal-nav" data-v="1" aria-label="Próximo mês">${IC.right}</button></div></div>
    <div class="cal">${cells}</div>
    <div class="legend"><span><i style="background:var(--ok-soft)"></i>Treinou</span><span><i style="background:var(--bad-soft)"></i>Faltou</span><span><i style="box-shadow:inset 0 0 0 1.5px var(--line)"></i>Planejado</span><span><i style="border:1.5px dashed var(--sub)"></i>Sem treino</span><span>Letra = treino do dia</span></div></div></div>
    <div class="tiles four">
      <div class="tile" style="background:var(--card)"><b>${monthCis.length}</b><span>treinos no mês</span></div>
      <div class="tile" style="background:var(--card)"><b>${avg ? fmt1(avg) + ' ★' : '–'}</b><span>nota média</span></div>
      <div class="tile" style="background:var(--card)"><b>${new Set(monthCis.map(c => c.date)).size}</b><span>dias na academia</span></div>
      <div class="tile" style="background:var(--card)"><b>${(() => { const c = {}; monthCis.forEach(x => Object.keys(x.ratings).forEach(m => c[m] = (c[m] || 0) + 1)); const e = Object.entries(c).sort((a, b) => b[1] - a[1])[0]; return e ? esc(e[0]) : '–'; })()}</b><span>mais treinado</span></div>
    </div></div>`;
}

function openDay(date) {
  const d = parseISO(date), t = today0(), cis = ciOn(date).sort((a, b) => a.time.localeCompare(b.time));
  const plans = S.programs.map(p => ({ p, k: planKey(p, d) })).filter(x => x.k);
  let html = sheetHead(`${WD_LONG[d.getDay()].replace(/^./, c => c.toUpperCase())}, ${d.getDate()}/${pad(d.getMonth() + 1)}`);
  if (plans.length) {
    html += `<p class="sub" style="margin:-8px 4px 14px">Planejado: ${plans.map(x => `Treino ${x.k} (${esc(x.p.name)})`).join(', ')}</p>`;
  }
  html += cis.map(c => {
    const p = programById(c.programId), a = ciAvg(c);
    return `<div class="card"><div class="card-h"><div><h2 style="margin:0">Treino ${c.dayKey}</h2><span class="sub">${c.time} · ${p ? esc(p.name) : 'programa excluído'}</span></div>${a ? `<span class="avg" style="font-size:20px">${fmt1(a)}</span>` : ''}</div>
      ${Object.entries(c.ratings).map(([m, v]) => `<div class="row" style="padding:8px 0"><i class="dot" style="width:12px;height:12px;border-radius:50%;background:${colorOf(m)}"></i><div class="grow">${esc(m)}</div>${v ? stars(v) : '<span class="sub">sem nota</span>'}</div>`).join('')}
      ${c.note ? `<p class="sub" style="margin:10px 0 0">“${esc(c.note)}”</p>` : ''}
      <div class="actions"><button class="btn ghost sm" data-act="ci-edit" data-id="${c.id}">Editar</button><button class="btn danger sm" data-act="ci-del" data-id="${c.id}">Excluir</button></div></div>`;
  }).join('');
  if (!cis.length) html += `<div class="card"><p class="sub" style="margin:0;text-align:center">${d > t ? 'Dia futuro.' : 'Nenhum treino registrado neste dia.'}</p></div>`;
  const p0 = activeProgram();
  if (p0 && d >= t && baseDay(p0, d)) {
    const sk = isSkipped(p0, d);
    html += `${sk ? '<div class="card"><p class="sub" style="margin:0;text-align:center">Dia marcado como sem treino.</p></div>' : ''}<button class="btn ghost block" style="margin-bottom:10px" data-act="skip-toggle" data-date="${date}">${sk ? 'Desmarcar dia sem treino' : 'Marcar como dia sem treino'}</button>`;
  }
  if (d <= t) {
    const p = activeProgram();
    const key = (plans.find(x => p && x.p.id === p.id) || plans[0] || {}).k || '';
    html += `<button class="btn block" data-act="checkin" data-date="${date}" data-key="${key}">${cis.length ? 'Adicionar outro check-in' : 'Registrar check-in'}</button>`;
  }
  setSheet(html);
}

/* ---------- Check-in ---------- */
let ci = null;
function openCheckin({ date, key, id }) {
  if (!S.programs.length) { toast('Crie um programa primeiro'); ui.tab = 'prog'; return render(); }
  if (id) {
    const c = S.checkins.find(x => x.id === id);
    const p = programById(c.programId) || activeProgram() || S.programs[0];
    ci = { id, programId: p.id, dayKey: c.dayKey, date: c.date, time: c.time, note: c.note || '', more: false,
      rows: Object.entries(c.ratings).map(([m, v]) => ({ m, v, skip: false })) };
  } else {
    const p = activeProgram() || S.programs[0];
    ci = { id: null, programId: p.id, dayKey: key || '', date, time: date === iso(new Date()) ? nowTime() : '18:00', note: '', more: false, rows: [] };
    if (!ci.dayKey) ci.dayKey = isRolling(p) ? p.days[nextRollingIdx(p)].key : p.days[0].key;
    ci.rows = dayMuscles(p, ci.dayKey).map(m => ({ m, v: 0, skip: false }));
  }
  drawCheckin();
}
function ciSetDay(key) {
  const p = programById(ci.programId), old = Object.fromEntries(ci.rows.map(r => [r.m, r.v]));
  ci.dayKey = key;
  ci.rows = dayMuscles(p, key).map(m => ({ m, v: old[m] || 0, skip: false }));
}
function drawCheckin() {
  const p = programById(ci.programId), keep = !!$('#sheet .ci-sheet');
  const others = allMuscles().filter(m => !ci.rows.some(r => r.m === m));
  setSheet(`<div class="ci-sheet">${sheetHead(ci.id ? 'Editar check-in' : 'Check-in')}
    ${S.programs.length > 1 ? `<label class="field"><span>Programa</span><select class="in" data-bind="ci-prog">${S.programs.map(x => `<option value="${x.id}" ${x.id === ci.programId ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select></label>` : ''}
    <div class="card"><div class="sub" style="margin-bottom:10px">Treino do dia</div>
      <div class="scroll-x">${p.days.map(d => `<button class="chip ${d.key === ci.dayKey ? 'on' : ''}" data-act="ci-day" data-key="${d.key}"><b>${d.key}</b> ${esc(d.muscles.slice(0, 3).join(', '))}</button>`).join('')}</div>
      <div class="two" style="margin-top:14px">
        <label class="field" style="margin:0"><span>Data</span><input class="in" type="date" value="${ci.date}" max="${iso(new Date())}" data-bind="ci-date"></label>
        <label class="field" style="margin:0"><span>Horário</span><input class="in" type="time" value="${ci.time}" data-bind="ci-time"></label>
      </div></div>
    <div class="card"><div class="card-h"><h2>Notas por grupo</h2><span class="sub">toque nas estrelas</span></div>
      <div class="mrow" style="border:0;padding-top:0"><div class="nm sub">Mesma nota para todos</div>${starsInput('all', 0)}</div>
      ${ci.rows.map(r => `<div class="mrow ${r.skip ? 'skip' : ''}">
        <button class="nm" data-act="ci-skip" data-m="${esc(r.m)}" title="Toque para pular este grupo"><span class="dot" style="background:${colorOf(r.m)}"></span><span style="overflow:hidden;text-overflow:ellipsis">${esc(r.m)}</span></button>${starsInput(r.m, r.v)}</div>`).join('')}
      <div style="margin-top:8px">${ci.more
        ? `<div class="chips">${others.map(m => `<button class="chip" data-act="ci-add" data-m="${esc(m)}">＋ ${esc(m)}</button>`).join('') || '<span class="sub">Todos os grupos já estão na lista.</span>'}</div>`
        : '<button class="link" data-act="ci-more">＋ Adicionar outro grupo</button>'}</div>
      <p class="sub" style="margin:10px 0 0">Toque no nome para pular um grupo que não treinou.</p></div>
    <label class="field"><span>Observação (opcional)</span><textarea class="in" rows="2" maxlength="200" data-bind="ci-note" placeholder="Ex.: treino pesado, pouco sono…">${esc(ci.note)}</textarea></label>
    <div class="sheet-foot"><button class="btn block" data-act="ci-save">Salvar check-in</button></div></div>`, keep);
}
const starsInput = (m, v) => `<div class="stars-in">${[1, 2, 3, 4, 5].map(i => `<button class="${i <= v ? 'on' : ''}" data-act="ci-star" data-m="${esc(m)}" data-v="${i}" aria-label="${i} estrelas">★</button>`).join('')}</div>`;

function saveCheckin() {
  const rows = ci.rows.filter(r => !r.skip);
  if (!rows.length) return toast('Inclua ao menos um grupo muscular');
  if (!ci.date || !ci.time) return toast('Informe data e horário');
  const ratings = {};
  rows.forEach(r => { ratings[r.m] = r.v; });
  const rec = { id: ci.id || uid(), programId: ci.programId, dayKey: ci.dayKey, date: ci.date, time: ci.time, ratings, note: ci.note.trim(), ts: Date.now(), u: stamp() };
  delete S.tomb[rec.id];
  const i = S.checkins.findIndex(c => c.id === rec.id);
  if (i >= 0) S.checkins[i] = rec; else S.checkins.push(rec);
  save();
  ci = null;
  toast('Check-in salvo 💪');
  closeSheet();
}

/* ---------- Estatísticas ---------- */
function viewStats() {
  const f = ui.stats, t = today0();
  const from = f.range ? addDays(t, -(f.range - 1)) : null, fromI = from ? iso(from) : '';
  const progs = f.prog === 'all' ? S.programs : S.programs.filter(p => p.id === f.prog);
  const head = pageHead('Estatísticas', '');
  const filters = `<div class="filters"><div class="scroll-x">${[[30, '30 dias'], [90, '90 dias'], [365, '1 ano'], [0, 'Tudo']].map(([v, l]) => `<button class="chip ${f.range === v ? 'on' : ''}" data-act="st-range" data-v="${v}">${l}</button>`).join('')}</div>
    <div class="scroll-x"><button class="chip ${f.prog === 'all' ? 'on' : ''}" data-act="st-prog" data-v="all">Todos os programas</button>${S.programs.map(p => `<button class="chip ${f.prog === p.id ? 'on' : ''}" data-act="st-prog" data-v="${p.id}">${esc(p.name)}</button>`).join('')}</div></div>`;
  const cis = S.checkins.filter(c => c.date >= fromI && (f.prog === 'all' || c.programId === f.prog));
  if (!cis.length) return head + filters + `<div class="card">${emptyState(IC.chart, 'Sem dados ainda', 'Faça seus primeiros check-ins para ver estatísticas de grupos, horários e notas.')}</div>`;

  /* aderência e faltas por dia da semana */
  const wd = Array.from({ length: 7 }, () => ({ planned: 0, done: 0 }));
  let planned = 0, done = 0;
  progs.forEach(p => plannedDays(p, from, t).forEach(x => { const w = wd[x.date.getDay()]; w.planned++; planned++; if (x.done) { w.done++; done++; } }));
  const adh = planned ? Math.round(100 * done / planned) : null;

  /* grupos */
  const mg = {};
  cis.forEach(c => Object.entries(c.ratings).forEach(([m, v]) => { (mg[m] = mg[m] || { n: 0, r: [] }).n++; if (v) mg[m].r.push(v); }));
  const mgList = Object.entries(mg).sort((a, b) => b[1].n - a[1].n);
  const mgMax = mgList[0][1].n;

  /* horários */
  const hours = new Array(24).fill(0);
  cis.forEach(c => hours[hourOf(c.time)]++);
  const hs = hours.map((n, h) => n ? h : -1).filter(h => h >= 0);
  let h0 = Math.max(0, Math.min(...hs) - 1), h1 = Math.min(23, Math.max(...hs) + 1);
  while (h1 - h0 < 7) { if (h0 > 0) h0--; if (h1 < 23) h1++; if (h0 === 0 && h1 === 23) break; }
  const hMax = Math.max(...hours);
  const topHour = hours.indexOf(hMax);

  /* horário × nota */
  const buckets = [['Madrugada', 0, 6], ['Manhã cedo', 6, 9], ['Fim da manhã', 9, 12], ['Almoço', 12, 15], ['Tarde', 15, 18], ['Início da noite', 18, 21], ['Noite', 21, 24]]
    .map(([l, a, b]) => {
      const rs = cis.filter(c => { const h = hourOf(c.time); return h >= a && h < b; }).map(ciAvg).filter(x => x);
      return { l, a, b, n: rs.length, avg: mean(rs) };
    }).filter(b => b.n);
  const ranked = buckets.filter(b => b.n >= 2).sort((a, b) => b.avg - a.avg);

  /* semanas */
  const weeks = [];
  const w0 = addDays(t, -t.getDay());
  for (let i = 7; i >= 0; i--) {
    const s = addDays(w0, -7 * i), e = addDays(s, 6);
    weeks.push({ l: brShort(iso(s)), n: S.checkins.filter(c => c.date >= iso(s) && c.date <= iso(e) && (f.prog === 'all' || c.programId === f.prog)).length });
  }
  const wMax = Math.max(1, ...weeks.map(w => w.n));

  const overall = mean(cis.map(ciAvg).filter(x => x));
  const freqHtml = freqStatsHtml(progs, from);
  const worst = wd.map((w, i) => ({ i, ...w, rate: w.planned ? 1 - w.done / w.planned : 0 })).filter(w => w.planned >= 2 && w.rate > 0).sort((a, b) => b.rate - a.rate)[0];

  return head + filters + `<div class="tiles four" style="margin-bottom:14px">
      <div class="tile" style="background:var(--card)"><b>${cis.length}</b><span>treinos</span></div>
      <div class="tile" style="background:var(--card)"><b>${adh === null ? '–' : adh + '%'}</b><span>aderência</span></div>
      <div class="tile" style="background:var(--card)"><b>${overall ? fmt1(overall) + ' ★' : '–'}</b><span>nota média</span></div>
      <div class="tile" style="background:var(--card)"><b>${streak()}</b><span>sequência atual</span></div></div>
    ${freqHtml}
    <div class="grid masonry">
    <div class="card"><div class="card-h"><h2>Grupos mais treinados</h2></div>
      ${mgList.map(([m, o]) => hbar(m, 100 * o.n / mgMax, `${o.n}× ${o.r.length ? '· ' + fmt1(mean(o.r)) + '★' : ''}`, colorOf(m), colorOf(m))).join('')}</div>

    <div class="card"><div class="card-h"><h2>Dias em que você falta</h2></div>
      ${planned ? wd.map((w, i) => w.planned ? hbar(WD[i], 100 * (1 - w.done / w.planned), `${w.planned - w.done} de ${w.planned}`, 'var(--bad)') : '').join('') : '<p class="sub">Sem dias planejados no período.</p>'}
      ${worst ? `<div class="insight">Você mais falta às <b>${WD_PLURAL[worst.i]}</b>: ${Math.round(worst.rate * 100)}% dos treinos planejados.</div>` : planned ? '<div class="insight">Nenhuma falta marcante. Continue assim! 💪</div>' : ''}</div>

    <div class="card"><div class="card-h"><h2>Horários dos treinos</h2></div>
      <div class="vbars">${hours.slice(h0, h1 + 1).map(n => `<div class="col">${n ? `<span class="val">${n}</span>` : ''}<div class="b ${n ? '' : 'zero'}" style="height:${n ? 8 + 92 * n / hMax : 3}%"></div></div>`).join('')}</div>
      <div class="vbars-x">${hours.slice(h0, h1 + 1).map((_, i) => `<span>${(h1 - h0 > 11 && (h0 + i) % 2) ? '' : (h0 + i) + 'h'}</span>`).join('')}</div>
      <div class="insight">Você treina mais por volta das <b>${pad(topHour)}h</b> (${hMax} ${hMax > 1 ? 'treinos' : 'treino'}).</div></div>

    <div class="card"><div class="card-h"><h2>Horário × nota</h2></div>
      ${buckets.length ? buckets.map(b => hbar(`${b.l}`, b.avg ? 100 * b.avg / 5 : 0, b.avg ? `${fmt1(b.avg)}★ · ${b.n}` : '–', 'var(--star)')).join('') : '<p class="sub">Dê notas aos grupos para cruzar com o horário.</p>'}
      ${ranked.length > 1 ? `<div class="insight">Suas melhores notas vêm no período <b>${ranked[0].l.toLowerCase()}</b> (${pad(ranked[0].a)}h–${pad(ranked[0].b)}h): ${fmt1(ranked[0].avg)}★, contra ${fmt1(ranked[ranked.length - 1].avg)}★ em ${ranked[ranked.length - 1].l.toLowerCase()}.</div>` : '<div class="insight">Registre mais treinos em horários diferentes para ver qual rende melhor.</div>'}</div>

    <div class="card"><div class="card-h"><h2>Nota por grupo muscular</h2></div>
      ${mgList.filter(([, o]) => o.r.length).sort((a, b) => mean(b[1].r) - mean(a[1].r)).map(([m, o]) => hbar(m, 100 * mean(o.r) / 5, fmt1(mean(o.r)) + '★', colorOf(m), colorOf(m))).join('') || '<p class="sub">Sem notas ainda.</p>'}</div>

    <div class="card"><div class="card-h"><h2>Treinos por semana</h2></div>
      <div class="vbars">${weeks.map(w => `<div class="col">${w.n ? `<span class="val">${w.n}</span>` : ''}<div class="b ${w.n ? '' : 'zero'}" style="height:${w.n ? 8 + 92 * w.n / wMax : 3}%"></div></div>`).join('')}</div>
      <div class="vbars-x">${weeks.map(w => `<span>${w.l}</span>`).join('')}</div></div>
    </div>`;
}

/** meta de treinar cada grupo ao menos 2× por semana: semana atual (com previsão) e semanas completas */
function freqStatsHtml(progs, from) {
  const t = today0(), thisWs = addDays(t, -t.getDay());
  const prog = ui.stats.prog === 'all' ? activeProgram() : programById(ui.stats.prog);
  const cis = S.checkins.filter(c => ui.stats.prog === 'all' || c.programId === ui.stats.prog);
  if (!cis.length) return '';
  const byWeek = {};
  cis.forEach(c => {
    const ws = iso(addDays(parseISO(c.date), -parseISO(c.date).getDay()));
    Object.keys(c.ratings).forEach(m => { ((byWeek[ws] = byWeek[ws] || {})[m] = byWeek[ws][m] || new Set()).add(c.date); });
  });
  const cnt = (ws, m) => (byWeek[ws] && byWeek[ws][m] ? byWeek[ws][m].size : 0);

  /* semana atual */
  const wsT = iso(thisWs), muscles = new Set(Object.keys(byWeek[wsT] || {}));
  if (prog) prog.days.forEach(d => d.muscles.forEach(m => muscles.add(m)));
  const ahead = {};
  if (prog) {
    for (let d = S.checkins.some(c => c.programId === prog.id && c.date === iso(t)) ? addDays(t, 1) : t; d < addDays(thisWs, 7); d = addDays(d, 1)) {
      const k = planKey(prog, d);
      if (k) dayMuscles(prog, k).forEach(m => { ahead[m] = (ahead[m] || 0) + 1; });
    }
  }
  const partial = !!prog && parseISO(prog.start) > thisWs;   // semana em que o programa começou: ainda curta
  const state = m => { const c = cnt(wsT, m); return c >= MIN_WEEK ? 'ok' : c + (ahead[m] || 0) >= MIN_WEEK ? 'track' : partial ? 'none' : 'risk'; };
  const rank = { risk: 0, none: 1, track: 2, ok: 3 };
  const cur = [...muscles].sort((x, y) => rank[state(x)] - rank[state(y)] || x.localeCompare(y));
  const risk = cur.filter(m => state(m) === 'risk');

  /* semanas completas */
  const first = cis.reduce((mn, c) => (c.date < mn ? c.date : mn), cis[0].date);
  let startD = from && from > parseISO(first) ? from : parseISO(first);
  let w = addDays(startD, -startD.getDay());
  if (w < startD) w = addDays(w, 7);
  const weeks = [];
  for (; w < thisWs; w = addDays(w, 7)) weeks.push(iso(w));
  const hist = [...new Set([...muscles, ...cis.flatMap(c => Object.keys(c.ratings))])].map(m => {
    const hit = weeks.filter(ws => cnt(ws, m) >= MIN_WEEK).length;
    return { m, hit, pct: weeks.length ? hit / weeks.length : 0, avg: weeks.length ? mean(weeks.map(ws => cnt(ws, m))) : 0 };
  }).sort((x, y) => x.pct - y.pct || x.avg - y.avg);
  const weak = hist.filter(h => h.pct < 0.5);

  return `<div class="card" style="margin-bottom:14px"><div class="card-h"><h2>Meta: ${MIN_WEEK}× por semana</h2><span class="sub">cada grupo, de dom a sáb</span></div>
    <div class="sub" style="margin-bottom:8px">Esta semana</div>
    <div class="chips">${cur.map(m => `<span class="chip ${state(m)}" title="${state(m) === 'track' ? 'Previsto pelo plano' : ''}"><i class="dot" style="background:${colorOf(m)}"></i>${esc(m)} ${cnt(wsT, m)}/${MIN_WEEK}${state(m) === 'ok' ? ' ✓' : ''}</span>`).join('')}</div>
    <div class="legend" style="margin-top:10px"><span><i style="background:var(--ok-soft)"></i>meta batida</span><span><i style="background:var(--accent-soft)"></i>vai bater se seguir o plano</span><span><i style="background:var(--bad-soft)"></i>em risco</span></div>
    ${partial ? '<div class="insight">Esta é a primeira semana do programa, então ela é mais curta. A meta passa a valer na próxima semana completa.</div>'
      : risk.length ? `<div class="insight"><b>Em risco esta semana:</b> ${risk.map(esc).join(', ')}. ${prog ? 'O plano restante não inclui esses grupos o suficiente.' : ''}</div>`
      : '<div class="insight">Todos os grupos estão batendo a meta ou no caminho certo.</div>'}
    <div class="sub" style="margin:18px 0 4px">Semanas completas${weeks.length ? ` (${weeks.length})` : ''}</div>
    ${weeks.length ? hist.map(h => hbar(h.m, 100 * h.pct, `${h.hit}/${weeks.length} sem · ${fmt1(h.avg)}×`, h.pct >= 0.75 ? 'var(--ok)' : h.pct >= 0.4 ? 'var(--star)' : 'var(--bad)', colorOf(h.m))).join('') : '<p class="sub" style="margin:0">Ainda não há semana completa no período.</p>'}
    ${weeks.length && weak.length ? `<div class="insight">Abaixo da meta na maioria das semanas: <b>${weak.map(h => esc(h.m)).join(', ')}</b>.</div>` : ''}</div>`;
}

/* ---------- Programa ---------- */
function viewProg() {
  const t = today0();
  const head = pageHead('Programa', 'Rotina, grupos musculares e plano', `<button class="btn sm" data-act="prog-new">＋ Novo</button>`);
  if (!S.programs.length) return head + `<div class="card">${emptyState(IC.prog, 'Nenhum programa', 'Crie sua primeira rotina de treino.', '<button class="btn" data-act="prog-new">Criar programa</button>')}</div>`;
  return head + `<div class="grid">${S.programs.map(p => {
    const end = programEnd(p), st = parseISO(p.start);
    const status = t < st ? 'Agendado' : end && t > end ? 'Encerrado' : 'Em andamento';
    const chipSt = on => `padding:4px 10px;font-size:13px;${on ? 'background:var(--accent-soft);color:var(--accent);font-weight:700' : ''}`;
    const sched = isRolling(p)
      ? [1, 2, 3, 4, 5, 6, 0].map(i => `<span class="chip" style="${chipSt(availDays(p).includes(i))}">${WD[i]} ${availDays(p).includes(i) ? '✓' : '–'}</span>`).join('')
      : [1, 2, 3, 4, 5, 6, 0].map(i => `<span class="chip" style="${chipSt(p.schedule[i])}">${WD[i]} ${p.schedule[i] || '–'}</span>`).join('');
    const nxt = isRolling(p) ? upcoming(p, 5) : [];
    const fq = Object.values(weeklyFreq(p)), okN = fq.filter(meets).length;
    return `<div class="card prog span2"><div class="card-h"><div><h3>${esc(p.name)}</h3><span class="sub">Rotina ${p.days.map(d => d.key).join('')} · ${isRolling(p) ? 'corrida' : 'convencional'} · ${p.weeks ? p.weeks + ' semanas' : 'sem data final'}</span></div>
      <span class="badge ${p.id === S.activeProgramId ? 'on' : ''}">${p.id === S.activeProgramId ? 'Ativo' : status}</span></div>
      <div class="prog-days">${p.days.map(d => `<div class="daybox"><div class="k">${d.key}</div><div class="chips">${d.muscles.map(chip).join('') || '<span class="sub">sem grupos</span>'}</div></div>`).join('')}</div>
      <div class="sub" style="margin:10px 0 8px">${brDate(p.start)}${end ? ' → ' + brDate(iso(end)) : ' → ∞'}</div>
      <div class="chips" style="gap:6px">${sched}</div>
      ${nxt.length ? `<div class="sub" style="margin:12px 0 6px">Próximos treinos</div><div class="chips" style="gap:6px">${nxt.map(x => `<span class="chip" style="padding:4px 10px;font-size:13px"><b>${x.key}</b> ${WD[x.date.getDay()]} ${brShort(iso(x.date))}</span>`).join('')}</div>` : ''}
      <p class="sub" style="margin:12px 0 0">Meta de ${MIN_WEEK}× por semana: <b style="color:${okN === fq.length ? 'var(--ok)' : 'var(--star)'}">${okN} de ${fq.length}</b> grupos</p>
      <div class="actions">${p.id === S.activeProgramId ? '' : `<button class="btn sm" data-act="prog-activate" data-id="${p.id}">Ativar</button>`}
        <button class="btn ghost sm" data-act="prog-edit" data-id="${p.id}">Editar</button>
        <button class="btn ghost sm" data-act="prog-dup" data-id="${p.id}">Duplicar</button>
        <button class="btn danger sm" data-act="prog-del" data-id="${p.id}">Excluir</button></div></div>`;
  }).join('')}</div>`;
}

/* ---------- Editor de programa ---------- */
let ed = null;
const defaultSchedule = n => Object.fromEntries((DEFAULT_DAYS[n] || DEFAULT_DAYS[7]).map((wd, i) => [wd, LETTERS[i]]));
function openProgEditor(id) {
  if (id) {
    const p = programById(id);
    ed = JSON.parse(JSON.stringify(p));
    ed.n = p.days.length;
    ed.mode = ed.mode || 'fixed'; ed.avail = ed.avail || [0, 1, 2, 3, 4, 5, 6]; ed.skips = ed.skips || [];
  } else {
    ed = { id: null, name: `Programa ${S.programs.length + 1}`, n: 3, days: [], start: iso(new Date()), weeks: 8, schedule: defaultSchedule(3), mode: 'fixed', avail: [0, 1, 2, 3, 4, 5, 6], skips: [] };
    edSetN(3, true);
  }
  drawEditor();
}
function edSetN(n, isNew) {
  ed.n = n;
  ed.days = Array.from({ length: n }, (_, i) => {
    const old = ed.days[i];
    return { key: LETTERS[i], muscles: old && old.muscles.length ? old.muscles : (TEMPLATES[n] || [])[i] ? [...TEMPLATES[n][i]] : [] };
  });
  if (isNew) ed.schedule = defaultSchedule(n);
  else {
    const keys = ed.days.map(d => d.key);
    Object.keys(ed.schedule).forEach(w => { if (!keys.includes(ed.schedule[w])) delete ed.schedule[w]; });
    if (!Object.keys(ed.schedule).length) ed.schedule = defaultSchedule(n);
  }
}
/** programa em edição como objeto (para prévias e para salvar) */
function edProgram() {
  return { id: ed.id, name: ed.name, routine: ed.days.map(d => d.key).join(''), days: ed.days, start: ed.start, weeks: ed.weeks,
    schedule: ed.schedule, mode: ed.mode, avail: ed.avail, skips: ed.skips };
}
/** quadro de frequência semanal: meta de treinar cada grupo ao menos 2× por semana */
function freqCardHtml(p, heading = '4 · Frequência semanal') {
  const list = Object.entries(weeklyFreq(p)).sort((x, y) => x[1] - y[1]);
  if (!list.length) return '';
  const low = list.filter(([, v]) => !meets(v)).map(([m]) => m);
  const absent = allMuscles().filter(m => !(m in weeklyFreq(p)));
  return `<div class="card"><h2>${heading}</h2><div class="sub" style="margin:-6px 0 10px">Meta: treinar cada grupo ao menos ${MIN_WEEK}× por semana${isRolling(p) ? ' (estimativa com os dias disponíveis)' : ''}</div>
    ${list.map(([m, v]) => hbar(m, Math.min(100, 100 * v / MIN_WEEK), `${fmt1(v)}×${meets(v) ? ' ✓' : ''}`, meets(v) ? 'var(--ok)' : 'var(--star)', colorOf(m))).join('')}
    <div class="insight">${low.length ? `<b>${low.length} de ${list.length}</b> grupos abaixo da meta: ${low.map(esc).join(', ')}. Coloque-os em mais um dia da rotina ou treine mais dias por semana.` : `Todos os <b>${list.length}</b> grupos chegam a ${MIN_WEEK}× por semana.`}</div>
    ${absent.length ? `<p class="sub" style="margin:10px 0 0">Fora do programa: ${absent.map(esc).join(', ')}.</p>` : ''}</div>`;
}
function drawEditor() {
  const end = ed.weeks > 0 ? iso(addDays(parseISO(ed.start), ed.weeks * 7 - 1)) : null;
  setSheet(`<div class="ed-sheet">${sheetHead(ed.id ? 'Editar programa' : 'Novo programa')}
    <label class="field"><span>Nome do programa</span><input class="in" value="${esc(ed.name)}" maxlength="40" data-bind="ed-name"></label>

    <div class="card"><h2>1 · Rotina</h2><div class="sub" style="margin:-6px 0 12px">Quantos dias de treino diferentes?</div>
      <div class="scroll-x">${[1, 2, 3, 4, 5, 6, 7].map(n => `<button class="chip ${ed.n === n ? 'on' : ''}" data-act="ed-n" data-n="${n}">${LETTERS.slice(0, n)}</button>`).join('')}</div></div>

    <div class="card"><h2>2 · Programa</h2><div class="sub" style="margin:-6px 0 6px">Grupos musculares de cada dia</div>
      ${ed.days.map((d, i) => `<div class="daybox" style="padding:12px 0;border-top:${i ? '1px solid var(--line)' : '0'}"><div class="k">${d.key}</div><div class="chips">
        ${allMuscles().map(m => `<button class="chip ${d.muscles.includes(m) ? 'on' : ''}" data-act="ed-m" data-d="${i}" data-m="${esc(m)}">${esc(m)}</button>`).join('')}
        <button class="chip" data-act="ed-newm" data-d="${i}">＋ Outro</button></div></div>`).join('')}</div>

    <div class="card"><h2>3 · Plano</h2>
      <div class="two"><label class="field"><span>Início</span><input class="in" type="date" value="${ed.start}" data-bind="ed-start"></label>
        <div class="field"><span>Duração</span><div class="stepper"><button data-act="ed-w" data-v="-1">−</button><b>${ed.weeks ? ed.weeks + ' sem' : '∞'}</b><button data-act="ed-w" data-v="1">＋</button></div></div></div>
      <div class="scroll-x" style="margin-bottom:6px">${[4, 8, 12, 16, 0].map(w => `<button class="chip ${ed.weeks === w ? 'on' : ''}" data-act="ed-wset" data-v="${w}">${w ? w + ' semanas' : 'Sem fim'}</button>`).join('')}</div>
      <p class="sub" style="margin:6px 0 16px">${end ? 'Termina em ' + brDate(end) : 'Sem data final'}</p>
      <div class="sub" style="margin-bottom:8px">Como organizar os treinos na semana?</div>
      <div class="seg" style="margin-bottom:12px"><button class="${ed.mode === 'fixed' ? 'on' : ''}" data-act="ed-mode" data-v="fixed">Convencional</button><button class="${ed.mode === 'rolling' ? 'on' : ''}" data-act="ed-mode" data-v="rolling">Corrida</button></div>
      ${ed.mode === 'fixed' ? `
      <p class="sub" style="margin:0 0 10px">Cada dia da semana tem sua rotina fixa (ex.: segunda = A, terça = B). Toque nos dias para escolher.</p>
      <div class="wk">${[0, 1, 2, 3, 4, 5, 6].map(i => `<button class="${ed.schedule[i] ? 'on' : ''}" data-act="ed-wd" data-i="${i}"><small>${WD[i]}</small><b>${ed.schedule[i] || '–'}</b></button>`).join('')}</div>` : `
      <p class="sub" style="margin:0 0 10px">As rotinas seguem em sequência (${ed.days.map(d => d.key).join(' → ')} → …). Se você faltar ou pular um dia, a próxima rotina não se perde: ela passa para o dia seguinte.</p>
      <div class="sub" style="margin-bottom:8px">Dias da semana em que você pode treinar</div>
      <div class="wk">${[0, 1, 2, 3, 4, 5, 6].map(i => `<button class="${ed.avail.includes(i) ? 'on' : ''}" data-act="ed-avail" data-i="${i}"><small>${WD[i]}</small><b>${ed.avail.includes(i) ? '✓' : '–'}</b></button>`).join('')}</div>
      <div class="sub" style="margin:16px 0 8px">Dias que você já sabe que vai pular</div>
      <div class="chips" style="margin-bottom:10px">${[...ed.skips].sort().filter(s => s >= iso(today0())).map(s => `<button class="chip" data-act="ed-skipdel" data-d="${s}">${brShort(s)} ${WD[parseISO(s).getDay()]} ✕</button>`).join('') || '<span class="sub">Nenhum. Você também marca pelo calendário ou na tela inicial.</span>'}</div>
      <div class="two"><input class="in" type="date" id="skip-date" min="${iso(today0())}" data-bind="ed-skipdate"><button class="btn ghost" data-act="ed-skipadd">Adicionar</button></div>
      <div class="sub" style="margin:16px 0 8px">Próximos treinos</div>
      <div class="chips">${upcoming(edProgram(), 7).map(x => `<span class="chip"><b>${x.key}</b> ${WD[x.date.getDay()]} ${brShort(iso(x.date))}</span>`).join('') || '<span class="sub">Escolha ao menos um dia disponível.</span>'}</div>`}
    </div>

    ${freqCardHtml(edProgram())}

    <div class="sheet-foot"><button class="btn block" data-act="ed-save">Salvar programa</button></div></div>`, !!$('#sheet .ed-sheet'));
}
function saveProgram() {
  ed.name = ed.name.trim() || 'Meu programa';
  if (ed.days.some(d => !d.muscles.length)) return toast('Escolha ao menos um grupo em cada dia');
  if (ed.mode === 'fixed' && !Object.keys(ed.schedule).length) return toast('Escolha ao menos um dia da semana');
  if (ed.mode === 'rolling' && !ed.avail.length) return toast('Escolha ao menos um dia disponível');
  const p = { id: ed.id || uid(), name: ed.name, routine: ed.days.map(d => d.key).join(''), days: ed.days, start: ed.start, weeks: ed.weeks, schedule: ed.schedule, mode: ed.mode, avail: ed.avail, skips: ed.skips, u: stamp() };
  const i = S.programs.findIndex(x => x.id === p.id);
  if (i >= 0) S.programs[i] = p; else { S.programs.push(p); S.activeProgramId = p.id; }
  if (!S.activeProgramId) S.activeProgramId = p.id;
  S.metaU = stamp();
  save(); ed = null;
  toast('Programa salvo');
  closeSheet();
}

/* ---------- Configurações / backup ---------- */
function openSettings() {
  setSheet(`${sheetHead('Configurações')}
    <div class="card"><h2>Nuvem</h2><div id="sync-card">${typeof Sync !== 'undefined' ? Sync.cardHtml() : ''}</div></div>
    <div class="card"><h2>Seus dados</h2>
      <p class="sub" style="margin-top:-6px">Os dados ficam salvos neste aparelho (e na nuvem, se você entrar com o Google). Você também pode guardar um arquivo de backup.</p>
      <div class="actions" style="margin-top:0"><button class="btn sm" data-act="export">Exportar backup</button><button class="btn ghost sm" data-act="import">Importar backup</button></div></div>
    ${installPrompt ? '<div class="card"><h2>Aplicativo</h2><button class="btn sm" data-act="install">Instalar na tela inicial</button></div>' : ''}
    <div class="card"><h2>Resumo</h2><p class="sub" style="margin:0">${S.programs.length} programa(s) · ${S.checkins.length} check-in(s)</p>
      <div class="actions"><button class="btn danger sm" data-act="wipe">Apagar tudo</button></div></div>`);
}
function exportData() {
  const blob = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = `meu-treino-${iso(new Date())}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
function importData() {
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = '.json,application/json';
  inp.onchange = async () => {
    try {
      const data = JSON.parse(await inp.files[0].text());
      if (!Array.isArray(data.programs) || !Array.isArray(data.checkins)) throw new Error('formato');
      if (!await confirmBox('Substituir todos os dados atuais pelo backup?', 'Substituir')) return;
      const t = stamp(), old = S;
      S = Object.assign(blank(), data, { tomb: {}, pushed: old.pushed, uid: old.uid, metaU: t });
      S.programs.forEach(p => { p.u = t; }); S.checkins.forEach(c => { c.u = t; });
      old.programs.forEach(p => { if (!S.programs.some(x => x.id === p.id)) S.tomb[p.id] = { k: 'program', u: t }; });
      old.checkins.forEach(c => { if (!S.checkins.some(x => x.id === c.id)) S.tomb[c.id] = { k: 'checkin', u: t }; });
      save(); closeSheet(); toast('Backup importado');
    } catch (e) { toast('Arquivo de backup inválido'); }
  };
  inp.click();
}

/* =====================================================================
   EVENTOS
   ===================================================================== */
const A = {
  tab: el => { ui.tab = el.dataset.tab; window.scrollTo(0, 0); render(); },
  close: () => closeSheet(),
  settings: () => openSettings(),
  day: el => openDay(el.dataset.date),
  checkin: el => openCheckin({ date: el.dataset.date, key: el.dataset.key }),
  'cal-prog': el => { ui.cal.prog = el.dataset.v; render(); },
  'cal-muscle': el => { ui.cal.muscle = el.dataset.v; render(); },
  'cal-mode': el => { ui.cal.mode = el.dataset.v; render(); },
  'cal-nav': el => { const d = new Date(ui.cal.y, ui.cal.m + +el.dataset.v, 1); ui.cal.y = d.getFullYear(); ui.cal.m = d.getMonth(); render(); },
  'cal-today': () => { const d = new Date(); ui.cal.y = d.getFullYear(); ui.cal.m = d.getMonth(); render(); },
  'st-range': el => { ui.stats.range = +el.dataset.v; render(); },
  'st-prog': el => { ui.stats.prog = el.dataset.v; render(); },

  'ci-day': el => { ciSetDay(el.dataset.key); drawCheckin(); },
  'ci-star': el => {
    const v = +el.dataset.v, m = el.dataset.m;
    if (m === 'all') ci.rows.forEach(r => { if (!r.skip) r.v = v; });
    else { const r = ci.rows.find(x => x.m === m); r.v = r.v === v ? 0 : v; }
    drawCheckin();
  },
  'ci-skip': el => { const r = ci.rows.find(x => x.m === el.dataset.m); r.skip = !r.skip; drawCheckin(); },
  'ci-more': () => { ci.more = true; drawCheckin(); },
  'ci-add': el => { ci.rows.push({ m: el.dataset.m, v: 0, skip: false }); drawCheckin(); },
  'ci-save': () => saveCheckin(),
  'ci-edit': el => openCheckin({ id: el.dataset.id }),
  'ci-del': async el => {
    if (!await confirmBox('Excluir este check-in?', 'Excluir')) return;
    const c = S.checkins.find(x => x.id === el.dataset.id);
    S.checkins = S.checkins.filter(x => x.id !== el.dataset.id); tombstone('checkin', el.dataset.id); save();
    openDay(c.date); toast('Check-in excluído');
  },

  'prog-new': () => openProgEditor(),
  'prog-edit': el => openProgEditor(el.dataset.id),
  'prog-activate': el => { S.activeProgramId = el.dataset.id; S.metaU = stamp(); save(); render(); toast('Programa ativado'); },
  'prog-dup': el => {
    const p = JSON.parse(JSON.stringify(programById(el.dataset.id)));
    p.id = uid(); p.name += ' (cópia)'; p.u = stamp(); S.programs.push(p); save(); render();
  },
  'prog-del': async el => {
    if (!await confirmBox('Excluir este programa? O histórico de check-ins será mantido.', 'Excluir')) return;
    S.programs = S.programs.filter(p => p.id !== el.dataset.id);
    tombstone('program', el.dataset.id);
    if (S.activeProgramId === el.dataset.id) { S.activeProgramId = S.programs[0] ? S.programs[0].id : null; S.metaU = stamp(); }
    save(); render();
  },
  'ed-n': el => { edSetN(+el.dataset.n, !ed.id); drawEditor(); },
  'ed-m': el => {
    const d = ed.days[+el.dataset.d], m = el.dataset.m;
    d.muscles = d.muscles.includes(m) ? d.muscles.filter(x => x !== m) : [...d.muscles, m];
    drawEditor();
  },
  'ed-newm': async el => {
    const name = ((await promptBox('Nome do novo grupo muscular:')) || '').trim().slice(0, 24);
    if (!name) return;
    const found = allMuscles().find(m => m.toLowerCase() === name.toLowerCase());
    const m = found || name;
    if (!found) { S.customMuscles.push(name); S.metaU = stamp(); save(); }
    const d = ed.days[+el.dataset.d];
    if (!d.muscles.includes(m)) d.muscles.push(m);
    drawEditor();
  },
  'ed-w': el => { ed.weeks = Math.max(0, ed.weeks + +el.dataset.v); drawEditor(); },
  'ed-wset': el => { ed.weeks = +el.dataset.v; drawEditor(); },
  'ed-wd': el => {
    const i = +el.dataset.i, order = [null, ...ed.days.map(d => d.key)];
    const next = order[(order.indexOf(ed.schedule[i] || null) + 1) % order.length];
    if (next) ed.schedule[i] = next; else delete ed.schedule[i];
    drawEditor();
  },
  'ed-save': () => saveProgram(),
  'ed-mode': el => { ed.mode = el.dataset.v; drawEditor(); },
  'ed-avail': el => {
    const i = +el.dataset.i;
    ed.avail = ed.avail.includes(i) ? ed.avail.filter(x => x !== i) : [...ed.avail, i].sort();
    drawEditor();
  },
  'ed-skipadd': () => {
    const v = ($('#skip-date') || {}).value;
    if (!v) return toast('Escolha a data');
    if (!ed.skips.includes(v)) ed.skips.push(v);
    drawEditor();
  },
  'ed-skipdel': el => { ed.skips = ed.skips.filter(x => x !== el.dataset.d); drawEditor(); },
  'skip-toggle': el => {
    const p = activeProgram(), di = el.dataset.date;
    if (!p) return;
    p.skips = p.skips || [];
    const had = p.skips.includes(di);
    p.skips = had ? p.skips.filter(x => x !== di) : [...p.skips, di];
    p.u = stamp(); save();
    toast(had ? 'Dia desmarcado' : isRolling(p) ? 'Dia pulado. A sequência foi ajustada' : 'Dia sem treino marcado');
    if (sheetOpen) openDay(di); else render();
  },

  login: () => Sync.login(),
  logout: () => Sync.logout(),
  'sync-now': () => Sync.now(),
  export: () => exportData(),
  import: () => importData(),
  install: async () => { if (installPrompt) { installPrompt.prompt(); await installPrompt.userChoice; installPrompt = null; closeSheet(); } },
  wipe: async () => {
    if (!await confirmBox('Apagar TODOS os programas e check-ins? Se você estiver conectado à nuvem, eles também serão apagados dela e dos outros aparelhos. Isso não pode ser desfeito.', 'Apagar tudo')) return;
    const t = stamp(), old = S;
    S = Object.assign(blank(), { pushed: old.pushed, uid: old.uid, metaU: t });
    old.programs.forEach(p => { S.tomb[p.id] = { k: 'program', u: t }; });
    old.checkins.forEach(c => { S.tomb[c.id] = { k: 'checkin', u: t }; });
    save(); closeSheet(); toast('Dados apagados');
  },
};

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (el && A[el.dataset.act]) A[el.dataset.act](el, e);
});
document.addEventListener('input', e => {
  const b = e.target.dataset && e.target.dataset.bind;
  if (!b) return;
  const v = e.target.value;
  if (b === 'ed-name') ed.name = v;
  else if (b === 'ed-start') { if (v) ed.start = v; }
  else if (b === 'ci-date') { ci.date = v; }
  else if (b === 'ci-time') ci.time = v;
  else if (b === 'ci-note') ci.note = v;
});
document.addEventListener('change', e => {
  const b = e.target.dataset && e.target.dataset.bind;
  if (b === 'ed-start') drawEditor();
  if (b === 'ci-prog') {
    ci.programId = e.target.value;
    const p = programById(ci.programId);
    ci.dayKey = p.days[0].key;
    ci.rows = dayMuscles(p, ci.dayKey).map(m => ({ m, v: 0, skip: false }));
    drawCheckin();
  }
});
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installPrompt = e; });

/* ---------- início ---------- */
render();
if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
document.addEventListener('visibilitychange', () => { if (!document.hidden && !sheetOpen) render(); });
