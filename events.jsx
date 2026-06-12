// events.jsx — SINGLE SOURCE OF TRUTH for all agenda views + calendar sync layer.
// Daily / Weekly / Monthly all read from this one store. Create in any view and
// it appears in all three. Backed by localStorage; reactive via a tiny pub/sub.
// The Google/Apple sync layer is a faithful CLIENT-SIDE SIMULATION (real OAuth +
// CalDAV require a backend with secrets).

const EventStore = (() => {
  const KEY = 'ps_events';
  const SYNC_KEY = 'ps_calsync';
  const LOG_KEY = 'ps_synclog';
  const TODAY = new Date().toISOString().slice(0, 10);

  const listeners = new Set();
  const emit = () => listeners.forEach((l) => l());

  const toHM = (h) => `${String(Math.floor(h)).padStart(2, '0')}:${String(Math.round((h % 1) * 60)).padStart(2, '0')}`;
  const fromHM = (s) => { const [h, m] = s.split(':').map(Number); return h + (m || 0) / 60; };

  const uid = (p = 'ev') => p + '_' + Math.random().toString(36).slice(2, 9);

  // Start with empty events — user adds their own
  function seed() { return []; }

  function load(key, fallback) {
    try { const r = localStorage.getItem(key); if (r) return JSON.parse(r); } catch (e) {}
    return fallback;
  }

  let events = load(KEY, null) || seed();
  let sync = load(SYNC_KEY, null) || { google: false, apple: false, googleAt: null, appleAt: null, syncing: false };
  let log = load(LOG_KEY, null) || [];

  const persistE = () => { localStorage.setItem(KEY, JSON.stringify(events)); emit(); };
  const persistS = () => { localStorage.setItem(SYNC_KEY, JSON.stringify(sync)); emit(); };
  const persistL = () => { localStorage.setItem(LOG_KEY, JSON.stringify(log.slice(0, 40))); emit(); };

  function addLog(kind, msg) {
    log = [{ id: uid('lg'), kind, msg, at: Date.now() }, ...log].slice(0, 40);
    persistL();
  }

  function add(ev) {
    const rec = { id: uid(), source: 'planner', googleId: null, appleId: null, ...ev };
    events = [...events, rec];
    persistE();
    pushRemote(rec, 'create');
    return rec;
  }
  function update(id, patch) {
    events = events.map((e) => (e.id === id ? { ...e, ...patch } : e));
    persistE();
    const rec = events.find((e) => e.id === id);
    if (rec) pushRemote(rec, 'update');
  }
  function remove(id) {
    const rec = events.find((e) => e.id === id);
    events = events.filter((e) => e.id !== id);
    persistE();
    if (rec) pushRemote(rec, 'delete');
  }

  function pushRemote(rec, op) {
    const targets = [];
    if (sync.google) targets.push('Google');
    if (sync.apple) targets.push('Apple');
    if (!targets.length) return;
    if (op === 'create') {
      const patch = {};
      if (sync.google && !rec.googleId) patch.googleId = 'g_' + uid();
      if (sync.apple && !rec.appleId) patch.appleId = 'a_' + uid();
      if (Object.keys(patch).length) {
        events = events.map((e) => (e.id === rec.id ? { ...e, ...patch } : e));
        localStorage.setItem(KEY, JSON.stringify(events));
      }
    }
    const verb = { create: 'Criado', update: 'Atualizado', delete: 'Excluído' }[op];
    addLog('out', `${verb} "${rec.titulo}" → ${targets.join(' + ')}`);
  }

  function connect(provider) {
    sync = { ...sync, [provider]: true, [provider + 'At']: Date.now() };
    persistS();
    const idKey = provider === 'google' ? 'googleId' : 'appleId';
    const prefix = provider === 'google' ? 'g_' : 'a_';
    let n = 0;
    events = events.map((e) => { if (!e[idKey]) { n++; return { ...e, [idKey]: prefix + uid() }; } return e; });
    localStorage.setItem(KEY, JSON.stringify(events));
    addLog('out', `${provider === 'google' ? 'Google' : 'Apple'} Calendar conectado — ${n} eventos enviados`);
    emit();
  }
  function disconnect(provider) {
    sync = { ...sync, [provider]: false, [provider + 'At']: null };
    persistS();
    addLog('sys', `${provider === 'google' ? 'Google' : 'Apple'} Calendar desconectado`);
  }

  function runSync() {
    if (!sync.google && !sync.apple) return;
    sync = { ...sync, syncing: true }; persistS();
    setTimeout(() => {
      const now = Date.now();
      sync = { ...sync, syncing: false,
        googleAt: sync.google ? now : sync.googleAt,
        appleAt: sync.apple ? now : sync.appleAt };
      persistS();
      addLog('in', 'Sincronização concluída — agenda atualizada');
    }, 1400);
  }

  function simulateInbound(kind) {
    if (!sync.google && !sync.apple) return false;
    const src = sync.google ? 'Google' : 'Apple';
    if (kind === 'move') {
      const target = events[0];
      if (target) {
        events = events.map((e) => (e.id === target.id ? { ...e, ini: e.ini + 1, fim: e.fim + 1 } : e));
        persistE();
        addLog('in', `${src}: "${target.titulo}" movido para ${toHM(target.ini + 1)}`);
      }
    } else if (kind === 'create') {
      const rec = { id: uid(), titulo: 'Reunião adicionada no ' + src, cat: 'Trabalho',
        date: TODAY, ini: 16, fim: 16.5, local: src, note: '', source: src.toLowerCase(),
        googleId: src === 'Google' ? 'g_' + uid() : null, appleId: src === 'Apple' ? 'a_' + uid() : null };
      events = [...events, rec]; persistE();
      addLog('in', `${src}: novo evento "${rec.titulo}" recebido`);
    } else if (kind === 'delete') {
      const target = [...events].reverse().find((e) => e.source !== 'planner') || events[events.length - 1];
      if (target) {
        events = events.filter((e) => e.id !== target.id); persistE();
        addLog('in', `${src}: "${target.titulo}" excluído remotamente`);
      }
    }
    return true;
  }

  return {
    TODAY, toHM, fromHM,
    getEvents: () => events,
    getSync: () => sync,
    getLog: () => log,
    subscribe: (fn) => { listeners.add(fn); return () => listeners.delete(fn); },
    add, update, remove, connect, disconnect, runSync, simulateInbound,
  };
})();
window.EventStore = EventStore;

// ── Agenda category store ─────────────────────────────────────────────────────
const AgendaCatStore = (() => {
  const KEY = 'ps_agenda_cats';
  const DEFAULT_CATS = [
    { name: 'Trabalho',    color: '#9E4A69' },
    { name: 'Estudos',     color: '#7c93c4' },
    { name: 'Saúde',       color: '#4f9d7e' },
    { name: 'Financeiro',  color: '#d29a52' },
    { name: 'Pessoal',     color: '#C67C96' },
    { name: 'Casamento',   color: '#D6A1B5' },
    { name: 'Veterinária', color: '#caa7d0' },
  ];

  const listeners = new Set();
  const emit = () => listeners.forEach(fn => fn());

  function load() {
    try { const r = localStorage.getItem(KEY); if (r) return JSON.parse(r); } catch (e) {}
    return null;
  }

  let cats = load() || DEFAULT_CATS.map(c => ({ ...c }));

  const persist = () => { localStorage.setItem(KEY, JSON.stringify(cats)); emit(); };

  return {
    getAll: () => cats,
    toColorMap: () => Object.fromEntries(cats.map(c => [c.name, c.color])),
    add(name, color) {
      const trimmed = name.trim();
      if (!trimmed || cats.find(c => c.name.toLowerCase() === trimmed.toLowerCase())) return false;
      cats = [...cats, { name: trimmed, color }];
      persist();
      return true;
    },
    remove(name) {
      if (DEFAULT_CATS.find(c => c.name === name)) return false; // protect defaults
      cats = cats.filter(c => c.name !== name);
      persist();
      return true;
    },
    subscribe: (fn) => { listeners.add(fn); return () => listeners.delete(fn); },
  };
})();
window.AgendaCatStore = AgendaCatStore;

function useAgendaCats() {
  const [, force] = React.useState(0);
  React.useEffect(() => AgendaCatStore.subscribe(() => force(n => n + 1)), []);
  return AgendaCatStore.getAll();
}
window.useAgendaCats = useAgendaCats;

function useEventStore() {
  const [, force] = React.useState(0);
  React.useEffect(() => EventStore.subscribe(() => force((n) => n + 1)), []);
  return EventStore;
}
window.useEventStore = useEventStore;

// Dynamic calendar helpers — week computed from today, not hardcoded
const Cal = {
  get today() { return new Date().toISOString().slice(0, 10); },
  get todayDay() { return new Date().getDate(); },
  get weekDates() {
    const d = new Date(this.today + 'T12:00');
    const dow = d.getDay() === 0 ? 6 : d.getDay() - 1; // Mon=0..Sun=6
    return Array.from({ length: 7 }, (_, i) => {
      const dt = new Date(d);
      dt.setDate(d.getDate() - dow + i);
      return dt.toISOString().slice(0, 10);
    });
  },
  dayOf: (iso) => parseInt(iso.slice(8, 10), 10),
  weekIndexOf(iso) { return this.weekDates.indexOf(iso); },
};
window.Cal = Cal;
