// screen-dashboard.jsx — Dashboard com layout completamente personalizável
// Drag-and-drop nativo (HTML5 + touch), visibilidade, tamanho, persistência localStorage

// ── Widget registry ────────────────────────────────────────────────────────────
const WIDGET_DEFS = [
  { id: 'stats',        label: 'Cards de saldo',      icon: 'wallet',   defaultSize: 'full' },
  { id: 'agenda',       label: 'Resumo do dia',        icon: 'clock',    defaultSize: 'half' },
  { id: 'financeiro',   label: 'Resumo financeiro',    icon: 'wallet',   defaultSize: 'half' },
  { id: 'habitos',      label: 'Hábitos de hoje',      icon: 'flame',    defaultSize: 'half' },
  { id: 'investimentos',label: 'Investimentos',        icon: 'arrowUp',  defaultSize: 'full' },
  { id: 'obrigacoes',   label: 'Próximas obrigações',  icon: 'clock',    defaultSize: 'half' },
  { id: 'tarefas',      label: 'Tarefas pendentes',    icon: 'kanban',   defaultSize: 'half' },
  { id: 'metas',        label: 'Metas em andamento',   icon: 'target',   defaultSize: 'half' },
];

const DEFAULT_LAYOUT = WIDGET_DEFS.map((w, i) => ({
  id: w.id, order: i, visible: true, size: w.defaultSize,
}));

function loadDashLayout() {
  try {
    const s = localStorage.getItem('ps_dash_layout');
    if (s) {
      const saved = JSON.parse(s);
      // Merge with defaults to include any new widgets added in updates
      const merged = DEFAULT_LAYOUT.map(def => {
        const found = saved.find(x => x.id === def.id);
        return found ? { ...def, ...found } : def;
      });
      return merged.sort((a, b) => a.order - b.order);
    }
  } catch (e) {}
  return DEFAULT_LAYOUT.map(w => ({ ...w }));
}
function saveDashLayout(layout) {
  localStorage.setItem('ps_dash_layout', JSON.stringify(layout));
}

// ── Layout hook ────────────────────────────────────────────────────────────────
function useDashLayout() {
  const [layout, setLayout] = React.useState(loadDashLayout);

  const update = (next) => { setLayout(next); saveDashLayout(next); };

  const setVisible = (id, v) => update(layout.map(w => w.id === id ? { ...w, visible: v } : w));
  const setSize    = (id, s) => update(layout.map(w => w.id === id ? { ...w, size: s } : w));

  const moveWidget = (fromId, toId) => {
    if (fromId === toId) return;
    const sorted = [...layout].sort((a, b) => a.order - b.order);
    const fromIdx = sorted.findIndex(w => w.id === fromId);
    const toIdx   = sorted.findIndex(w => w.id === toId);
    if (fromIdx < 0 || toIdx < 0) return;
    const reordered = [...sorted];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);
    update(reordered.map((w, i) => ({ ...w, order: i })));
  };

  const moveUp = (id) => {
    const sorted = [...layout].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex(w => w.id === id);
    if (idx <= 0) return;
    const reordered = [...sorted];
    [reordered[idx - 1], reordered[idx]] = [reordered[idx], reordered[idx - 1]];
    update(reordered.map((w, i) => ({ ...w, order: i })));
  };

  const moveDown = (id) => {
    const sorted = [...layout].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex(w => w.id === id);
    if (idx < 0 || idx >= sorted.length - 1) return;
    const reordered = [...sorted];
    [reordered[idx], reordered[idx + 1]] = [reordered[idx + 1], reordered[idx]];
    update(reordered.map((w, i) => ({ ...w, order: i })));
  };

  const reset = () => update(DEFAULT_LAYOUT.map(w => ({ ...w })));

  const sorted = [...layout].sort((a, b) => a.order - b.order);
  const visible = sorted.filter(w => w.visible);
  const hidden  = sorted.filter(w => !w.visible);

  return { layout: sorted, visible, hidden, setVisible, setSize, moveWidget, moveUp, moveDown, reset };
}

// ── Widget wrapper with edit controls ─────────────────────────────────────────
function WidgetShell({ w, editing, isDragOver, isFirst, isLast, onDragStart, onDragOver, onDragLeave, onDrop, onMoveUp, onMoveDown, onHide, onResize, children }) {
  const def = WIDGET_DEFS.find(d => d.id === w.id);
  const sizeSpan = w.size === 'full' ? '1 / -1' : 'span 1';

  // Touch drag state
  const touchRef = React.useRef(null);

  const handleTouchStart = (e) => {
    if (!editing) return;
    touchRef.current = { id: w.id, startY: e.touches[0].clientY };
    e.currentTarget.style.opacity = '0.7';
    e.currentTarget.style.transform = 'scale(1.01)';
  };
  const handleTouchEnd = (e) => {
    if (!editing || !touchRef.current) return;
    e.currentTarget.style.opacity = '1';
    e.currentTarget.style.transform = 'none';
    touchRef.current = null;
  };

  return (
    <div
      draggable={editing}
      onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; onDragStart(w.id); }}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; onDragOver(w.id); }}
      onDragLeave={onDragLeave}
      onDrop={(e) => { e.preventDefault(); onDrop(w.id); }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        gridColumn: sizeSpan,
        position: 'relative',
        transition: 'opacity 0.2s, transform 0.2s',
        cursor: editing ? 'grab' : 'default',
        outline: isDragOver ? '2.5px dashed var(--primary)' : editing ? '1.5px dashed color-mix(in oklab, var(--primary) 40%, transparent)' : 'none',
        outlineOffset: 3,
        borderRadius: 'calc(var(--glass-radius) + 4px)',
      }}>
      {children}

      {/* Edit overlay */}
      {editing && (
        <div style={{ position: 'absolute', inset: 0, borderRadius: 'var(--glass-radius)', zIndex: 10,
          background: 'rgba(40,20,30,0.03)', pointerEvents: 'none' }}>
          {/* Top control bar */}
          <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
            display: 'flex', alignItems: 'center', gap: 4, background: 'var(--bg-1)', borderRadius: 99,
            padding: '4px 8px', boxShadow: '0 4px 14px rgba(0,0,0,0.15)', border: '1px solid var(--line)',
            pointerEvents: 'all', whiteSpace: 'nowrap', zIndex: 20 }}>

            {/* Drag handle */}
            <div title="Arrastar" style={{ cursor: 'grab', padding: '2px 4px', color: 'var(--ink-faint)', display: 'flex', alignItems: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <circle cx="5" cy="4" r="1.5"/><circle cx="11" cy="4" r="1.5"/>
                <circle cx="5" cy="8" r="1.5"/><circle cx="11" cy="8" r="1.5"/>
                <circle cx="5" cy="12" r="1.5"/><circle cx="11" cy="12" r="1.5"/>
              </svg>
            </div>

            <div style={{ width: 1, height: 16, background: 'var(--line)' }}/>

            {/* Widget label */}
            <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--ink-soft)', padding: '0 2px' }}>{def?.label}</span>

            <div style={{ width: 1, height: 16, background: 'var(--line)' }}/>

            {/* Size toggle */}
            <button title="Tamanho" onClick={() => onResize(w.id, w.size === 'full' ? 'half' : 'full')}
              style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '2px 6px',
                borderRadius: 6, fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 700,
                color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 3 }}>
              {w.size === 'full' ? (
                <React.Fragment>
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="4" width="5" height="8" rx="1.5"/><rect x="9" y="4" width="5" height="8" rx="1.5"/>
                  </svg>Metade
                </React.Fragment>
              ) : (
                <React.Fragment>
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="4" width="12" height="8" rx="1.5"/>
                  </svg>Inteiro
                </React.Fragment>
              )}
            </button>

            <div style={{ width: 1, height: 16, background: 'var(--line)' }}/>

            {/* Move up */}
            <button title="Mover para cima" disabled={isFirst} onClick={() => onMoveUp(w.id)}
              style={{ border: 'none', background: 'none', cursor: isFirst ? 'default' : 'pointer',
                padding: '2px 4px', opacity: isFirst ? 0.3 : 1, color: 'var(--ink-soft)', display: 'flex', alignItems: 'center' }}>
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="3,10 8,5 13,10"/>
              </svg>
            </button>

            {/* Move down */}
            <button title="Mover para baixo" disabled={isLast} onClick={() => onMoveDown(w.id)}
              style={{ border: 'none', background: 'none', cursor: isLast ? 'default' : 'pointer',
                padding: '2px 4px', opacity: isLast ? 0.3 : 1, color: 'var(--ink-soft)', display: 'flex', alignItems: 'center' }}>
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="3,6 8,11 13,6"/>
              </svg>
            </button>

            <div style={{ width: 1, height: 16, background: 'var(--line)' }}/>

            {/* Hide */}
            <button title="Ocultar widget" onClick={() => onHide(w.id)}
              style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '2px 5px',
                color: 'var(--negative)', display: 'flex', alignItems: 'center', gap: 3,
                fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 700 }}>
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M2 2l12 12"/><path d="M6.5 3.5A6 6 0 0 1 8 3c4 0 6 5 6 5s-.8 1.5-2.2 2.8"/>
                <path d="M9.5 12.5A6 6 0 0 1 8 13c-4 0-6-5-6-5s.8-1.5 2.2-2.8"/>
              </svg>Ocultar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Widget manager panel ───────────────────────────────────────────────────────
function WidgetManager({ layout, hidden, onToggle, onReset, onClose }) {
  const [confirmReset, setConfirmReset] = React.useState(false);
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 55, background: 'rgba(40,20,30,0.35)',
      backdropFilter: 'blur(6px)', display: 'grid', placeItems: 'center', padding: 20 }}>
      <GlassCard onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 400, padding: 26, maxHeight: '85vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 className="serif" style={{ margin: 0, fontSize: 22 }}>Gerenciar widgets</h3>
          <button className="icon-btn" onClick={onClose}><Ic.plus size={18} style={{ transform: 'rotate(45deg)' }}/></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {layout.map(w => {
            const def = WIDGET_DEFS.find(d => d.id === w.id);
            return (
              <div key={w.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px',
                borderRadius: 13, background: 'var(--chip-bg)', border: '1px solid var(--line)' }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: w.visible ? 'color-mix(in oklab, var(--primary) 14%, transparent)' : 'var(--bg-1)',
                  display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <span style={{ color: w.visible ? 'var(--primary)' : 'var(--ink-faint)' }}>
                    {Ic[def?.icon] ? Ic[def?.icon]({ size: 15 }) : null}
                  </span>
                </div>
                <span style={{ flex: 1, fontWeight: 600, fontSize: 14, color: w.visible ? 'var(--ink)' : 'var(--ink-faint)' }}>{def?.label}</span>
                <button onClick={() => onToggle(w.id, !w.visible)}
                  style={{ width: 44, height: 26, borderRadius: 99, border: 'none', cursor: 'pointer', padding: 3, flexShrink: 0,
                    background: w.visible ? 'var(--primary)' : 'color-mix(in oklab, var(--ink) 18%, transparent)', transition: 'background 0.2s' }}>
                  <span style={{ display: 'block', width: 20, height: 20, borderRadius: '50%', background: '#fff',
                    transform: w.visible ? 'translateX(18px)' : 'translateX(0)', transition: 'transform 0.2s var(--ease)', boxShadow: '0 2px 5px rgba(0,0,0,0.25)' }}/>
                </button>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--line)' }}>
          {!confirmReset ? (
            <button onClick={() => setConfirmReset(true)} className="btn-ghost btn" style={{ width: '100%', justifyContent: 'center', color: 'var(--negative)' }}>
              <Ic.sync size={15}/>Restaurar layout padrão
            </button>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div className="faint" style={{ fontSize: 13, marginBottom: 12 }}>Isso resetará a ordem, tamanho e visibilidade de todos os widgets.</div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button className="btn-ghost btn" onClick={() => setConfirmReset(false)}>Cancelar</button>
                <button className="btn" onClick={() => { onReset(); setConfirmReset(false); onClose(); }}
                  style={{ background: 'var(--negative)' }}>
                  <Ic.sync size={15}/>Restaurar
                </button>
              </div>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────────
function Dashboard({ go }) {
  const eventStore  = useEventStore();
  const finStore    = useFinanceStore();
  const invStore    = useInvestmentStore();
  const taskStore   = useTaskStore();
  const goalStore   = useGoalStore();
  const habitStore  = useHabitStore();

  const { layout, visible, hidden, setVisible, setSize, moveWidget, moveUp, moveDown, reset } = useDashLayout();

  const [editing,     setEditing]     = React.useState(false);
  const [showManager, setShowManager] = React.useState(false);
  const [dragSrc,     setDragSrc]     = React.useState(null);
  const [dragOver,    setDragOver]    = React.useState(null);

  // ── Data ──────────────────────────────────────────────────────────────────
  const today    = eventStore.getEvents().filter(e => e.date === eventStore.TODAY).sort((a, b) => a.ini - b.ini);
  const proximos = today.slice(0, 4);
  const cols     = taskStore.getCols();
  const pend     = [...(cols['A Fazer'] || []), ...(cols['Em Andamento'] || [])].slice(0, 4);
  const metas    = goalStore.getAll().slice(0, 3);
  const habitos  = habitStore.getAll().slice(0, 4);
  const contas   = finStore.getContasVencer();
  const fmtH     = (h) => `${String(Math.floor(h)).padStart(2,'0')}:${(h%1)*60 ? '30' : '00'}`;

  const now      = new Date();
  const hour     = now.getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  const DOW      = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
  const MON      = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  const dateStr  = `${DOW[now.getDay()]}, ${now.getDate()} de ${MON[now.getMonth()]}`;

  // ── Investimentos data ────────────────────────────────────────────────────
  const invTotal  = invStore.getTotalInvestido();
  const invRentab = invStore.getRentabilidade();
  const porInst   = invStore.getPorInstituicao();
  const invInst   = invStore.getInstitutions();
  const ICOL      = ['#9E4A69','#7c93c4','#4f9d7e','#d29a52','#C67C96','#caa7d0','#e07a88','#6abfa0'];
  const ic        = (nome) => ICOL[invInst.indexOf(nome) % ICOL.length] || '#97798a';

  // ── Drag handlers ─────────────────────────────────────────────────────────
  const handleDragStart = (id) => setDragSrc(id);
  const handleDragOver  = (id) => { if (id !== dragSrc) setDragOver(id); };
  const handleDragLeave = ()   => setDragOver(null);
  const handleDrop      = (id) => {
    if (dragSrc && id !== dragSrc) moveWidget(dragSrc, id);
    setDragSrc(null); setDragOver(null);
  };
  const handleDragEnd   = ()   => { setDragSrc(null); setDragOver(null); };

  // ── Widget content renderers ───────────────────────────────────────────────
  const renderWidget = (w) => {
    switch (w.id) {

      case 'stats': return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
          <StatCard icon="wallet"    label="Saldo disponível"  value={brl(finStore.getSaldo())}        color="var(--primary)" />
          <StatCard icon="arrowDown" label="Entradas do mês"   value={brl(finStore.getEntradasMes())}  color="var(--positive)" />
          <StatCard icon="arrowUp"   label="Saídas do mês"     value={brl(finStore.getSaidasMes())}    color="var(--negative)" />
          <StatCard icon="leaf"      label="Economia do mês"   value={brl(finStore.getEconomiaMes())}  color="var(--accent)" />
        </div>
      );

      case 'agenda': return (
        <GlassCard style={{ padding: 22, height: '100%' }}>
          <CardTitle icon="clock" title="Resumo do dia" action="Ver agenda" onAction={() => go('agenda')} />
          {proximos.length === 0 ? (
            <div className="faint" style={{ textAlign: 'center', padding: '32px 0', fontSize: 13.5 }}>
              Nenhum compromisso hoje — vá para a agenda para adicionar.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
              {proximos.map(e => (
                <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 12px', borderRadius: 14, background: 'var(--chip-bg)' }}>
                  <div style={{ textAlign: 'center', minWidth: 46 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{fmtH(e.ini)}</div>
                    <div className="faint" style={{ fontSize: 11 }}>{fmtH(e.fim)}</div>
                  </div>
                  <div style={{ width: 4, alignSelf: 'stretch', borderRadius: 4, background: catColors[e.cat] || 'var(--primary)' }}/>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14.5 }}>{e.titulo}</div>
                    <div className="faint" style={{ fontSize: 12.5, display: 'flex', gap: 6, alignItems: 'center' }}>
                      <Ic.pin size={12}/>{e.local || '—'}
                    </div>
                  </div>
                  <span className="chip" style={{ color: catColors[e.cat], background: `color-mix(in oklab, ${catColors[e.cat]||'var(--primary)'} 13%, transparent)`, borderColor: 'transparent' }}>{e.cat}</span>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      );

      case 'financeiro': return (
        <GlassCard style={{ padding: 22, height: '100%' }}>
          <CardTitle icon="wallet" title="Resumo financeiro" action="Detalhes" onAction={() => go('financeiro')} />
          <div style={{ marginTop: 14 }}>
            {contas.length === 0 ? (
              <div className="faint" style={{ fontSize: 12.5, textAlign: 'center', padding: '14px 0' }}>Sem contas próximas do vencimento.</div>
            ) : (
              <React.Fragment>
                <div className="faint" style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.3 }}>Contas próximas do vencimento</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
                  {contas.slice(0,3).map(c => (
                    <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 30, height: 30, borderRadius: 9, display: 'grid', placeItems: 'center',
                          background: c.em <= 2 ? 'rgba(201,96,121,0.14)' : 'var(--chip-bg)', color: c.em <= 2 ? 'var(--negative)' : 'var(--ink-soft)' }}>
                          <Ic.receipt size={15}/>
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13.5 }}>{c.desc}</div>
                          <div className="faint" style={{ fontSize: 11.5 }}>vence em {c.em} {c.em === 1 ? 'dia' : 'dias'}</div>
                        </div>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 13.5 }}>{brl(c.valor)}</div>
                    </div>
                  ))}
                </div>
              </React.Fragment>
            )}
          </div>
        </GlassCard>
      );

      case 'habitos': return (
        <GlassCard style={{ padding: 22, height: '100%' }}>
          <CardTitle icon="flame" title="Hábitos de hoje" action="Ver tudo" onAction={() => go('habitos')} />
          {habitos.length === 0 ? (
            <div className="faint" style={{ fontSize: 12.5, textAlign: 'center', padding: '14px 0' }}>Nenhum hábito cadastrado ainda.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
              {habitos.map(h => {
                const pct = Math.min(100, Math.round(((h.hoje||0)/(h.meta||1))*100));
                return (
                  <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 12, background: 'var(--chip-bg)' }}>
                    <Ring pct={pct} size={40} thickness={5} color={h.cor}>
                      {pct >= 100 ? <Ic.check size={16} style={{ color: h.cor }}/> : Ic[h.icon] ? Ic[h.icon]({ size: 16, style: { color: h.cor } }) : null}
                    </Ring>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 12.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.nome}</div>
                      <div className="faint" style={{ fontSize: 11 }}>{h.hoje||0}/{h.meta} {h.unidade}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>
      );

      case 'investimentos': return (
        <GlassCard style={{ padding: 22 }}>
          <CardTitle icon="arrowUp" title="Investimentos" action="Ver carteira" onAction={() => go('investimentos')} />
          {invTotal === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 0' }}>
              <div className="faint" style={{ fontSize: 13 }}>Nenhum investimento registrado ainda.</div>
              <button className="btn" style={{ marginLeft: 'auto', padding: '8px 16px', fontSize: 13 }} onClick={() => go('investimentos')}>
                <Ic.plus size={14}/>Começar a investir
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 24, marginTop: 14, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: 20 }}>
                <div>
                  <div className="faint" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 }}>Total investido</div>
                  <div style={{ fontWeight: 800, fontSize: 20, color: 'var(--primary)', marginTop: 3 }}>{brl(invTotal)}</div>
                </div>
                <div>
                  <div className="faint" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 }}>Rentabilidade</div>
                  <div style={{ fontWeight: 800, fontSize: 20, color: invRentab >= 0 ? 'var(--positive)' : 'var(--negative)', marginTop: 3 }}>
                    {invRentab >= 0 ? '+' : ''}{brl(invRentab)}
                  </div>
                </div>
              </div>
              <div style={{ width: 1, height: 46, background: 'var(--line)', flexShrink: 0 }}/>
              <div style={{ flex: 1, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {porInst.slice(0,5).map(p => {
                  const cor = ic(p.nome);
                  const pct = invTotal > 0 ? (p.valor / invTotal * 100).toFixed(0) : 0;
                  return (
                    <div key={p.nome} onClick={() => go('investimentos')} style={{ display: 'flex', flex: '1 1 110px', alignItems: 'center', gap: 9,
                      padding: '10px 12px', borderRadius: 12, background: 'var(--chip-bg)', cursor: 'pointer',
                      border: '1px solid var(--line)', minWidth: 100, transition: 'border-color 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = cor}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--line)'}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: cor, flexShrink: 0 }}/>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 12.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nome}</div>
                        <div style={{ fontWeight: 700, fontSize: 13, color: cor }}>{brl(p.valor)}</div>
                      </div>
                      <div className="faint" style={{ fontSize: 11, marginLeft: 'auto', fontWeight: 600 }}>{pct}%</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </GlassCard>
      );

      case 'tarefas': return (
        <GlassCard style={{ padding: 22, height: '100%' }}>
          <CardTitle icon="kanban" title="Tarefas pendentes" action="Quadro" onAction={() => go('tarefas')} />
          {pend.length === 0 ? (
            <div className="faint" style={{ fontSize: 12.5, textAlign: 'center', padding: '14px 0' }}>Nenhuma tarefa pendente.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
              {pend.map(t => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 12px', borderRadius: 12, background: 'var(--chip-bg)' }}>
                  <div style={{ width: 18, height: 18, borderRadius: 6, border: `2px solid ${prioColor[t.prio] || '#999'}`, flexShrink: 0 }}/>
                  <div style={{ flex: 1, fontWeight: 600, fontSize: 13.5 }}>{t.titulo}</div>
                  {t.prazo && <span className="chip">{t.prazo}</span>}
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      );

      case 'obrigacoes': {
        // Coleta contas programadas + faturas dos próximos 90 dias
        const hoje = new Date().toISOString().slice(0,10);
        const limite90 = new Date(); limite90.setDate(limite90.getDate() + 90);
        const lim90Str = limite90.toISOString().slice(0,10);
        const mesAtualOb = hoje.slice(0,7);

        const obItems = [];

        // Contas programadas (recorrentes)
        if (window.ContasProgramadasStore) {
          for (let i = 0; i < 4; i++) {
            const mes = (() => { const d = new Date(mesAtualOb + '-01T12:00'); d.setMonth(d.getMonth()+i); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; })();
            window.ContasProgramadasStore.getForMes(mes).forEach(c => {
              if (c.status === 'pago') return;
              const vd = c.vencDate || `${mes}-${String(c.dia||1).padStart(2,'0')}`;
              if (vd >= hoje && vd <= lim90Str) obItems.push({ _k: c.id+mes, label: c.desc, sub: c.categoria, valor: c.valor, venc: vd, tipo: 'conta', status: c.status });
            });
          }
        }
        // Faturas abertas
        if (window.FaturaStore) {
          window.FaturaStore.getAll().filter(f => f.status !== 'pago' && f.venc_date >= hoje && f.venc_date <= lim90Str).forEach(f => {
            if (!f.valor_total) return;
            const card = window.CardStore ? window.CardStore.getById(f.card_id) : null;
            obItems.push({ _k: f.id, label: `Fatura ${card ? card.name : 'Cartão'}`, sub: 'Cartão de crédito', valor: f.valor_total, venc: f.venc_date, tipo: 'fatura', cardColor: card ? card.color : '#7c93c4', status: f.status });
          });
        }
        obItems.sort((a,b) => a.venc.localeCompare(b.venc));

        return (
          <GlassCard style={{ padding:22, height:'100%' }}>
            <CardTitle icon="clock" title="Próximas obrigações" action="Ver agenda" onAction={() => go('contas')} />
            {obItems.length === 0 ? (
              <div className="faint" style={{ fontSize:12.5, textAlign:'center', padding:'20px 0' }}>
                Nenhuma obrigação nos próximos 90 dias.
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:14 }}>
                {obItems.slice(0,6).map(ob => {
                  const d = new Date(ob.venc+'T12:00');
                  const dStr = d.toLocaleDateString('pt-BR',{day:'2-digit',month:'short'});
                  const cor  = ob.tipo === 'fatura' ? (ob.cardColor || '#7c93c4') : 'var(--warn)';
                  const atrasado = ob.status === 'atrasado' || ob.status === 'atrasada';
                  return (
                    <div key={ob._k} style={{ display:'flex', alignItems:'center', gap:12, padding:'9px 12px', borderRadius:12,
                      background: atrasado ? 'color-mix(in oklab,var(--negative) 5%,var(--chip-bg))' : 'var(--chip-bg)',
                      border:`1px solid ${atrasado ? 'color-mix(in oklab,var(--negative) 18%,transparent)' : 'transparent'}` }}>
                      <div style={{ textAlign:'center', minWidth:40, flexShrink:0 }}>
                        <div style={{ fontWeight:800, fontSize:13, color: atrasado ? 'var(--negative)' : 'var(--ink)' }}>
                          {String(d.getDate()).padStart(2,'0')}
                        </div>
                        <div className="faint" style={{ fontSize:10.5, textTransform:'uppercase' }}>
                          {d.toLocaleDateString('pt-BR',{month:'short'}).replace('.','').slice(0,3)}
                        </div>
                      </div>
                      <div style={{ width:3, alignSelf:'stretch', borderRadius:4, background:cor, flexShrink:0 }}/>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontWeight:700, fontSize:13.5, color:'var(--ink)' }}>{ob.label}</div>
                        <div className="faint" style={{ fontSize:11.5 }}>{ob.sub}</div>
                      </div>
                      <div style={{ fontWeight:800, fontSize:13.5, color: atrasado ? 'var(--negative)' : 'var(--ink)', flexShrink:0 }}>
                        {brl(ob.valor)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </GlassCard>
        );
      }

      case 'metas': return (
        <GlassCard style={{ padding: 22, height: '100%' }}>
          <CardTitle icon="target" title="Metas em andamento" action="Ver metas" onAction={() => go('metas')} />
          {metas.length === 0 ? (
            <div className="faint" style={{ fontSize: 12.5, textAlign: 'center', padding: '14px 0' }}>Nenhuma meta cadastrada ainda.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 16 }}>
              {metas.map(m => {
                const pct = m.alvo > 0 ? Math.round(((m.atual||0)/m.alvo)*100) : 0;
                return (
                  <div key={m.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontWeight: 600, fontSize: 13.5 }}>
                        <span style={{ color: m.cor }}>{Ic[m.icon] ? Ic[m.icon]({ size: 16 }) : null}</span>{m.titulo}
                      </div>
                      <span className="faint" style={{ fontSize: 12.5, fontWeight: 600 }}>{pct}%</span>
                    </div>
                    <Bar pct={pct} color={m.cor} />
                    <div className="faint" style={{ fontSize: 11.5, marginTop: 5 }}>{brl(m.atual||0)} de {brl(m.alvo)}</div>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>
      );

      default: return null;
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="screen" onDragEnd={handleDragEnd}>
      <PageHeader title={`${greeting} 🌸`} sub={`${dateStr} · ${today.length} compromisso${today.length === 1 ? '' : 's'} hoje.`}>
        <button className="btn-ghost btn" onClick={() => go('agenda')}><Ic.calDay size={17}/>Minha agenda</button>
        <button className="btn-ghost btn" onClick={() => { setEditing(e => !e); setShowManager(false); }}
          style={editing ? { background: 'color-mix(in oklab, var(--primary) 14%, transparent)', borderColor: 'var(--primary)', color: 'var(--primary)' } : {}}>
          <Ic.edit size={16}/>{editing ? 'Concluir' : 'Personalizar'}
        </button>
        {editing && (
          <button className="btn-ghost btn" onClick={() => setShowManager(true)}>
            <Ic.settings size={16}/>Widgets
          </button>
        )}
        <button className="btn" onClick={() => go('agenda')}><Ic.plus size={17}/>Adicionar</button>
      </PageHeader>

      {/* Edit mode banner */}
      {editing && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderRadius: 14, marginBottom: 14,
          background: 'color-mix(in oklab, var(--primary) 10%, transparent)', border: '1px dashed color-mix(in oklab, var(--primary) 45%, transparent)' }}>
          <span style={{ color: 'var(--primary)' }}><Ic.edit size={16}/></span>
          <span style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--primary)' }}>Modo de edição</span>
          <span className="faint" style={{ fontSize: 12.5 }}>Arraste para reorganizar · Clique nos controles para ajustar tamanho ou ocultar</span>
          <span style={{ flex: 1 }}/>
          {hidden.length > 0 && (
            <button className="btn-ghost btn" style={{ fontSize: 12.5, padding: '5px 12px' }} onClick={() => setShowManager(true)}>
              {hidden.length} oculto{hidden.length > 1 ? 's' : ''}
            </button>
          )}
          <button className="btn" style={{ fontSize: 12.5, padding: '6px 14px' }} onClick={() => setEditing(false)}>
            <Ic.check size={14}/>Concluir
          </button>
        </div>
      )}

      {/* Widget grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {visible.map((w, idx) => (
          <WidgetShell key={w.id} w={w} editing={editing}
            isDragOver={dragOver === w.id && dragSrc !== w.id}
            isFirst={idx === 0} isLast={idx === visible.length - 1}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onMoveUp={moveUp}
            onMoveDown={moveDown}
            onHide={(id) => { setVisible(id, false); window.showToast && window.showToast('Widget ocultado. Reative em "Widgets".', 'info'); }}
            onResize={setSize}>
            {renderWidget(w)}
          </WidgetShell>
        ))}
      </div>

      {/* Hidden widgets hint */}
      {editing && hidden.length > 0 && (
        <div style={{ marginTop: 16, padding: '14px 18px', borderRadius: 16,
          background: 'var(--chip-bg)', border: '1.5px dashed var(--line)', display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 22 }}>👁</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{hidden.length} widget{hidden.length > 1 ? 's' : ''} oculto{hidden.length > 1 ? 's' : ''}</div>
            <div className="faint" style={{ fontSize: 12.5 }}>
              {hidden.map(w => WIDGET_DEFS.find(d => d.id === w.id)?.label).join(' · ')}
            </div>
          </div>
          <button className="btn-ghost btn" onClick={() => setShowManager(true)}><Ic.settings size={15}/>Reativar</button>
        </div>
      )}

      {/* Widget manager modal */}
      {showManager && (
        <WidgetManager
          layout={layout}
          hidden={hidden}
          onToggle={(id, v) => { setVisible(id, v); window.showToast && window.showToast(v ? 'Widget reativado!' : 'Widget ocultado', v ? 'success' : 'info'); }}
          onReset={() => { reset(); window.showToast && window.showToast('Layout restaurado!'); }}
          onClose={() => setShowManager(false)}
        />
      )}
    </div>
  );
}

// ── Shared UI helpers (exported for other screens) ─────────────────────────────
function CardTitle({ icon, title, action, onAction, style: s }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', ...s }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ color: 'var(--primary)' }}>{Ic[icon] ? Ic[icon]({ size: 19 }) : null}</span>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{title}</h3>
      </div>
      {action && <button onClick={onAction} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--primary)', fontWeight: 600, fontSize: 13, fontFamily: 'var(--font-ui)', display: 'flex', alignItems: 'center', gap: 3 }}>{action}<Ic.chevR size={15}/></button>}
    </div>
  );
}

function Bar({ pct, color }) {
  return (
    <div style={{ height: 8, borderRadius: 8, background: 'rgba(158,74,105,0.12)', overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${pct}%`, borderRadius: 8, background: `linear-gradient(90deg, ${color}, color-mix(in oklab, ${color} 60%, white))`, transition: 'width 0.9s var(--ease)' }}/>
    </div>
  );
}

Object.assign(window, { Dashboard, CardTitle, Bar });
