// data.jsx — localStorage-backed stores for Finance, Tasks, Goals, Habits.
// All stores start EMPTY — no mocked data. User adds their own entries.
// Pattern mirrors EventStore: pub/sub, persist on every mutation.

const _uid = (p = 'x') => p + '_' + Math.random().toString(36).slice(2, 9);
const _load = (key, fallback) => { try { const r = localStorage.getItem(key); if (r) return JSON.parse(r); } catch (e) {} return fallback; };

// ─── Formatters & shared constants ─────────────────────────────────────────
const brl = (n) => (n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
window.brl = brl;

const catColors = {
  Trabalho: '#9E4A69', Estudos: '#7c93c4', Saúde: '#4f9d7e',
  Financeiro: '#d29a52', Pessoal: '#C67C96', Casamento: '#D6A1B5', Veterinária: '#caa7d0',
};
window.catColors = catColors;

const prioColor = { Alta: '#c96079', Média: '#d29a52', Baixa: '#4f9d7e' };
window.prioColor = prioColor;

const ICON_LIST = ['wallet','heart','shield','car','plane','cap','sparkle','rings','droplet','leaf','flame','dumbbell','book','salad','target','grid','calMonth'];
const CAT_FINANCE = ['Alimentação','Moradia','Mercado','Saúde','Transporte','Pets','Estudos','Casamento','Lazer','Assinaturas','Outros'];
const TASK_TAGS = Object.keys(catColors);
window.ICON_LIST = ICON_LIST;
window.CAT_FINANCE = CAT_FINANCE;
window.TASK_TAGS = TASK_TAGS;

// ─── FinanceStore ────────────────────────────────────────────────────────────
const FinanceStore = (() => {
  const KEY = 'ps_finance';
  const listeners = new Set();
  const emit = () => listeners.forEach((l) => l());

  const EMPTY = { receitas: [], despesas: [] };

  let state = _load(KEY, null) || EMPTY;
  const persist = () => { localStorage.setItem(KEY, JSON.stringify(state)); emit(); };

  const getReceitas = () => state.receitas;
  const getDespesas = () => state.despesas;

  const totalReceitas = () => state.receitas.reduce((s, r) => s + (r.valor || 0), 0);
  const totalDespesas = () => state.despesas.reduce((s, d) => s + (d.valor || 0), 0);

  const getSaldo = () => totalReceitas() - totalDespesas();
  const getEntradasMes = () => totalReceitas();
  const getSaidasMes = () => totalDespesas();
  const getEconomiaMes = () => totalReceitas() - totalDespesas();

  const getCategorias = () => {
    const map = {};
    state.despesas.forEach((d) => {
      const cat = d.cat || 'Outros';
      map[cat] = (map[cat] || 0) + (d.valor || 0);
    });
    const CAT_COLORS = {
      Alimentação: '#d29a52', Moradia: '#9E4A69', Mercado: '#C67C96',
      Saúde: '#7c93c4', Transporte: '#9fb2e0', Pets: '#caa7d0',
      Estudos: '#b06a86', Casamento: '#D6A1B5', Lazer: '#e0a6bd',
      Assinaturas: '#b8c4e6', Outros: '#97798a',
    };
    const CAT_ICONS = {
      Alimentação: 'salad', Moradia: 'pin', Mercado: 'cart',
      Saúde: 'heart', Transporte: 'car', Pets: 'paw',
      Estudos: 'cap', Casamento: 'rings', Lazer: 'sparkle',
      Assinaturas: 'tv', Outros: 'receipt',
    };
    return Object.entries(map)
      .map(([nome, valor]) => ({ nome, valor, cor: CAT_COLORS[nome] || '#97798a', icon: CAT_ICONS[nome] || 'receipt' }))
      .sort((a, b) => b.valor - a.valor);
  };

  const getContasVencer = () => {
    const today = new Date();
    const curDay = today.getDate();
    return state.despesas
      .map((d) => ({ ...d, em: d.dia - curDay }))
      .filter((d) => d.em >= 0 && d.em <= 14)
      .sort((a, b) => a.em - b.em)
      .slice(0, 5);
  };

  // Last 6 months evolution — computed from receitas/despesas grouped by (month, year)
  const getEvolucao = () => {
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return { mes: ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'][d.getMonth()], y: d.getFullYear(), m: d.getMonth(), entrada: 0, saida: 0 };
    });
    // Current implementation: all entries are assumed to be current month
    // In a real app we'd store dates per entry. Here we spread totals across the last month.
    const lastIdx = months.length - 1;
    months[lastIdx].entrada = totalReceitas();
    months[lastIdx].saida = totalDespesas();
    return months;
  };

  const add = (tipo, entry) => {
    const rec = { id: _uid(tipo[0]), ...entry };
    if (tipo === 'receita') state = { ...state, receitas: [...state.receitas, rec] };
    else state = { ...state, despesas: [...state.despesas, rec] };
    persist();
    return rec;
  };
  const update = (tipo, id, patch) => {
    const key = tipo === 'receita' ? 'receitas' : 'despesas';
    state = { ...state, [key]: state[key].map((e) => (e.id === id ? { ...e, ...patch } : e)) };
    persist();
  };
  const remove = (tipo, id) => {
    const key = tipo === 'receita' ? 'receitas' : 'despesas';
    state = { ...state, [key]: state[key].filter((e) => e.id !== id) };
    persist();
  };

  return {
    getReceitas, getDespesas, getSaldo, getEntradasMes, getSaidasMes,
    getEconomiaMes, getCategorias, getContasVencer, getEvolucao,
    add, update, remove,
    subscribe: (fn) => { listeners.add(fn); return () => listeners.delete(fn); },
  };
})();
window.FinanceStore = FinanceStore;

function useFinanceStore() {
  const [, force] = React.useState(0);
  React.useEffect(() => FinanceStore.subscribe(() => force((n) => n + 1)), []);
  return FinanceStore;
}
window.useFinanceStore = useFinanceStore;

// ─── TaskStore ───────────────────────────────────────────────────────────────
const TaskStore = (() => {
  const KEY = 'ps_tarefas_v2';
  const listeners = new Set();
  const emit = () => listeners.forEach((l) => l());
  const COLS = ['A Fazer', 'Em Andamento', 'Concluído'];

  const EMPTY = { 'A Fazer': [], 'Em Andamento': [], 'Concluído': [] };
  let state = _load(KEY, null) || EMPTY;
  const persist = () => { localStorage.setItem(KEY, JSON.stringify(state)); emit(); };

  const getCols = () => state;

  const add = (col, task) => {
    const rec = { id: _uid('t'), ...task };
    state = { ...state, [col]: [...(state[col] || []), rec] };
    persist();
    return rec;
  };

  const move = (id, toCol) => {
    let card = null;
    const next = {};
    COLS.forEach((c) => {
      const idx = (state[c] || []).findIndex((t) => t.id === id);
      if (idx >= 0) { card = state[c][idx]; next[c] = state[c].filter((t) => t.id !== id); }
      else next[c] = [...(state[c] || [])];
    });
    if (card) { next[toCol] = [card, ...next[toCol]]; state = next; persist(); }
  };

  const update = (id, patch) => {
    const next = {};
    COLS.forEach((c) => { next[c] = (state[c] || []).map((t) => (t.id === id ? { ...t, ...patch } : t)); });
    state = next; persist();
  };

  const remove = (id) => {
    const next = {};
    COLS.forEach((c) => { next[c] = (state[c] || []).filter((t) => t.id !== id); });
    state = next; persist();
  };

  return {
    COLS, getCols, add, move, update, remove,
    subscribe: (fn) => { listeners.add(fn); return () => listeners.delete(fn); },
  };
})();
window.TaskStore = TaskStore;

function useTaskStore() {
  const [, force] = React.useState(0);
  React.useEffect(() => TaskStore.subscribe(() => force((n) => n + 1)), []);
  return TaskStore;
}
window.useTaskStore = useTaskStore;

// ─── GoalStore ───────────────────────────────────────────────────────────────
const GoalStore = (() => {
  const KEY = 'ps_metas';
  const listeners = new Set();
  const emit = () => listeners.forEach((l) => l());

  let state = _load(KEY, null) || [];
  const persist = () => { localStorage.setItem(KEY, JSON.stringify(state)); emit(); };

  const getAll = () => state;

  const add = (goal) => {
    const rec = { id: _uid('m'), atual: 0, ...goal };
    state = [...state, rec]; persist(); return rec;
  };
  const update = (id, patch) => {
    state = state.map((m) => (m.id === id ? { ...m, ...patch } : m)); persist();
  };
  const remove = (id) => { state = state.filter((m) => m.id !== id); persist(); };
  const addValue = (id, amount) => {
    state = state.map((m) => m.id === id ? { ...m, atual: Math.min(m.alvo, (m.atual || 0) + amount) } : m);
    persist();
  };

  return {
    getAll, add, update, remove, addValue,
    subscribe: (fn) => { listeners.add(fn); return () => listeners.delete(fn); },
  };
})();
window.GoalStore = GoalStore;

function useGoalStore() {
  const [, force] = React.useState(0);
  React.useEffect(() => GoalStore.subscribe(() => force((n) => n + 1)), []);
  return GoalStore;
}
window.useGoalStore = useGoalStore;

// ─── HabitStore ──────────────────────────────────────────────────────────────
const HabitStore = (() => {
  const KEY = 'ps_habitos_v2';
  const listeners = new Set();
  const emit = () => listeners.forEach((l) => l());

  let state = _load(KEY, null) || [];
  const persist = () => { localStorage.setItem(KEY, JSON.stringify(state)); emit(); };

  const getAll = () => state;

  const add = (habit) => {
    const rec = { id: _uid('h'), seq: 0, melhor: 0, hoje: 0, semana: [0,0,0,0,0,0,0], ...habit };
    state = [...state, rec]; persist(); return rec;
  };
  const update = (id, patch) => {
    state = state.map((h) => (h.id === id ? { ...h, ...patch } : h)); persist();
  };
  const remove = (id) => { state = state.filter((h) => h.id !== id); persist(); };

  const markToday = (id) => {
    const now = new Date();
    const dow = now.getDay() === 0 ? 6 : now.getDay() - 1; // Mon=0
    state = state.map((h) => {
      if (h.id !== id) return h;
      const done = h.hoje >= h.meta;
      const novoHoje = done ? 0 : h.meta;
      const novaSeq = done ? Math.max(0, h.seq - 1) : h.seq + 1;
      const novaSemana = [...h.semana];
      novaSemana[dow] = done ? 0 : 1;
      return { ...h, hoje: novoHoje, seq: novaSeq, melhor: Math.max(h.melhor, novaSeq), semana: novaSemana };
    });
    persist();
  };

  return {
    getAll, add, update, remove, markToday,
    subscribe: (fn) => { listeners.add(fn); return () => listeners.delete(fn); },
  };
})();
window.HabitStore = HabitStore;

function useHabitStore() {
  const [, force] = React.useState(0);
  React.useEffect(() => HabitStore.subscribe(() => force((n) => n + 1)), []);
  return HabitStore;
}
window.useHabitStore = useHabitStore;
