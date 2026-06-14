// data.jsx — localStorage-backed stores. Starts EMPTY, no mocked data.
// Stores: Finance (+ installments + cards), CustomCategory, Card, Task, Goal, Habit.

const _uid  = (p = 'x') => p + '_' + Math.random().toString(36).slice(2, 9);
const _load = (key, fallback) => { try { const r = localStorage.getItem(key); if (r) return JSON.parse(r); } catch(e){} return fallback; };
const _mesRef = (offsetMonths = 0) => {
  const d = new Date();
  d.setMonth(d.getMonth() + offsetMonths);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
};
const _mesAtual = () => _mesRef(0);

// ─── Formatters & shared constants ──────────────────────────────────────────
const brl = (n) => (n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
window.brl = brl;

const catColors = {
  Trabalho: '#9E4A69', Estudos: '#7c93c4', Saúde: '#4f9d7e',
  Financeiro: '#d29a52', Pessoal: '#C67C96', Casamento: '#D6A1B5', Veterinária: '#caa7d0',
};
window.catColors = catColors;

const prioColor = { Alta: '#c96079', Média: '#d29a52', Baixa: '#4f9d7e' };
window.prioColor = prioColor;

const ICON_LIST = [
  'wallet','heart','shield','car','plane','cap','sparkle','rings',
  'droplet','leaf','flame','dumbbell','book','salad','target','grid',
  'calMonth','sun','bell','clock','pin','cart','bus','paw','tv',
  'receipt','link','sync','settings','kanban','edit','search',
];
const CAT_FINANCE = ['Alimentação','Moradia','Mercado','Saúde','Transporte','Pets','Estudos','Casamento','Lazer','Assinaturas','Outros'];
const TASK_TAGS   = Object.keys(catColors);
window.ICON_LIST  = ICON_LIST;
window.CAT_FINANCE = CAT_FINANCE;
window.TASK_TAGS   = TASK_TAGS;

// default category colors/icons for finance
const CAT_FIN_COLORS = {
  Alimentação:'#d29a52', Moradia:'#9E4A69', Mercado:'#C67C96',
  Saúde:'#7c93c4', Transporte:'#9fb2e0', Pets:'#caa7d0',
  Estudos:'#b06a86', Casamento:'#D6A1B5', Lazer:'#e0a6bd',
  Assinaturas:'#b8c4e6', Outros:'#97798a',
};
const CAT_FIN_ICONS = {
  Alimentação:'salad', Moradia:'pin', Mercado:'cart',
  Saúde:'heart', Transporte:'car', Pets:'paw',
  Estudos:'cap', Casamento:'rings', Lazer:'sparkle',
  Assinaturas:'tv', Outros:'receipt',
};
window.CAT_FIN_COLORS = CAT_FIN_COLORS;
window.CAT_FIN_ICONS  = CAT_FIN_ICONS;

// ─── CustomCategoryStore ─────────────────────────────────────────────────────
// Stores user-created categories for finance (receitas + despesas)
const CustomCategoryStore = (() => {
  const KEY = 'ps_custom_cats';
  const listeners = new Set();
  const emit = () => listeners.forEach(l => l());

  let state = _load(KEY, []);
  const persist = () => { localStorage.setItem(KEY, JSON.stringify(state)); emit(); };

  const getAll  = () => state;
  const getReceita = () => state.filter(c => c.tipo === 'receita' || c.tipo === 'ambos');
  const getDespesa = () => state.filter(c => c.tipo === 'despesa' || c.tipo === 'ambos');

  const add = (cat) => {
    const rec = { id: _uid('cc'), ...cat, created_at: new Date().toISOString() };
    state = [...state, rec]; persist(); return rec;
  };
  const update = (id, patch) => { state = state.map(c => c.id === id ? { ...c, ...patch } : c); persist(); };
  const remove = (id) => { state = state.filter(c => c.id !== id); persist(); };

  // Resolve color/icon for any category name (built-in or custom)
  const resolveColor = (nome) => {
    const custom = state.find(c => c.name === nome);
    if (custom) return custom.color || '#97798a';
    return CAT_FIN_COLORS[nome] || '#97798a';
  };
  const resolveIcon = (nome) => {
    const custom = state.find(c => c.name === nome);
    if (custom) return custom.icon || 'receipt';
    return CAT_FIN_ICONS[nome] || 'receipt';
  };

  return {
    getAll, getReceita, getDespesa, add, update, remove, resolveColor, resolveIcon,
    subscribe: (fn) => { listeners.add(fn); return () => listeners.delete(fn); },
  };
})();
window.CustomCategoryStore = CustomCategoryStore;

function useCustomCategoryStore() {
  const [, force] = React.useState(0);
  React.useEffect(() => CustomCategoryStore.subscribe(() => force(n => n + 1)), []);
  return CustomCategoryStore;
}
window.useCustomCategoryStore = useCustomCategoryStore;

// ─── CardStore ───────────────────────────────────────────────────────────────
// Up to N credit/debit cards per user
const CardStore = (() => {
  const KEY = 'ps_cards';
  const listeners = new Set();
  const emit = () => listeners.forEach(l => l());

  const DEFAULT_CARDS = [
    { id: 'card_1', name: 'Cartão 1', brand: 'Visa',       color: '#9E4A69', limit: 0, created_at: new Date().toISOString() },
    { id: 'card_2', name: 'Cartão 2', brand: 'Mastercard', color: '#7c93c4', limit: 0, created_at: new Date().toISOString() },
    { id: 'card_3', name: 'Cartão 3', brand: 'Elo',        color: '#4f9d7e', limit: 0, created_at: new Date().toISOString() },
  ];

  let state = _load(KEY, null) || DEFAULT_CARDS;
  const persist = () => { localStorage.setItem(KEY, JSON.stringify(state)); emit(); };

  const getAll   = () => state;
  const getById  = (id) => state.find(c => c.id === id) || null;

  const add = (card) => {
    const rec = { id: _uid('card'), ...card, created_at: new Date().toISOString() };
    state = [...state, rec]; persist(); return rec;
  };
  const update = (id, patch) => { state = state.map(c => c.id === id ? { ...c, ...patch } : c); persist(); };
  const remove = (id) => { state = state.filter(c => c.id !== id); persist(); };

  return {
    getAll, getById, add, update, remove,
    subscribe: (fn) => { listeners.add(fn); return () => listeners.delete(fn); },
  };
})();
window.CardStore = CardStore;

function useCardStore() {
  const [, force] = React.useState(0);
  React.useEffect(() => CardStore.subscribe(() => force(n => n + 1)), []);
  return CardStore;
}
window.useCardStore = useCardStore;

// ─── FinanceStore ────────────────────────────────────────────────────────────
const FinanceStore = (() => {
  const KEY = 'ps_finance';
  const listeners = new Set();
  const emit = () => listeners.forEach(l => l());

  const EMPTY = { receitas: [], despesas: [] };
  let state = _load(KEY, null) || EMPTY;
  const persist = () => { localStorage.setItem(KEY, JSON.stringify(state)); emit(); };

  const mesAtual = _mesAtual;

  // Filter by current month using mes_referencia (falls back to current month for old entries)
  const receitasMes = () => state.receitas.filter(r => (r.mes_ref || mesAtual()) === mesAtual());
  const despesasMes = () => state.despesas.filter(d => (d.mes_ref || mesAtual()) === mesAtual());

  const getReceitas  = () => state.receitas;
  const getDespesas  = () => state.despesas;
  const getSaldo     = () => state.receitas.reduce((s,r) => s+(r.valor||0), 0) - state.despesas.reduce((s,d) => s+(d.valor||0), 0);
  const getEntradasMes = () => receitasMes().reduce((s,r) => s+(r.valor||0), 0);
  const getSaidasMes   = () => despesasMes().reduce((s,d) => s+(d.valor||0), 0);
  const getEconomiaMes = () => getEntradasMes() - getSaidasMes();

  const getCategorias = () => {
    const map = {};
    despesasMes().forEach(d => {
      const cat = d.cat || 'Outros';
      map[cat] = (map[cat] || 0) + (d.valor || 0);
    });
    return Object.entries(map)
      .map(([nome, valor]) => ({
        nome, valor,
        cor:  CustomCategoryStore.resolveColor(nome),
        icon: CustomCategoryStore.resolveIcon(nome),
      }))
      .sort((a, b) => b.valor - a.valor);
  };

  const getContasVencer = () => {
    const curDay = new Date().getDate();
    const mes = mesAtual();
    return state.despesas
      .filter(d => (d.mes_ref || mes) === mes)
      .map(d => ({ ...d, em: (d.dia || 0) - curDay }))
      .filter(d => d.em >= 0 && d.em <= 14)
      .sort((a, b) => a.em - b.em)
      .slice(0, 5);
  };

  const getEvolucao = () => {
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      return { mes: ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'][d.getMonth()], key, entrada: 0, saida: 0 };
    });
    state.receitas.forEach(r => {
      const ref = r.mes_ref || mesAtual();
      const m = months.find(x => x.key === ref);
      if (m) m.entrada += (r.valor || 0);
    });
    state.despesas.forEach(d => {
      const ref = d.mes_ref || mesAtual();
      const m = months.find(x => x.key === ref);
      if (m) m.saida += (d.valor || 0);
    });
    return months;
  };

  // Gastos agrupados por cartão (mês atual)
  const getGastosPorCartao = () => {
    const map = {};
    despesasMes().forEach(d => {
      if (!d.card_id) return;
      map[d.card_id] = (map[d.card_id] || 0) + (d.valor || 0);
    });
    return Object.entries(map).map(([card_id, valor]) => {
      const card = CardStore.getById(card_id) || { name: card_id, color: '#97798a' };
      return { card_id, nome: card.name, cor: card.color, valor };
    }).sort((a, b) => b.valor - a.valor);
  };

  // Parcelas futuras (agrupadas por installment_group_id)
  const getParcelasFuturas = () => {
    const hoje = mesAtual();
    const grupos = {};
    state.despesas.forEach(d => {
      if (!d.installment_group_id) return;
      if ((d.mes_ref || hoje) < hoje) return; // já passou
      if (!grupos[d.installment_group_id]) {
        grupos[d.installment_group_id] = {
          id: d.installment_group_id,
          desc: d.desc,
          cat: d.cat,
          card_id: d.card_id,
          total_installments: d.total_installments,
          valor_parcela: d.valor,
          parcelas: [],
        };
      }
      grupos[d.installment_group_id].parcelas.push(d);
    });
    return Object.values(grupos).map(g => {
      g.parcelas.sort((a, b) => (a.mes_ref||'').localeCompare(b.mes_ref||''));
      const proxima = g.parcelas[0];
      return {
        ...g,
        installment_number: proxima ? proxima.installment_number : 1,
        restantes: g.parcelas.length,
      };
    }).sort((a, b) => (a.parcelas[0]?.mes_ref||'').localeCompare(b.parcelas[0]?.mes_ref||''));
  };

  // ADD — handles regular and installment entries
  const add = (tipo, entry) => {
    if (entry.tipo_lancamento === 'credito_parcelado' && entry.parcelas >= 2) {
      const groupId = _uid('grp');
      const valorParcela = Math.round(((entry.valor || 0) / entry.parcelas) * 100) / 100;
      const novas = [];
      for (let i = 0; i < entry.parcelas; i++) {
        novas.push({
          id: _uid('d'),
          ...entry,
          valor: valorParcela,
          mes_ref: _mesRef(i),
          installment_group_id: groupId,
          installment_number: i + 1,
          total_installments: entry.parcelas,
          created_at: new Date().toISOString(),
        });
      }
      state = { ...state, despesas: [...state.despesas, ...novas] };
      persist();
      return novas;
    }
    const rec = {
      id: _uid(tipo[0]),
      mes_ref: _mesAtual(),
      created_at: new Date().toISOString(),
      ...entry,
    };
    if (tipo === 'receita') state = { ...state, receitas: [...state.receitas, rec] };
    else                    state = { ...state, despesas: [...state.despesas, rec] };
    persist();
    return rec;
  };

  const update = (tipo, id, patch) => {
    const key = tipo === 'receita' ? 'receitas' : 'despesas';
    state = { ...state, [key]: state[key].map(e => e.id === id ? { ...e, ...patch } : e) };
    persist();
  };

  // Remove: if installment, remove all in the group; otherwise single entry
  const remove = (tipo, id, removeGroup = false) => {
    const key = tipo === 'receita' ? 'receitas' : 'despesas';
    if (removeGroup) {
      const entry = state[key].find(e => e.id === id);
      const gid = entry && entry.installment_group_id;
      state = { ...state, [key]: gid ? state[key].filter(e => e.installment_group_id !== gid) : state[key].filter(e => e.id !== id) };
    } else {
      state = { ...state, [key]: state[key].filter(e => e.id !== id) };
    }
    persist();
  };

  return {
    getReceitas, getDespesas, getSaldo, getEntradasMes, getSaidasMes,
    getEconomiaMes, getCategorias, getContasVencer, getEvolucao,
    getGastosPorCartao, getParcelasFuturas,
    add, update, remove,
    subscribe: (fn) => { listeners.add(fn); return () => listeners.delete(fn); },
  };
})();
window.FinanceStore = FinanceStore;

function useFinanceStore() {
  const [, force] = React.useState(0);
  React.useEffect(() => FinanceStore.subscribe(() => force(n => n + 1)), []);
  return FinanceStore;
}
window.useFinanceStore = useFinanceStore;

// ─── TaskStore ───────────────────────────────────────────────────────────────
const TaskStore = (() => {
  const KEY = 'ps_tarefas_v2';
  const listeners = new Set();
  const emit = () => listeners.forEach(l => l());
  const COLS = ['A Fazer', 'Em Andamento', 'Concluído'];
  const EMPTY = { 'A Fazer': [], 'Em Andamento': [], 'Concluído': [] };
  let state = _load(KEY, null) || EMPTY;
  const persist = () => { localStorage.setItem(KEY, JSON.stringify(state)); emit(); };
  const getCols = () => state;
  const add = (col, task) => {
    const rec = { id: _uid('t'), ...task };
    state = { ...state, [col]: [...(state[col]||[]), rec] }; persist(); return rec;
  };
  const move = (id, toCol) => {
    let card = null; const next = {};
    COLS.forEach(c => {
      const idx = (state[c]||[]).findIndex(t => t.id === id);
      if (idx >= 0) { card = state[c][idx]; next[c] = state[c].filter(t => t.id !== id); }
      else next[c] = [...(state[c]||[])];
    });
    if (card) { next[toCol] = [card, ...next[toCol]]; state = next; persist(); }
  };
  const update = (id, patch) => {
    const next = {};
    COLS.forEach(c => { next[c] = (state[c]||[]).map(t => t.id === id ? { ...t, ...patch } : t); });
    state = next; persist();
  };
  const remove = (id) => {
    const next = {};
    COLS.forEach(c => { next[c] = (state[c]||[]).filter(t => t.id !== id); });
    state = next; persist();
  };
  return { COLS, getCols, add, move, update, remove, subscribe: (fn) => { listeners.add(fn); return () => listeners.delete(fn); } };
})();
window.TaskStore = TaskStore;
function useTaskStore() {
  const [, force] = React.useState(0);
  React.useEffect(() => TaskStore.subscribe(() => force(n => n + 1)), []);
  return TaskStore;
}
window.useTaskStore = useTaskStore;

// ─── GoalStore ───────────────────────────────────────────────────────────────
const GoalStore = (() => {
  const KEY = 'ps_metas';
  const listeners = new Set();
  const emit = () => listeners.forEach(l => l());
  let state = _load(KEY, null) || [];
  const persist = () => { localStorage.setItem(KEY, JSON.stringify(state)); emit(); };
  const getAll = () => state;
  const add = (goal) => { const rec = { id: _uid('m'), atual: 0, ...goal }; state = [...state, rec]; persist(); return rec; };
  const update = (id, patch) => { state = state.map(m => m.id === id ? { ...m, ...patch } : m); persist(); };
  const remove = (id) => { state = state.filter(m => m.id !== id); persist(); };
  const addValue = (id, amount) => {
    state = state.map(m => m.id === id ? { ...m, atual: Math.min(m.alvo, (m.atual||0)+amount) } : m); persist();
  };
  return { getAll, add, update, remove, addValue, subscribe: (fn) => { listeners.add(fn); return () => listeners.delete(fn); } };
})();
window.GoalStore = GoalStore;
function useGoalStore() {
  const [, force] = React.useState(0);
  React.useEffect(() => GoalStore.subscribe(() => force(n => n + 1)), []);
  return GoalStore;
}
window.useGoalStore = useGoalStore;

// ─── HabitStore ──────────────────────────────────────────────────────────────
const HabitStore = (() => {
  const KEY = 'ps_habitos_v2';
  const listeners = new Set();
  const emit = () => listeners.forEach(l => l());
  let state = _load(KEY, null) || [];
  const persist = () => { localStorage.setItem(KEY, JSON.stringify(state)); emit(); };
  const getAll = () => state;
  const add = (habit) => {
    const rec = { id: _uid('h'), seq: 0, melhor: 0, hoje: 0, semana: [0,0,0,0,0,0,0], ...habit };
    state = [...state, rec]; persist(); return rec;
  };
  const update = (id, patch) => { state = state.map(h => h.id === id ? { ...h, ...patch } : h); persist(); };
  const remove = (id) => { state = state.filter(h => h.id !== id); persist(); };
  const markToday = (id) => {
    const dow = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
    state = state.map(h => {
      if (h.id !== id) return h;
      const done = h.hoje >= h.meta;
      const novoHoje = done ? 0 : h.meta;
      const novaSeq = done ? Math.max(0, h.seq - 1) : h.seq + 1;
      const novaSemana = [...h.semana]; novaSemana[dow] = done ? 0 : 1;
      return { ...h, hoje: novoHoje, seq: novaSeq, melhor: Math.max(h.melhor, novaSeq), semana: novaSemana };
    });
    persist();
  };
  return { getAll, add, update, remove, markToday, subscribe: (fn) => { listeners.add(fn); return () => listeners.delete(fn); } };
})();
window.HabitStore = HabitStore;
function useHabitStore() {
  const [, force] = React.useState(0);
  React.useEffect(() => HabitStore.subscribe(() => force(n => n + 1)), []);
  return HabitStore;
}
window.useHabitStore = useHabitStore;

// ─── InvestmentStore ─────────────────────────────────────────────────────────
const INVEST_DEFAULT_TYPES = [
  'CDB','Tesouro Direto','LCI','LCA','LIG',
  'Fundo','FII','Ações','ETF','BDR',
  'Criptomoedas','Debêntures','COE','CRI/CRA',
  'Previdência Privada','Conta Remunerada','Poupança','Outro',
];
const INVEST_DEFAULT_INST = ['Nubank','Mercado Pago','Inter'];
const INVEST_TYPE_COLORS = {
  'CDB':'#9E4A69','Tesouro Direto':'#7c93c4','LCI':'#4f9d7e','LCA':'#6abfa0',
  'LIG':'#5ab4a0','Fundo':'#d29a52','FII':'#c4884a','Ações':'#C67C96','ETF':'#caa7d0',
  'BDR':'#b87fc9','Criptomoedas':'#e07a88','Debêntures':'#8aaddb','COE':'#a3b86c',
  'CRI/CRA':'#7eada0','Previdência Privada':'#9b84c4','Conta Remunerada':'#d4a0b0',
  'Poupança':'#9fb2e0','Outro':'#97798a',
};
window.INVEST_DEFAULT_TYPES = INVEST_DEFAULT_TYPES;
window.INVEST_DEFAULT_INST = INVEST_DEFAULT_INST;
window.INVEST_TYPE_COLORS = INVEST_TYPE_COLORS;

const InvestmentStore = (() => {
  const KEY       = 'ps_investments';
  const INST_KEY  = 'ps_invest_institutions';
  const TYPES_KEY = 'ps_invest_types';
  const listeners = new Set();
  const emit = () => listeners.forEach(l => l());

  let state        = _load(KEY, null)       || [];
  let institutions = _load(INST_KEY, null)  || [...INVEST_DEFAULT_INST];
  let types        = _load(TYPES_KEY, null) || [...INVEST_DEFAULT_TYPES];

  const persist      = () => { localStorage.setItem(KEY,       JSON.stringify(state));        emit(); };
  const persistInst  = () => { localStorage.setItem(INST_KEY,  JSON.stringify(institutions)); emit(); };
  const persistTypes = () => { localStorage.setItem(TYPES_KEY, JSON.stringify(types));        emit(); };

  const getAll         = () => state;
  const getInstitutions = () => institutions;
  const getTypes        = () => types;

  const add = (inv) => {
    const rec = { id: _uid('inv'), created_at: new Date().toISOString(), valor_atual: inv.valor, ...inv };
    state = [...state, rec]; persist(); return rec;
  };
  const update = (id, patch) => { state = state.map(i => i.id === id ? { ...i, ...patch } : i); persist(); };
  const remove = (id) => { state = state.filter(i => i.id !== id); persist(); };
  const duplicate = (id) => {
    const orig = state.find(i => i.id === id);
    if (!orig) return;
    const rec = { ...orig, id: _uid('inv'), created_at: new Date().toISOString() };
    state = [...state, rec]; persist(); return rec;
  };

  const addInstitution = (name) => {
    const n = name.trim();
    if (!n || institutions.includes(n)) return false;
    institutions = [...institutions, n]; persistInst(); return true;
  };
  const removeInstitution = (name) => {
    if (INVEST_DEFAULT_INST.includes(name)) return false;
    institutions = institutions.filter(i => i !== name); persistInst(); return true;
  };

  const addType = (name) => {
    const n = name.trim();
    if (!n || types.includes(n)) return false;
    types = [...types, n]; persistTypes(); return true;
  };
  const removeType = (name) => {
    if (INVEST_DEFAULT_TYPES.includes(name)) return false;
    types = types.filter(t => t !== name); persistTypes(); return true;
  };
  const resetTypes = () => { types = [...INVEST_DEFAULT_TYPES]; persistTypes(); };

  // ── Computed ──
  const getTotalInvestido = () => state.reduce((s, i) => s + (i.valor || 0), 0);
  const getTotalAtual     = () => state.reduce((s, i) => s + (i.valor_atual || i.valor || 0), 0);
  const getRentabilidade  = () => getTotalAtual() - getTotalInvestido();

  const getPorInstituicao = () => {
    const map = {};
    state.forEach(i => {
      if (!map[i.instituicao]) map[i.instituicao] = 0;
      map[i.instituicao] += (i.valor || 0);
    });
    return Object.entries(map).map(([nome, valor]) => ({ nome, valor })).sort((a,b) => b.valor - a.valor);
  };

  const getPorTipo = () => {
    const map = {};
    state.forEach(i => {
      if (!map[i.tipo]) map[i.tipo] = 0;
      map[i.tipo] += (i.valor || 0);
    });
    return Object.entries(map).map(([tipo, valor]) => ({ tipo, valor, cor: INVEST_TYPE_COLORS[tipo] || '#97798a' })).sort((a,b) => b.valor - a.valor);
  };

  const getMaiorInstituicao = () => {
    const p = getPorInstituicao();
    return p.length > 0 ? p[0].nome : '—';
  };

  return {
    getAll, getInstitutions, getTypes, add, update, remove, duplicate,
    addInstitution, removeInstitution, addType, removeType, resetTypes,
    getTotalInvestido, getTotalAtual, getRentabilidade,
    getPorInstituicao, getPorTipo, getMaiorInstituicao,
    subscribe: (fn) => { listeners.add(fn); return () => listeners.delete(fn); },
  };
})();
window.InvestmentStore = InvestmentStore;

function useInvestmentStore() {
  const [, force] = React.useState(0);
  React.useEffect(() => InvestmentStore.subscribe(() => force(n => n + 1)), []);
  return InvestmentStore;
}
window.useInvestmentStore = useInvestmentStore;

// ─── Generic per-screen layout (order + visibility) ──────────────────────────
function useScreenLayout(screenId, defs) {
  const KEY = `ps_layout_${screenId}`;
  const load = () => {
    try {
      const s = localStorage.getItem(KEY);
      if (s) {
        const saved = JSON.parse(s);
        return defs.map((d, i) => {
          const found = saved.find(x => x.id === d.id);
          return found ? { id: d.id, order: found.order ?? i, visible: found.visible ?? true } : { id: d.id, order: i, visible: true };
        }).sort((a, b) => a.order - b.order);
      }
    } catch(e) {}
    return defs.map((d, i) => ({ id: d.id, order: i, visible: true }));
  };
  const [layout, setLayout] = React.useState(load);
  const save = (next) => { setLayout(next); localStorage.setItem(KEY, JSON.stringify(next)); };
  const sorted = [...layout].sort((a, b) => a.order - b.order);
  const visible = sorted.filter(w => w.visible);
  const hidden  = sorted.filter(w => !w.visible);
  const setVisible = (id, v) => save(layout.map(w => w.id === id ? { ...w, visible: v } : w));
  const moveUp   = (id) => {
    const s = [...sorted]; const i = s.findIndex(w => w.id === id);
    if (i <= 0) return;
    [s[i-1], s[i]] = [s[i], s[i-1]];
    save(s.map((w, j) => ({ ...w, order: j })));
  };
  const moveDown = (id) => {
    const s = [...sorted]; const i = s.findIndex(w => w.id === id);
    if (i < 0 || i >= s.length - 1) return;
    [s[i], s[i+1]] = [s[i+1], s[i]];
    save(s.map((w, j) => ({ ...w, order: j })));
  };
  const reset = () => save(defs.map((d, i) => ({ id: d.id, order: i, visible: true })));
  return { layout: sorted, visible, hidden, setVisible, moveUp, moveDown, reset };
}
window.useScreenLayout = useScreenLayout;
