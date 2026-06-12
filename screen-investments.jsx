// screen-investments.jsx — Módulo de Investimentos
// Padrão visual idêntico ao screen-finance.jsx (glassmorphism, paleta sazonal, gráficos)

/* ── Cores por instituição (geradas dinamicamente, 8 cores cíclicas) ────── */
const INST_COLORS = ['#9E4A69','#7c93c4','#4f9d7e','#d29a52','#C67C96','#caa7d0','#e07a88','#6abfa0','#b07848','#5b7fa6'];
const instColor = (nome, list) => INST_COLORS[list.indexOf(nome) % INST_COLORS.length] || '#97798a';

/* ── Donut reutilizado (mesmo que finance) ────────────────────────────────── */
function InvDonut({ slices, center, sub }) {
  if (!slices || slices.length === 0) return (
    <div style={{ width: 160, height: 160, borderRadius: '50%', background: 'var(--chip-bg)',
      display: 'grid', placeItems: 'center', flexShrink: 0 }}>
      <span className="faint" style={{ fontSize: 12 }}>Sem dados</span>
    </div>
  );
  const total = slices.reduce((s, x) => s + x.valor, 0);
  const r = 54; const cx = 80; const cy = 80; const stroke = 18;
  let offset = 0;
  const circ = 2 * Math.PI * r;
  const arcs = slices.map(s => {
    const pct = total > 0 ? s.valor / total : 0;
    const dash = pct * circ;
    const arc = { ...s, dash, gap: circ - dash, offset: circ - offset };
    offset += dash;
    return arc;
  });
  return (
    <div style={{ position: 'relative', width: 160, height: 160, flexShrink: 0 }}>
      <svg width="160" height="160" viewBox="0 0 160 160">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--line)" strokeWidth={stroke}/>
        {arcs.map((a, i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={a.cor} strokeWidth={stroke}
            strokeDasharray={`${a.dash} ${a.gap}`} strokeDashoffset={a.offset}
            strokeLinecap="round" style={{ transition: 'stroke-dasharray 0.4s var(--ease)' }}/>
        ))}
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 13.5, lineHeight: 1.2, color: 'var(--ink)' }}>{center}</div>
          <div className="faint" style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, marginTop: 2 }}>{sub}</div>
        </div>
      </div>
    </div>
  );
}

/* ── Barra de progresso ───────────────────────────────────────────────────── */
function InvBar({ pct, color }) {
  return (
    <div style={{ height: 6, borderRadius: 99, background: 'var(--chip-bg)', overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${Math.min(100, pct)}%`, borderRadius: 99,
        background: color, transition: 'width 0.5s var(--ease)' }}/>
    </div>
  );
}

/* ── Modal de novo/editar investimento ─────────────────────────────────────── */
function InvestModal({ modal, onSave, onClose }) {
  const store = InvestmentStore;
  const institutions = store.getInstitutions();
  const [f, setF] = useS(() => modal.entry ? { ...modal.entry } : {
    nome: '', instituicao: institutions[0] || 'Nubank', tipo: 'CDB',
    valor: '', data: new Date().toISOString().slice(0,10), obs: '',
    valor_atual: '',
  });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  // Add new institution inline
  const [addingInst, setAddingInst] = useS(false);
  const [newInst, setNewInst] = useS('');
  const confirmInst = () => {
    if (!newInst.trim()) return;
    const ok = store.addInstitution(newInst);
    if (ok) { set('instituicao', newInst.trim()); setAddingInst(false); setNewInst(''); window.showToast && window.showToast(`Instituição "${newInst.trim()}" adicionada!`); }
    else { window.showToast && window.showToast('Já existe essa instituição.', 'error'); }
  };

  const valid = f.nome.trim() && f.valor && parseFloat(String(f.valor).replace(',','.')) > 0;

  const handleSave = () => {
    const valor = parseFloat(String(f.valor).replace(',','.')) || 0;
    const valor_atual = f.valor_atual ? parseFloat(String(f.valor_atual).replace(',','.')) : valor;
    onSave({ ...f, valor, valor_atual, nome: f.nome.trim() });
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(40,20,30,0.4)',
      backdropFilter: 'blur(4px)', display: 'grid', placeItems: 'center', padding: 20 }}>
      <GlassCard onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 500, padding: 26, maxHeight: '92vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 className="serif" style={{ margin: 0, fontSize: 26 }}>
            {modal.mode === 'new' ? 'Novo investimento' : 'Editar investimento'}
          </h3>
          <button className="icon-btn" onClick={onClose}><Ic.plus size={18} style={{ transform: 'rotate(45deg)' }}/></button>
        </div>

        {/* Nome */}
        <label className="ev-label">Nome do investimento</label>
        <div className="field" style={{ marginTop: 6 }}>
          <Ic.target size={16} style={{ color: 'var(--ink-faint)' }}/>
          <input value={f.nome} autoFocus onChange={e => set('nome', e.target.value)} placeholder="Ex.: Reserva Emergência"/>
        </div>

        {/* Instituição + Tipo */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 14 }}>
          <div>
            <label className="ev-label">Instituição</label>
            <div className="field" style={{ marginTop: 6, padding: 0, overflow: 'hidden' }}>
              <select value={f.instituicao} onChange={e => { if (e.target.value === '__new__') setAddingInst(true); else set('instituicao', e.target.value); }}
                style={{ flex: 1, border: 'none', background: 'none', padding: '10px 12px', outline: 'none',
                  fontFamily: 'var(--font-ui)', fontSize: 14, color: 'var(--ink)', cursor: 'pointer' }}>
                {store.getInstitutions().map(i => <option key={i} value={i}>{i}</option>)}
                <option value="__new__">+ Adicionar instituição</option>
              </select>
            </div>
          </div>
          <div>
            <label className="ev-label">Tipo</label>
            <div className="field" style={{ marginTop: 6, padding: 0, overflow: 'hidden' }}>
              <select value={f.tipo} onChange={e => set('tipo', e.target.value)}
                style={{ flex: 1, border: 'none', background: 'none', padding: '10px 12px', outline: 'none',
                  fontFamily: 'var(--font-ui)', fontSize: 14, color: 'var(--ink)', cursor: 'pointer' }}>
                {INVEST_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Inline add institution */}
        {addingInst && (
          <div style={{ marginTop: 10, padding: '12px 14px', borderRadius: 14, background: 'var(--chip-bg)', border: '1px solid var(--line)', display: 'flex', gap: 8, alignItems: 'center' }}>
            <div className="field" style={{ flex: 1, marginTop: 0 }}>
              <Ic.link size={14} style={{ color: 'var(--ink-faint)' }}/>
              <input value={newInst} autoFocus onChange={e => setNewInst(e.target.value)} placeholder="Nome da instituição"
                onKeyDown={e => { if (e.key === 'Enter') confirmInst(); if (e.key === 'Escape') setAddingInst(false); }}/>
            </div>
            <button className="btn" style={{ padding: '8px 14px', fontSize: 12.5, flexShrink: 0 }} onClick={confirmInst}><Ic.check size={14}/>Adicionar</button>
            <button className="btn-ghost btn" style={{ padding: '8px 12px', fontSize: 12.5 }} onClick={() => { setAddingInst(false); setNewInst(''); }}>✕</button>
          </div>
        )}

        {/* Valor + Data */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 14 }}>
          <div>
            <label className="ev-label">Valor investido (R$)</label>
            <div className="field" style={{ marginTop: 6 }}>
              <Ic.wallet size={15} style={{ color: 'var(--ink-faint)' }}/>
              <input type="number" min="0" step="0.01" value={f.valor} onChange={e => { set('valor', e.target.value); set('valor_atual', e.target.value); }} placeholder="0,00"/>
            </div>
          </div>
          <div>
            <label className="ev-label">Data do aporte</label>
            <div className="field" style={{ marginTop: 6, padding: '10px 12px' }}>
              <input type="date" value={f.data} onChange={e => set('data', e.target.value)}
                style={{ colorScheme: 'light', flex: 1, border: 'none', background: 'none', outline: 'none',
                  fontFamily: 'var(--font-ui)', fontSize: 14, color: 'var(--ink)' }}/>
            </div>
          </div>
        </div>

        {/* Valor atual (rentabilidade manual) */}
        <div style={{ marginTop: 14 }}>
          <label className="ev-label">Valor atual (R$) <span className="faint" style={{ fontWeight: 400, textTransform: 'none', fontSize: 11 }}>— opcional, para calcular rentabilidade</span></label>
          <div className="field" style={{ marginTop: 6 }}>
            <Ic.arrowUp size={15} style={{ color: 'var(--ink-faint)' }}/>
            <input type="number" min="0" step="0.01" value={f.valor_atual} onChange={e => set('valor_atual', e.target.value)} placeholder="Igual ao valor investido"/>
          </div>
        </div>

        {/* Observações */}
        <div style={{ marginTop: 14 }}>
          <label className="ev-label">Observações</label>
          <div className="field" style={{ marginTop: 6, alignItems: 'flex-start' }}>
            <Ic.edit size={15} style={{ color: 'var(--ink-faint)', marginTop: 2 }}/>
            <textarea value={f.obs} onChange={e => set('obs', e.target.value)} placeholder="Opcional" rows={2}
              style={{ flex: 1, border: 'none', background: 'none', outline: 'none', fontFamily: 'var(--font-ui)', fontSize: 14, color: 'var(--ink)', resize: 'none' }}/>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 22 }}>
          {modal.mode === 'edit' && (
            <button className="btn btn-ghost" onClick={modal.onDelete} style={{ color: 'var(--negative)' }}>
              <Ic.trash size={15}/>Excluir
            </button>
          )}
          <span style={{ flex: 1 }}/>
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn" disabled={!valid} onClick={handleSave} style={{ opacity: valid ? 1 : 0.5 }}>
            <Ic.check size={16}/>{modal.mode === 'new' ? 'Criar' : 'Salvar'}
          </button>
        </div>
      </GlassCard>
    </div>
  );
}

/* ── Modal de gerenciar instituições ──────────────────────────────────────── */
function InstitutionManagerModal({ onClose }) {
  const store = useInvestmentStore();
  const [newInst, setNewInst] = useS('');
  const institutions = store.getInstitutions();

  const add = () => {
    if (!newInst.trim()) return;
    const ok = store.addInstitution(newInst);
    if (ok) { setNewInst(''); window.showToast && window.showToast(`"${newInst.trim()}" adicionada!`); }
    else { window.showToast && window.showToast('Já existe essa instituição.', 'error'); }
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(40,20,30,0.4)',
      backdropFilter: 'blur(4px)', display: 'grid', placeItems: 'center', padding: 20 }}>
      <GlassCard onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 400, padding: 26 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h3 className="serif" style={{ margin: 0, fontSize: 22 }}>Instituições</h3>
          <button className="icon-btn" onClick={onClose}><Ic.plus size={18} style={{ transform: 'rotate(45deg)' }}/></button>
        </div>
        <div className="field">
          <Ic.link size={15} style={{ color: 'var(--ink-faint)' }}/>
          <input value={newInst} onChange={e => setNewInst(e.target.value)} placeholder="Nova instituição (ex: XP, BTG…)"
            onKeyDown={e => e.key === 'Enter' && add()} maxLength={30}/>
          <button className="btn" style={{ padding: '6px 14px', fontSize: 13, borderRadius: 10 }} onClick={add}><Ic.plus size={14}/></button>
        </div>
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 300, overflowY: 'auto' }}>
          {institutions.map(inst => (
            <div key={inst} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
              borderRadius: 12, background: 'var(--chip-bg)' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: instColor(inst, institutions), flexShrink: 0 }}/>
              <span style={{ flex: 1, fontWeight: 600, fontSize: 14 }}>{inst}</span>
              {!INVEST_DEFAULT_INST.includes(inst) && (
                <button className="icon-btn" style={{ width: 28, height: 28, color: 'var(--negative)' }}
                  onClick={() => { store.removeInstitution(inst); window.showToast && window.showToast(`"${inst}" removida`, 'info'); }}>
                  <Ic.trash size={14}/>
                </button>
              )}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16, textAlign: 'right' }}>
          <button className="btn" onClick={onClose}>Fechar</button>
        </div>
      </GlassCard>
    </div>
  );
}

/* ── Tela principal ────────────────────────────────────────────────────────── */
function Investimentos() {
  const store = useInvestmentStore();
  const [modal, setModal] = useS(null);
  const [instModal, setInstModal] = useS(false);
  const [search, setSearch] = useS('');

  const all = store.getAll();
  const institutions = store.getInstitutions();
  const porInst = store.getPorInstituicao();
  const porTipo = store.getPorTipo();
  const totalInv = store.getTotalInvestido();
  const totalAtual = store.getTotalAtual();
  const rentab = store.getRentabilidade();
  const rentabPct = totalInv > 0 ? (rentab / totalInv) * 100 : 0;
  const maiorInst = store.getMaiorInstituicao();
  const maxInstVal = porInst.length > 0 ? porInst[0].valor : 1;

  const filtered = all.filter(i =>
    i.nome.toLowerCase().includes(search.toLowerCase()) ||
    i.instituicao.toLowerCase().includes(search.toLowerCase()) ||
    i.tipo.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => (b.data || '').localeCompare(a.data || ''));

  const openNew  = () => setModal({ mode: 'new', entry: null });
  const openEdit = (inv) => setModal({
    mode: 'edit', entry: inv,
    onDelete: () => { store.remove(inv.id); setModal(null); window.showToast && window.showToast('Investimento removido', 'info'); }
  });

  const save = (data) => {
    if (modal.mode === 'new') { store.add(data); window.showToast && window.showToast('✓ Investimento registrado!'); }
    else { store.update(modal.entry.id, data); window.showToast && window.showToast('✓ Investimento atualizado'); }
    setModal(null);
  };

  const fmtDate = (iso) => {
    if (!iso) return '—';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  };

  const rentabColor = rentab >= 0 ? 'var(--positive)' : 'var(--negative)';

  return (
    <div className="screen">
      <PageHeader title="Investimentos" sub="Acompanhe seus aportes, instituições e rentabilidade.">
        <button className="btn-ghost btn" onClick={() => setInstModal(true)}><Ic.link size={16}/>Instituições</button>
        <button className="btn" onClick={openNew}><Ic.plus size={16}/>Novo investimento</button>
      </PageHeader>

      {/* ── Stat cards ── */}
      <div className="stat-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 16 }}>
        <StatCard icon="wallet"    label="Total investido"      value={brl(totalInv)}         color="var(--primary)" />
        <StatCard icon="arrowUp"   label="Rentabilidade total"  value={`${rentab >= 0 ? '+' : ''}${brl(rentab)}`} color={rentabColor} />
        <StatCard icon="target"    label="Maior instituição"    value={maiorInst}              color="var(--accent)" />
        <StatCard icon="grid"      label="Aplicações"           value={`${all.length} invest.`} color="var(--ink-soft)" />
      </div>

      {/* ── Row 1: donut instituição + donut tipo ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <GlassCard style={{ padding: 22 }}>
          <CardTitle icon="filter" title="Distribuição por instituição" />
          {porInst.length === 0 ? (
            <div className="faint" style={{ textAlign: 'center', padding: '40px 0', fontSize: 13 }}>Adicione investimentos para ver a distribuição.</div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 14 }}>
              <InvDonut
                slices={porInst.map(p => ({ ...p, cor: instColor(p.nome, institutions) }))}
                center={brl(totalInv)} sub="TOTAL"/>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 180, overflowY: 'auto' }}>
                {porInst.map(p => {
                  const pct = totalInv > 0 ? (p.valor / totalInv * 100).toFixed(1) : 0;
                  const cor = instColor(p.nome, institutions);
                  return (
                    <div key={p.nome}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, marginBottom: 4 }}>
                        <span style={{ width: 10, height: 10, borderRadius: 3, background: cor, flexShrink: 0 }}/>
                        <span style={{ flex: 1, fontWeight: 600 }}>{p.nome}</span>
                        <span className="faint" style={{ fontWeight: 600, fontSize: 11.5 }}>{pct}%</span>
                        <span className="faint" style={{ fontWeight: 600 }}>{brl(p.valor)}</span>
                      </div>
                      <InvBar pct={parseFloat(pct)} color={cor}/>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </GlassCard>

        <GlassCard style={{ padding: 22 }}>
          <CardTitle icon="grid" title="Distribuição por tipo" />
          {porTipo.length === 0 ? (
            <div className="faint" style={{ textAlign: 'center', padding: '40px 0', fontSize: 13 }}>Sem dados ainda.</div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 14 }}>
              <InvDonut slices={porTipo.map(p => ({ nome: p.tipo, valor: p.valor, cor: p.cor }))}
                center={`${porTipo.length} tipos`} sub="INVESTIDOS"/>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 180, overflowY: 'auto' }}>
                {porTipo.map(p => {
                  const pct = totalInv > 0 ? (p.valor / totalInv * 100).toFixed(1) : 0;
                  return (
                    <div key={p.tipo}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, marginBottom: 4 }}>
                        <span style={{ width: 10, height: 10, borderRadius: 3, background: p.cor, flexShrink: 0 }}/>
                        <span style={{ flex: 1, fontWeight: 600 }}>{p.tipo}</span>
                        <span className="faint" style={{ fontWeight: 600, fontSize: 11.5 }}>{pct}%</span>
                        <span className="faint" style={{ fontWeight: 600 }}>{brl(p.valor)}</span>
                      </div>
                      <InvBar pct={parseFloat(pct)} color={p.cor}/>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </GlassCard>
      </div>

      {/* ── Row 2: caixinhas por instituição ── */}
      {porInst.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14, marginBottom: 16 }}>
          {porInst.map(p => {
            const cor = instColor(p.nome, institutions);
            const pct = totalInv > 0 ? (p.valor / totalInv * 100) : 0;
            const qtd = all.filter(i => i.instituicao === p.nome).length;
            return (
              <GlassCard key={p.nome} style={{ padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `color-mix(in oklab, ${cor} 18%, transparent)`,
                    display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <Ic.wallet size={18} style={{ color: cor }}/>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.nome}</div>
                    <div className="faint" style={{ fontSize: 11.5 }}>{qtd} aplicaç{qtd === 1 ? 'ão' : 'ões'}</div>
                  </div>
                </div>
                <div style={{ fontWeight: 800, fontSize: 20, color: cor, marginBottom: 8 }}>{brl(p.valor)}</div>
                <InvBar pct={pct} color={cor}/>
                <div className="faint" style={{ fontSize: 11, marginTop: 5, textAlign: 'right' }}>{pct.toFixed(1)}% do total</div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* ── Histórico de investimentos ── */}
      <GlassCard style={{ padding: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
          <CardTitle icon="receipt" title="Histórico de investimentos" style={{ flex: 1, margin: 0 }}/>
          <div className="field" style={{ width: 220, marginTop: 0 }}>
            <Ic.search size={15} style={{ color: 'var(--ink-faint)' }}/>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar…"/>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 0' }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>📈</div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Nenhum investimento registrado</div>
            <div className="faint" style={{ fontSize: 13, marginBottom: 18 }}>Clique em "Novo investimento" para começar a acompanhar sua carteira.</div>
            <button className="btn" onClick={openNew}><Ic.plus size={16}/>Novo investimento</button>
          </div>
        ) : (
          <div>
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 120px 130px 100px 100px', gap: 12,
              padding: '6px 10px', borderBottom: '1px solid var(--line)', marginBottom: 4 }}>
              {['Nome', 'Instituição', 'Tipo', 'Valor', 'Data', 'Ações'].map(h => (
                <div key={h} className="faint" style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase' }}>{h}</div>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {filtered.map((inv, idx) => {
                const cor = instColor(inv.instituicao, institutions);
                const tipoCor = INVEST_TYPE_COLORS[inv.tipo] || '#97798a';
                const rentab = (inv.valor_atual || inv.valor) - inv.valor;
                const hasRentab = inv.valor_atual && inv.valor_atual !== inv.valor;
                return (
                  <div key={inv.id} style={{ display: 'grid', gridTemplateColumns: '1fr 140px 120px 130px 100px 100px', gap: 12,
                    padding: '12px 10px', borderBottom: idx < filtered.length - 1 ? '1px solid var(--line)' : 'none',
                    alignItems: 'center', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--chip-bg)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    {/* Nome */}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{inv.nome}</div>
                      {inv.obs && <div className="faint" style={{ fontSize: 11.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{inv.obs}</div>}
                    </div>
                    {/* Instituição */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: cor, flexShrink: 0 }}/>
                      <span style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{inv.instituicao}</span>
                    </div>
                    {/* Tipo */}
                    <div>
                      <span className="chip" style={{ background: `color-mix(in oklab, ${tipoCor} 16%, transparent)`,
                        color: tipoCor, border: 'none', fontSize: 11.5, padding: '3px 9px' }}>{inv.tipo}</span>
                    </div>
                    {/* Valor */}
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--positive)' }}>+{brl(inv.valor)}</div>
                      {hasRentab && (
                        <div style={{ fontSize: 11.5, fontWeight: 600, color: rentab >= 0 ? 'var(--positive)' : 'var(--negative)' }}>
                          atual: {brl(inv.valor_atual)} ({rentab >= 0 ? '+' : ''}{rentab.toFixed(2).replace('.',',')}%)
                        </div>
                      )}
                    </div>
                    {/* Data */}
                    <div className="faint" style={{ fontSize: 13, fontWeight: 600 }}>{fmtDate(inv.data)}</div>
                    {/* Ações */}
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="icon-btn" style={{ width: 30, height: 30 }} title="Editar" onClick={() => openEdit(inv)}><Ic.edit size={14}/></button>
                      <button className="icon-btn" style={{ width: 30, height: 30 }} title="Duplicar"
                        onClick={() => { store.duplicate(inv.id); window.showToast && window.showToast('✓ Investimento duplicado'); }}>
                        <Ic.plus size={14}/>
                      </button>
                      <button className="icon-btn" style={{ width: 30, height: 30, color: 'var(--negative)' }} title="Excluir"
                        onClick={() => { store.remove(inv.id); window.showToast && window.showToast('Removido', 'info'); }}>
                        <Ic.trash size={14}/>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Totais rodapé */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 24, padding: '12px 10px 0',
              borderTop: '1px solid var(--line)', marginTop: 4 }}>
              <span className="faint" style={{ fontSize: 12.5 }}>{filtered.length} de {all.length} registros</span>
              <span style={{ fontWeight: 700, fontSize: 14 }}>Total: <span style={{ color: 'var(--positive)' }}>{brl(filtered.reduce((s,i) => s + i.valor, 0))}</span></span>
            </div>
          </div>
        )}
      </GlassCard>

      {/* Modais */}
      {modal && <InvestModal modal={modal} onSave={save} onClose={() => setModal(null)} />}
      {instModal && <InstitutionManagerModal onClose={() => setInstModal(false)} />}
    </div>
  );
}

window.Investimentos = Investimentos;
