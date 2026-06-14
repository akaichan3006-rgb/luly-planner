// screen-finance.jsx — Financeiro com categorias customizadas, cartões e parcelamento
const FINANCE_WIDGETS = [
  { id: 'investimentos', label: 'Atalho Investimentos' },
  { id: 'stats',         label: 'Cards de saldo' },
  { id: 'evolucao',      label: 'Evolução + Gastos por categoria' },
  { id: 'ranking',       label: 'Ranking + Histórico' },
  { id: 'cartoes',       label: 'Cartões e parcelas' },
];

function InvBanner({ go }) {
  const inv = useInvestmentStore();
  const total  = inv.getTotalInvestido();
  const rentab = inv.getRentabilidade();
  const qtd    = inv.getAll().length;
  if (total === 0) return (
    <div onClick={() => go('investimentos')} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 18px', borderRadius: 16,
      background: 'color-mix(in oklab, var(--primary) 8%, transparent)', border: '1.5px dashed color-mix(in oklab, var(--primary) 35%, transparent)',
      cursor: 'pointer', marginBottom: 16, transition: 'all 0.18s' }}
      onMouseEnter={e => e.currentTarget.style.background = 'color-mix(in oklab, var(--primary) 14%, transparent)'}
      onMouseLeave={e => e.currentTarget.style.background = 'color-mix(in oklab, var(--primary) 8%, transparent)'}>
      <span style={{ color: 'var(--primary)' }}><Ic.arrowUp size={20}/></span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--primary)' }}>Módulo de Investimentos</div>
        <div className="faint" style={{ fontSize: 12.5 }}>Registre CDB, Tesouro, Ações e muito mais. Clique para acessar.</div>
      </div>
      <span style={{ color: 'var(--primary)' }}><Ic.chevR size={16}/></span>
    </div>
  );
  return (
    <div onClick={() => go('investimentos')} style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '14px 18px', borderRadius: 16,
      background: 'color-mix(in oklab, var(--primary) 8%, transparent)', border: '1px solid color-mix(in oklab, var(--primary) 20%, transparent)',
      cursor: 'pointer', marginBottom: 16, transition: 'all 0.18s' }}
      onMouseEnter={e => e.currentTarget.style.background = 'color-mix(in oklab, var(--primary) 14%, transparent)'}
      onMouseLeave={e => e.currentTarget.style.background = 'color-mix(in oklab, var(--primary) 8%, transparent)'}>
      <div style={{ width: 42, height: 42, borderRadius: 12, background: 'color-mix(in oklab, var(--primary) 18%, transparent)',
        display: 'grid', placeItems: 'center', flexShrink: 0 }}>
        <Ic.arrowUp size={20} style={{ color: 'var(--primary)' }}/>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--primary)', marginBottom: 2 }}>Carteira de Investimentos</div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12.5, fontWeight: 600 }}>{brl(total)} investidos</span>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: rentab >= 0 ? 'var(--positive)' : 'var(--negative)' }}>
            {rentab >= 0 ? '+' : ''}{brl(rentab)} rentabilidade
          </span>
          <span className="faint" style={{ fontSize: 12 }}>{qtd} aplicaç{qtd === 1 ? 'ão' : 'ões'}</span>
        </div>
      </div>
      <span className="faint" style={{ fontSize: 12.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
        Ver detalhes <Ic.chevR size={14}/>
      </span>
    </div>
  );
}

function Financeiro({ go }) {
  const store    = useFinanceStore();
  const catStore = useCustomCategoryStore();
  const cardStore = useCardStore();
  const [modal, setModal] = useS(null);
  const [catModal, setCatModal] = useS(false);
  const [cardModal, setCardModal] = useS(null);
  const [alloModal, setAlloModal] = useS(false);
  const [editing, setEditing] = useS(false);
  const { visible, hidden, setVisible, moveUp, moveDown, reset } = useScreenLayout('financeiro', FINANCE_WIDGETS);

  const receitas   = store.getReceitas();
  const despesas   = store.getDespesas();
  const categorias = store.getCategorias();
  const evolucao   = store.getEvolucao();
  const gastosPorCartao = store.getGastosPorCartao();
  const parcelasFuturas = store.getParcelasFuturas();

  const lancamentos = [
    ...receitas.map(r => ({ ...r, _tipo: 'receita', _dir: 'in',  desc: r.desc || r.fonte, cat: r.cat || 'Receita' })),
    ...despesas.map(d => ({ ...d, _tipo: 'despesa', _dir: 'out', desc: d.desc || d.fonte })),
  ].sort((a, b) => (b.created_at||'').localeCompare(a.created_at||''));

  const maxCat    = categorias.length > 0 ? Math.max(...categorias.map(c => c.valor)) : 1;
  const maxCartao = gastosPorCartao.length > 0 ? Math.max(...gastosPorCartao.map(c => c.valor)) : 1;

  const openNew  = () => setModal({ mode: 'new', entry: null });
  const openEdit = (l) => setModal({ mode: 'edit', entry: l });
  const save = (data, tipo) => {
    if (modal.mode === 'new') {
      store.add(tipo, data);
      showToast(tipo === 'receita' ? '✓ Receita adicionada' : data.tipo_lancamento === 'credito_parcelado' ? `✓ ${data.parcelas} parcelas criadas` : '✓ Despesa adicionada');
    } else {
      store.update(modal.entry._tipo, modal.entry.id, data);
      showToast('✓ Lançamento atualizado');
    }
    setModal(null);
  };
  const del = (removeGroup) => {
    store.remove(modal.entry._tipo, modal.entry.id, removeGroup);
    showToast('Lançamento removido', 'info');
    setModal(null);
  };

  return (
    <div className="screen">
      <PageHeader title="Controle Financeiro" sub="Acompanhe entradas, saídas e para onde seu dinheiro vai.">
        <button className="btn-ghost btn" onClick={() => setCardModal({ mode: 'list' })}><Ic.wallet size={16}/>Cartões</button>
        <button className="btn-ghost btn" onClick={() => go('investimentos')}><Ic.arrowUp size={16}/>Investimentos</button>
        <button className="btn-ghost btn" onClick={() => setEditing(e => !e)}
          style={editing ? { background: 'color-mix(in oklab, var(--primary) 14%, transparent)', borderColor: 'var(--primary)', color: 'var(--primary)' } : {}}>
          <Ic.edit size={16}/>{editing ? 'Editando…' : 'Personalizar'}
        </button>
        <button className="btn" onClick={openNew}><Ic.plus size={16}/>Novo lançamento</button>
      </PageHeader>

      <ScreenEditBanner editing={editing} hidden={hidden} defs={FINANCE_WIDGETS}
        onToggle={(id, v) => setVisible(id, v)} onReset={reset} onDone={() => setEditing(false)} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {visible.map((w, idx) => {
        const isFirst = idx === 0, isLast = idx === visible.length - 1;
        const wrap = (content) => (
          <ScreenWidget key={w.id} id={w.id} label={FINANCE_WIDGETS.find(d => d.id === w.id)?.label}
            editing={editing} isFirst={isFirst} isLast={isLast}
            onHide={id => setVisible(id, false)} onMoveUp={moveUp} onMoveDown={moveDown}>
            {content}
          </ScreenWidget>
        );

        if (w.id === 'investimentos') return wrap(<InvBanner key="inv" go={go} />);

        if (w.id === 'stats') return wrap(
          <div className="stat-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
            <div style={{ position: 'relative' }}>
              <StatCard icon="wallet" label="Saldo atual" value={brl(store.getSaldo())} color="var(--primary)" />
              <button onClick={() => setAlloModal(true)}
                style={{ position: 'absolute', bottom: 10, right: 12, padding: '3px 9px', borderRadius: 999,
                  background: 'color-mix(in oklab, var(--primary) 13%, transparent)',
                  border: '1px solid color-mix(in oklab, var(--primary) 28%, transparent)',
                  color: 'var(--primary)', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                  fontFamily: 'var(--font-ui)', display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'color-mix(in oklab, var(--primary) 22%, transparent)'}
                onMouseLeave={e => e.currentTarget.style.background = 'color-mix(in oklab, var(--primary) 13%, transparent)'}>
                <Ic.arrowUp size={11}/>Alocar
              </button>
            </div>
            <StatCard icon="arrowDown" label="Entradas do mês" value={brl(store.getEntradasMes())} color="var(--positive)" />
            <StatCard icon="arrowUp"   label="Saídas do mês"   value={brl(store.getSaidasMes())}   color="var(--negative)" />
            <StatCard icon="leaf"      label="Economia do mês" value={brl(store.getEconomiaMes())} color="var(--accent)" />
          </div>
        );

        if (w.id === 'evolucao') return wrap(
          <div style={{ display: 'grid', gridTemplateColumns: '1.45fr 1fr', gap: 16 }}>
            <GlassCard style={{ padding: 22 }}>
              <CardTitle icon="arrowUp" title="Evolução financeira" />
              <div style={{ display: 'flex', gap: 18, margin: '12px 0 4px' }}>
                <Legend color="var(--primary)" label="Entradas" />
                <Legend color="var(--accent)"  label="Saídas" />
              </div>
              <EvolutionChart data={evolucao} />
            </GlassCard>
            <GlassCard style={{ padding: 22 }}>
              <CardTitle icon="filter" title="Gastos por categoria" />
              {categorias.length === 0 ? (
                <div className="faint" style={{ textAlign: 'center', padding: '40px 0', fontSize: 13 }}>Adicione despesas para ver a distribuição.</div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 12 }}>
                  <Donut data={categorias} centerLabel={brl(store.getSaidasMes())} centerSub="TOTAL GASTO" />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7, maxHeight: 168, overflowY: 'auto' }}>
                    {categorias.slice(0,6).map(c => (
                      <div key={c.nome} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}>
                        <span style={{ width: 10, height: 10, borderRadius: 3, background: c.cor, flexShrink: 0 }}/>
                        <span style={{ flex: 1, fontWeight: 600 }}>{c.nome}</span>
                        <span className="faint" style={{ fontWeight: 600 }}>{brl(c.valor)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </GlassCard>
          </div>
        );

        if (w.id === 'ranking') return wrap(
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.45fr', gap: 16 }}>
            <GlassCard style={{ padding: 22 }}>
              <CardTitle icon="grid" title="Ranking de categorias" />
              {categorias.length === 0 ? (
                <div className="faint" style={{ textAlign: 'center', padding: '40px 0', fontSize: 13 }}>Sem categorias ainda.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 16 }}>
                  {categorias.slice(0,7).map(c => (
                    <div key={c.nome}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
                          <span style={{ color: c.cor }}>{Ic[c.icon] ? Ic[c.icon]({ size: 15 }) : null}</span>{c.nome}
                        </span>
                        <span className="faint" style={{ fontWeight: 600 }}>{brl(c.valor)}</span>
                      </div>
                      <Bar pct={(c.valor/maxCat)*100} color={c.cor} />
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
            <GlassCard style={{ padding: 22 }}>
              <CardTitle icon="receipt" title="Histórico financeiro" />
              {lancamentos.length === 0 ? (
                <div className="faint" style={{ textAlign: 'center', padding: '40px 0', fontSize: 13 }}>
                  Sem lançamentos ainda.<br/>Clique em "Novo lançamento" para começar.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', marginTop: 12 }}>
                  {lancamentos.slice(0,12).map((l, i) => {
                    const card = l.card_id ? cardStore.getById(l.card_id) : null;
                    return (
                      <div key={l.id} onClick={() => openEdit(l)}
                        style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '11px 4px',
                          borderBottom: i < Math.min(11, lancamentos.length-1) ? '1px solid var(--line)' : 'none',
                          cursor: 'pointer', transition: 'opacity 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.opacity = '0.72'}
                        onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                        <div style={{ width: 38, height: 38, borderRadius: 11, display: 'grid', placeItems: 'center', flexShrink: 0,
                          background: l._dir === 'in' ? 'rgba(79,157,126,0.13)' : 'var(--chip-bg)',
                          color: l._dir === 'in' ? 'var(--positive)' : 'var(--ink-soft)' }}>
                          {Ic[l.icon || (l._dir==='in'?'arrowDown':'receipt')] ? Ic[l.icon||(l._dir==='in'?'arrowDown':'receipt')]({ size: 18 }) : <Ic.receipt size={18}/>}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.desc}</div>
                          <div className="faint" style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            {l.cat}
                            {l.installment_group_id && <span className="chip" style={{ padding: '1px 7px', fontSize: 10.5 }}>{l.installment_number}/{l.total_installments}x</span>}
                            {l.recorrente && <span className="chip" style={{ padding: '1px 7px', fontSize: 10.5 }}><Ic.clock size={10}/>fixo</span>}
                            {card && <span className="chip" style={{ padding: '1px 7px', fontSize: 10.5, color: card.color }}>{card.name}</span>}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 14, color: l._dir === 'in' ? 'var(--positive)' : 'var(--ink)' }}>
                            {l._dir === 'in' ? '+' : '–'}{brl(l.valor)}
                          </div>
                          <div className="faint" style={{ fontSize: 11.5 }}>dia {String(l.dia||'—').padStart(2,'0')}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </GlassCard>
          </div>
        );

        if (w.id === 'cartoes') return wrap(
          (gastosPorCartao.length > 0 || parcelasFuturas.length > 0) ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {gastosPorCartao.length > 0 && (
                <GlassCard style={{ padding: 22 }}>
                  <CardTitle icon="wallet" title="Gastos por cartão" />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 16 }}>
                    {gastosPorCartao.map(c => (
                      <div key={c.card_id}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
                            <span style={{ width: 10, height: 10, borderRadius: 3, background: c.cor }}/>
                            {c.nome}
                          </span>
                          <span className="faint" style={{ fontWeight: 600 }}>{brl(c.valor)}</span>
                        </div>
                        <Bar pct={(c.valor/maxCartao)*100} color={c.cor} />
                      </div>
                    ))}
                  </div>
                </GlassCard>
              )}
              {parcelasFuturas.length > 0 && (
                <GlassCard style={{ padding: 22 }}>
                  <CardTitle icon="clock" title="Parcelas futuras" />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
                    {parcelasFuturas.slice(0,6).map(g => {
                      const pct = Math.round((g.installment_number / g.total_installments) * 100);
                      const card = g.card_id ? cardStore.getById(g.card_id) : null;
                      return (
                        <div key={g.id} style={{ padding: '10px 12px', borderRadius: 12, background: 'var(--chip-bg)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <div style={{ fontWeight: 600, fontSize: 13.5 }}>{g.desc}</div>
                            <span className="chip" style={{ fontSize: 11 }}>{g.installment_number}/{g.total_installments}x</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
                            <span className="faint" style={{ fontSize: 11.5 }}>{brl(g.valor_parcela)}/mês · {g.restantes} restante{g.restantes!==1?'s':''}</span>
                            {card && <span className="faint" style={{ fontSize: 11, color: card.color }}>{card.name}</span>}
                          </div>
                          <Bar pct={pct} color="var(--primary)" />
                        </div>
                      );
                    })}
                  </div>
                </GlassCard>
              )}
            </div>
          ) : (
            <div className="faint" style={{ textAlign: 'center', padding: '24px 0', fontSize: 13 }}>
              Sem dados de cartões ou parcelas ainda.
            </div>
          )
        );

        return null;
      })}
      </div>

      {/* Modals */}
      {modal && (
        <TransactionModal
          modal={modal}
          onSave={save}
          onDelete={modal.mode === 'edit' ? del : null}
          onClose={() => setModal(null)}
          catStore={catStore}
          cardStore={cardStore}
          onNewCat={() => setCatModal(true)}
        />
      )}
      {catModal && (
        <CustomCategoryModal
          onSave={(data) => { catStore.add(data); showToast('✓ Categoria criada com sucesso'); setCatModal(false); }}
          onClose={() => setCatModal(false)}
        />
      )}
      {cardModal && (
        <CardManagerModal
          cardStore={cardStore}
          onClose={() => setCardModal(null)}
        />
      )}
      {alloModal && (
        <AllocateToInvestModal
          saldo={store.getSaldo()}
          onSave={(valor, desc, tipo, inst) => {
            store.add('despesa', {
              desc: desc || 'Aporte em investimentos',
              cat: 'Investimentos',
              valor,
              dia: new Date().getDate(),
              recorrente: false,
              tipo_lancamento: 'debito',
            });
            const invStore = window.InvestmentStore;
            if (invStore) invStore.add({
              nome: desc || tipo || 'Aporte',
              tipo: tipo || 'Outro',
              instituicao: inst || '',
              valor_inicial: valor,
              valor_atual: valor,
              data: new Date().toISOString().slice(0,10),
            });
            showToast('✓ Aporte registrado em Financeiro e Investimentos');
            setAlloModal(false);
          }}
          onClose={() => setAlloModal(false)}
        />
      )}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function Legend({ color, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, fontWeight: 600, color: 'var(--ink-soft)' }}>
      <span style={{ width: 12, height: 12, borderRadius: 4, background: color }}/>{label}
    </div>
  );
}

// ── TransactionModal ──────────────────────────────────────────────────────────
const SAIDA_OPTIONS = [
  { id: 'debito',            label: 'Débito',           sub: 'Pagamento à vista',    icon: 'arrowUp',  color: 'var(--negative)' },
  { id: 'credito',           label: 'Crédito',          sub: 'Cartão de crédito',    icon: 'wallet',   color: '#7c93c4' },
  { id: 'credito_parcelado', label: 'Parcelado',        sub: 'Compra parcelada',     icon: 'receipt',  color: 'var(--warn)' },
];
const RECEITA_CATS = ['Salário','Freelance','Comissão','Rendimentos','Dividendos','Aluguel recebido','Outros'];

function TransactionModal({ modal, onSave, onDelete, onClose, catStore, cardStore, onNewCat }) {
  const isEdit = modal.mode === 'edit';
  const entry  = modal.entry;

  // Determine initial tipo_lancamento from existing entry
  const initTipo = () => {
    if (!isEdit) return null;
    if (entry._tipo === 'receita') return 'entrada';
    if (entry.installment_group_id) return 'credito_parcelado';
    return 'debito';
  };

  // step: 'fluxo' → 'saida_tipo' → 'form'
  const initStep = () => {
    if (isEdit) return 'form';
    return 'fluxo';
  };

  const [step, setStep]   = useS(initStep); // 'fluxo' | 'saida_tipo' | 'form'
  const [fluxo, setFluxo] = useS(isEdit ? (entry._tipo === 'receita' ? 'entrada' : 'saida') : null);
  const [tipo, setTipo]   = useS(initTipo);
  const [f, setF]         = useS(() => isEdit ? { ...entry, parcelas: entry.total_installments || 2 } : {
    desc: '', cat: '', valor: '', dia: new Date().getDate(), recorrente: false, card_id: '', parcelas: 2,
  });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  const isReceita = fluxo === 'entrada';
  const isParcelado = tipo === 'credito_parcelado';

  // Category lists
  const customCats   = catStore ? catStore.getAll() : [];
  const customReceita = customCats.filter(c => c.tipo === 'receita' || c.tipo === 'ambos').map(c => c.name);
  const customDespesa = customCats.filter(c => c.tipo === 'despesa' || c.tipo === 'ambos').map(c => c.name);
  const receitaCats   = [...RECEITA_CATS, ...customReceita];
  const despesaCats   = [...CAT_FINANCE,  ...customDespesa];
  const cats = isReceita ? receitaCats : despesaCats;

  // Auto-select first category when switching fluxo/tipo
  useE(() => {
    if (fluxo && !isEdit) set('cat', isReceita ? receitaCats[0] : despesaCats[0]);
  }, [fluxo, tipo]);

  const cards = cardStore ? cardStore.getAll() : [];

  const valid = (f.desc||'').trim() && parseFloat(f.valor) > 0 && f.cat &&
    (!isParcelado || (parseInt(f.parcelas) >= 2));

  const handleSave = () => {
    const data = {
      ...f,
      valor: parseFloat(f.valor),
      dia:   parseInt(f.dia) || 1,
      tipo_lancamento: tipo,
      parcelas: isParcelado ? parseInt(f.parcelas) : undefined,
    };
    onSave(data, fluxo === 'entrada' ? 'receita' : 'despesa');
  };

  const valorParcela = isParcelado && parseFloat(f.valor) > 0 && parseInt(f.parcelas) >= 2
    ? parseFloat(f.valor) / parseInt(f.parcelas)
    : 0;

  // ── Step 1: Entrada ou Saída ─────────────────────────────────────────────
  if (step === 'fluxo') {
    return (
      <ModalShell title="Novo lançamento" onClose={onClose}>
        <p className="faint" style={{ fontSize: 13, margin: '0 0 20px', textAlign: 'center' }}>
          O dinheiro está entrando ou saindo?
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {/* Entrada */}
          <button onClick={() => { setFluxo('entrada'); setTipo('entrada'); setStep('form'); }}
            style={{ padding: '28px 16px', borderRadius: 18, border: '2px solid var(--line)',
              background: 'transparent', cursor: 'pointer', display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 12, transition: 'all 0.18s var(--ease)', fontFamily: 'var(--font-ui)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--positive)'; e.currentTarget.style.background = 'color-mix(in oklab, var(--positive) 8%, transparent)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.background = 'transparent'; }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'color-mix(in oklab, var(--positive) 14%, transparent)',
              display: 'grid', placeItems: 'center' }}>
              <Ic.arrowDown size={28} style={{ color: 'var(--positive)' }}/>
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 17, color: 'var(--ink)', marginBottom: 4 }}>Entrada</div>
              <div className="faint" style={{ fontSize: 12.5, textAlign: 'center' }}>Salário, freelance, rendimentos…</div>
            </div>
          </button>
          {/* Saída */}
          <button onClick={() => { setFluxo('saida'); setStep('saida_tipo'); }}
            style={{ padding: '28px 16px', borderRadius: 18, border: '2px solid var(--line)',
              background: 'transparent', cursor: 'pointer', display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 12, transition: 'all 0.18s var(--ease)', fontFamily: 'var(--font-ui)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--negative)'; e.currentTarget.style.background = 'color-mix(in oklab, var(--negative) 8%, transparent)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.background = 'transparent'; }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'color-mix(in oklab, var(--negative) 14%, transparent)',
              display: 'grid', placeItems: 'center' }}>
              <Ic.arrowUp size={28} style={{ color: 'var(--negative)' }}/>
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 17, color: 'var(--ink)', marginBottom: 4 }}>Saída</div>
              <div className="faint" style={{ fontSize: 12.5, textAlign: 'center' }}>Compras, contas, despesas…</div>
            </div>
          </button>
        </div>
      </ModalShell>
    );
  }

  // ── Step 2: tipo de saída (débito / crédito / parcelado) ─────────────────
  if (step === 'saida_tipo') {
    return (
      <ModalShell title="Tipo de saída" onClose={onClose} onBack={() => setStep('fluxo')}>
        <p className="faint" style={{ fontSize: 13, margin: '0 0 18px', textAlign: 'center' }}>
          Como foi essa saída?
        </p>
        <div className="tipo-lancamento-grid">
          {SAIDA_OPTIONS.map(opt => (
            <button key={opt.id} onClick={() => { setTipo(opt.id); setStep('form'); }}
              style={{ padding: '20px 12px', borderRadius: 16, border: `2px solid ${tipo===opt.id ? opt.color : 'var(--line)'}`,
                background: tipo===opt.id ? `color-mix(in oklab, ${opt.color} 12%, transparent)` : 'transparent',
                cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                transition: 'all 0.18s var(--ease)', fontFamily: 'var(--font-ui)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = opt.color; e.currentTarget.style.background = `color-mix(in oklab, ${opt.color} 10%, transparent)`; }}
              onMouseLeave={e => { if (tipo!==opt.id) { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.background = 'transparent'; } }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: `color-mix(in oklab, ${opt.color} 14%, transparent)`,
                display: 'grid', placeItems: 'center' }}>
                <span style={{ color: opt.color }}>{Ic[opt.icon]({ size: 22 })}</span>
              </div>
              <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>{opt.label}</span>
              <span className="faint" style={{ fontSize: 11.5, textAlign: 'center' }}>{opt.sub}</span>
            </button>
          ))}
        </div>
      </ModalShell>
    );
  }

  // ── Step 3: fill form ─────────────────────────────────────────────────────
  const tipoOpt = isReceita
    ? { label: 'Entrada', icon: 'arrowDown', color: 'var(--positive)' }
    : SAIDA_OPTIONS.find(o => o.id === tipo) || SAIDA_OPTIONS[0];
  return (
    <ModalShell
      title={isEdit ? 'Editar lançamento' : `Novo lançamento`}
      onClose={onClose}
      onBack={!isEdit ? () => setStep(isReceita ? 'fluxo' : 'saida_tipo') : undefined}
    >
      {/* Tipo badge */}
      {!isEdit && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderRadius: 10,
          background: `color-mix(in oklab, ${tipoOpt?.color} 12%, transparent)`,
          marginBottom: 16, width: 'fit-content' }}>
          <span style={{ color: tipoOpt?.color }}>{Ic[tipoOpt?.icon]({ size: 16 })}</span>
          <span style={{ fontWeight: 700, fontSize: 13, color: tipoOpt?.color }}>{tipoOpt?.label}</span>
          <span className="faint" style={{ fontSize: 12 }}>— {tipoOpt?.sub}</span>
        </div>
      )}

      {/* Descrição */}
      <label className="ev-label">Descrição</label>
      <div className="field" style={{ marginTop: 6 }}>
        <Ic.receipt size={16} style={{ color: 'var(--ink-faint)' }}/>
        <input autoFocus value={f.desc||''} onChange={e => set('desc', e.target.value)}
          placeholder={isReceita ? 'Ex.: Salário mensal' : 'Ex.: Aluguel'} />
      </div>

      {/* Categoria */}
      <label className="ev-label" style={{ marginTop: 14 }}>Categoria</label>
      <div className="cat-scroll" style={{ marginTop: 7 }}>
        {cats.map(cat => {
          const on = f.cat === cat;
          const cor = CustomCategoryStore.resolveColor(cat);
          return (
            <button key={cat} onClick={() => set('cat', cat)}
              style={{ padding: '6px 11px', borderRadius: 999, cursor: 'pointer',
                fontFamily: 'var(--font-ui)', fontSize: 12.5, fontWeight: 600, transition: 'all 0.15s',
                border: `1px solid ${on ? cor : 'var(--line)'}`,
                background: on ? `color-mix(in oklab, ${cor} 16%, transparent)` : 'transparent',
                color: on ? 'var(--ink)' : 'var(--ink-soft)' }}>
              {cat}
            </button>
          );
        })}
        {onNewCat && (
          <button onClick={() => { onClose(); setTimeout(onNewCat, 100); }}
            style={{ padding: '6px 11px', borderRadius: 999, cursor: 'pointer',
              fontFamily: 'var(--font-ui)', fontSize: 12.5, fontWeight: 600,
              border: '1px dashed var(--primary)', background: 'transparent', color: 'var(--primary)',
              display: 'flex', alignItems: 'center', gap: 5 }}>
            <Ic.plus size={13}/>Nova categoria
          </button>
        )}
      </div>

      {/* Valor + Dia */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
        <div>
          <label className="ev-label">Valor (R$)</label>
          <div className="field" style={{ marginTop: 6, padding: '10px 12px' }}>
            <input type="number" min="0" step="0.01" value={f.valor}
              onChange={e => set('valor', e.target.value)} placeholder="0,00"
              style={{ flex:1, border:'none', background:'none', outline:'none', fontFamily:'var(--font-ui)', fontSize:14, color:'var(--ink)' }}/>
          </div>
        </div>
        <div>
          <label className="ev-label">Dia do mês</label>
          <div className="field" style={{ marginTop: 6, padding: '10px 12px' }}>
            <input type="number" min="1" max="31" value={f.dia||''}
              onChange={e => set('dia', e.target.value)}
              style={{ flex:1, border:'none', background:'none', outline:'none', fontFamily:'var(--font-ui)', fontSize:14, color:'var(--ink)' }}/>
          </div>
        </div>
      </div>

      {/* Parcelamento (só para credito_parcelado) */}
      {isParcelado && (
        <React.Fragment>
          <label className="ev-label" style={{ marginTop: 14 }}>Parcelamento</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 7 }}>
            {[2,3,4,5,6,7,8,9,10,12,15,18,24].map(n => {
              const on = parseInt(f.parcelas) === n;
              return (
                <button key={n} onClick={() => set('parcelas', n)}
                  style={{ width: 46, height: 36, borderRadius: 10, cursor: 'pointer',
                    fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 700,
                    border: `1px solid ${on ? 'var(--warn)' : 'var(--line)'}`,
                    background: on ? 'color-mix(in oklab, var(--warn) 16%, transparent)' : 'transparent',
                    color: on ? 'var(--warn)' : 'var(--ink-soft)', transition: 'all 0.15s' }}>
                  {n}x
                </button>
              );
            })}
          </div>
          {valorParcela > 0 && (
            <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 12,
              background: 'color-mix(in oklab, var(--warn) 10%, transparent)',
              border: '1px solid color-mix(in oklab, var(--warn) 25%, transparent)' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--warn)' }}>
                {f.parcelas}x de {brl(valorParcela)} · total {brl(parseFloat(f.valor)||0)}
              </span>
            </div>
          )}
        </React.Fragment>
      )}

      {/* Cartão */}
      {cards.length > 0 && (
        <React.Fragment>
          <label className="ev-label" style={{ marginTop: 14 }}>Cartão utilizado <span className="faint" style={{ textTransform: 'none', fontWeight: 500 }}>(opcional)</span></label>
          <div className="card-selector-grid" style={{ marginTop: 7 }}>
            {cards.map(card => {
              const on = f.card_id === card.id;
              return (
                <button key={card.id} onClick={() => set('card_id', on ? '' : card.id)}
                  style={{ padding: '8px 14px', borderRadius: 12, cursor: 'pointer',
                    fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 600,
                    border: `1px solid ${on ? card.color : 'var(--line)'}`,
                    background: on ? `color-mix(in oklab, ${card.color} 14%, transparent)` : 'transparent',
                    color: on ? card.color : 'var(--ink-soft)',
                    display: 'flex', alignItems: 'center', gap: 7, transition: 'all 0.15s' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: card.color, flexShrink: 0 }}/>
                  {card.name}
                </button>
              );
            })}
          </div>
        </React.Fragment>
      )}

      {/* Recorrente */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14 }}>
        <button onClick={() => set('recorrente', !f.recorrente)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, border: 'none', background: 'none',
            cursor: 'pointer', fontFamily: 'var(--font-ui)', fontSize: 13.5, color: 'var(--ink)', padding: 0 }}>
          <div style={{ width: 20, height: 20, borderRadius: 6,
            border: `2px solid ${f.recorrente ? 'var(--primary)' : 'var(--line-strong)'}`,
            display: 'grid', placeItems: 'center', background: f.recorrente ? 'var(--primary)' : 'transparent' }}>
            {f.recorrente && <Ic.check size={13} style={{ color: '#fff' }}/>}
          </div>
          Recorrente (fixo mensal)
        </button>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 22 }}>
        {onDelete ? (
          <React.Fragment>
            <button className="btn btn-ghost" onClick={() => onDelete(false)} style={{ color: 'var(--negative)' }}>
              <Ic.trash size={15}/>Excluir
            </button>
            {modal.entry?.installment_group_id && (
              <button className="btn btn-ghost" onClick={() => onDelete(true)} style={{ color: 'var(--negative)', fontSize: 12 }}>
                Excluir todas parcelas
              </button>
            )}
          </React.Fragment>
        ) : <span style={{ flex: 1 }}/>}
        <span style={{ flex: 1 }}/>
        <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button className="btn" disabled={!valid} onClick={handleSave} style={{ opacity: valid ? 1 : 0.5 }}>
          <Ic.check size={16}/>{isEdit ? 'Salvar' : 'Criar'}
        </button>
      </div>
    </ModalShell>
  );
}

// ── CustomCategoryModal ───────────────────────────────────────────────────────
const CAT_ICONS_OPTIONS = ['receipt','salad','heart','car','home','sparkle','book','cap','droplet','leaf','flame','shield','target','wallet','rings','paw','tv','cart'];
const CAT_COLORS_OPTIONS = ['#d29a52','#9E4A69','#C67C96','#7c93c4','#4f9d7e','#caa7d0','#b06a86','#b04a34','#243D6B','#97798a'];

function CustomCategoryModal({ onSave, onClose }) {
  const [f, setF] = useS({ name: '', tipo: 'despesa', icon: 'receipt', color: '#9E4A69' });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const valid = (f.name||'').trim().length > 0;

  return (
    <ModalShell title="Nova categoria" onClose={onClose}>
      <label className="ev-label">Nome da categoria</label>
      <div className="field" style={{ marginTop: 6 }}>
        <Ic.receipt size={16} style={{ color: 'var(--ink-faint)' }}/>
        <input autoFocus value={f.name} onChange={e => set('name', e.target.value)} placeholder="Ex.: Academia"/>
      </div>

      <label className="ev-label" style={{ marginTop: 14 }}>Tipo</label>
      <div style={{ display: 'flex', gap: 8, marginTop: 7 }}>
        {[['despesa','Despesa'],['receita','Receita'],['ambos','Ambos']].map(([val, label]) => (
          <button key={val} onClick={() => set('tipo', val)}
            style={{ flex: 1, padding: '9px', borderRadius: 10, cursor: 'pointer',
              fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 600,
              border: `1px solid ${f.tipo===val ? 'var(--primary)' : 'var(--line)'}`,
              background: f.tipo===val ? 'color-mix(in oklab, var(--primary) 14%, transparent)' : 'transparent',
              color: f.tipo===val ? 'var(--primary)' : 'var(--ink-soft)', transition: 'all 0.15s' }}>
            {label}
          </button>
        ))}
      </div>

      <label className="ev-label" style={{ marginTop: 14 }}>Ícone</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 7 }}>
        {CAT_ICONS_OPTIONS.map(ic => {
          const on = f.icon === ic;
          return (
            <button key={ic} onClick={() => set('icon', ic)}
              style={{ width: 36, height: 36, borderRadius: 10, display: 'grid', placeItems: 'center',
                cursor: 'pointer', border: `1px solid ${on ? f.color : 'var(--line)'}`,
                background: on ? `color-mix(in oklab, ${f.color} 16%, transparent)` : 'transparent',
                color: on ? f.color : 'var(--ink-soft)', transition: 'all 0.15s' }}>
              {Ic[ic] ? Ic[ic]({ size: 17 }) : null}
            </button>
          );
        })}
      </div>

      <label className="ev-label" style={{ marginTop: 14 }}>Cor</label>
      <div style={{ display: 'flex', gap: 8, marginTop: 7, flexWrap: 'wrap' }}>
        {CAT_COLORS_OPTIONS.map(c => (
          <button key={c} onClick={() => set('color', c)}
            style={{ width: 30, height: 30, borderRadius: '50%', background: c, cursor: 'pointer',
              border: f.color===c ? `3px solid var(--ink)` : '3px solid transparent',
              outline: f.color===c ? `2px solid ${c}` : 'none', transition: 'all 0.15s' }}/>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
        <button className="btn btn-ghost" onClick={onClose} style={{ flex: 1, justifyContent: 'center' }}>Cancelar</button>
        <button className="btn" disabled={!valid} onClick={() => onSave({ ...f, name: f.name.trim() })}
          style={{ flex: 2, justifyContent: 'center', opacity: valid ? 1 : 0.5 }}>
          <Ic.check size={16}/>Criar categoria
        </button>
      </div>
    </ModalShell>
  );
}

// ── CardManagerModal ──────────────────────────────────────────────────────────
const CARD_BRANDS  = ['Visa','Mastercard','Elo','Amex','Hipercard','Outro'];
const CARD_COLORS  = ['#9E4A69','#7c93c4','#4f9d7e','#d29a52','#C67C96','#243D6B','#caa7d0','#b04a34'];

function CardManagerModal({ cardStore, onClose }) {
  const cards = cardStore.getAll();
  const [editing, setEditing] = useS(null); // null | card object
  const [newMode, setNewMode] = useS(false);

  if (editing || newMode) {
    const isNew = newMode;
    const initCard = isNew ? { name: '', brand: 'Visa', color: '#9E4A69', limit: '' } : { ...editing };
    return <CardEditForm card={initCard} isNew={isNew}
      onSave={data => {
        if (isNew) { cardStore.add(data); showToast('✓ Cartão adicionado'); }
        else { cardStore.update(editing.id, data); showToast('✓ Cartão atualizado'); }
        setEditing(null); setNewMode(false);
      }}
      onDelete={isNew ? null : () => { cardStore.remove(editing.id); showToast('Cartão removido','info'); setEditing(null); }}
      onBack={() => { setEditing(null); setNewMode(false); }}
    />;
  }

  return (
    <ModalShell title="Gerenciar cartões" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {cards.map(card => (
          <div key={card.id} onClick={() => setEditing(card)}
            style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', borderRadius: 14,
              background: 'var(--chip-bg)', cursor: 'pointer', transition: 'opacity 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.opacity='0.75'}
            onMouseLeave={e => e.currentTarget.style.opacity='1'}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: `linear-gradient(135deg, ${card.color}, color-mix(in oklab,${card.color} 60%, #000))`,
              display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
              {(card.brand||'?')[0]}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{card.name}</div>
              <div className="faint" style={{ fontSize: 12 }}>{card.brand}{card.limit ? ` · limite ${brl(card.limit)}` : ''}</div>
            </div>
            <Ic.edit size={15} style={{ color: 'var(--ink-faint)' }}/>
          </div>
        ))}
      </div>
      <button className="btn" onClick={() => setNewMode(true)} style={{ width: '100%', justifyContent: 'center', marginTop: 14 }}>
        <Ic.plus size={16}/>Adicionar cartão
      </button>
    </ModalShell>
  );
}

function CardEditForm({ card: initCard, isNew, onSave, onDelete, onBack }) {
  const [f, setF] = useS({ ...initCard });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const valid = (f.name||'').trim().length > 0;
  return (
    <ModalShell title={isNew ? 'Novo cartão' : 'Editar cartão'} onClose={onBack} onBack={onBack}>
      <label className="ev-label">Nome do cartão</label>
      <div className="field" style={{ marginTop: 6 }}>
        <Ic.wallet size={16} style={{ color: 'var(--ink-faint)' }}/>
        <input autoFocus value={f.name} onChange={e => set('name', e.target.value)} placeholder="Ex.: Nubank"/>
      </div>

      <label className="ev-label" style={{ marginTop: 14 }}>Bandeira</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 7 }}>
        {CARD_BRANDS.map(b => (
          <button key={b} onClick={() => set('brand', b)}
            style={{ padding: '6px 12px', borderRadius: 999, cursor: 'pointer',
              fontFamily: 'var(--font-ui)', fontSize: 12.5, fontWeight: 600,
              border: `1px solid ${f.brand===b ? 'var(--primary)' : 'var(--line)'}`,
              background: f.brand===b ? 'color-mix(in oklab, var(--primary) 14%, transparent)' : 'transparent',
              color: f.brand===b ? 'var(--primary)' : 'var(--ink-soft)', transition: 'all 0.15s' }}>
            {b}
          </button>
        ))}
      </div>

      <label className="ev-label" style={{ marginTop: 14 }}>Limite (opcional)</label>
      <div className="field" style={{ marginTop: 6, padding: '10px 12px' }}>
        <input type="number" min="0" step="100" value={f.limit||''} onChange={e => set('limit', parseFloat(e.target.value)||0)}
          placeholder="R$ 0,00"
          style={{ flex:1, border:'none', background:'none', outline:'none', fontFamily:'var(--font-ui)', fontSize:14, color:'var(--ink)' }}/>
      </div>

      <label className="ev-label" style={{ marginTop: 14 }}>Cor</label>
      <div style={{ display: 'flex', gap: 8, marginTop: 7, flexWrap: 'wrap' }}>
        {CARD_COLORS.map(c => (
          <button key={c} onClick={() => set('color', c)}
            style={{ width: 30, height: 30, borderRadius: '50%', background: c, cursor: 'pointer',
              border: f.color===c ? '3px solid var(--ink)' : '3px solid transparent',
              outline: f.color===c ? `2px solid ${c}` : 'none', transition: 'all 0.15s' }}/>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 22 }}>
        {onDelete && (
          <button className="btn btn-ghost" onClick={onDelete} style={{ color: 'var(--negative)' }}>
            <Ic.trash size={15}/>Excluir
          </button>
        )}
        <span style={{ flex: 1 }}/>
        <button className="btn btn-ghost" onClick={onBack}>Cancelar</button>
        <button className="btn" disabled={!valid} onClick={() => onSave({ ...f, name: f.name.trim() })}
          style={{ opacity: valid ? 1 : 0.5 }}>
          <Ic.check size={16}/>{isNew ? 'Adicionar' : 'Salvar'}
        </button>
      </div>
    </ModalShell>
  );
}

// ── AllocateToInvestModal ─────────────────────────────────────────────────────
function AllocateToInvestModal({ saldo, onSave, onClose }) {
  const invStore = useInvestmentStore ? useInvestmentStore() : null;
  const tipos = invStore ? invStore.getTypes() : (window.INVEST_DEFAULT_TYPES || []);
  const [val,  setVal]  = useS('');
  const [nome, setNome] = useS('');
  const [tipo, setTipo] = useS('');
  const [inst, setInst] = useS('');

  const num   = parseFloat(val) || 0;
  const valid = num > 0 && num <= saldo && tipo !== '';

  return (
    <ModalShell title="Novo aporte" onClose={onClose}>
      {/* Saldo disponível */}
      <div style={{ padding: '10px 16px', borderRadius: 12, marginBottom: 20,
        background: 'color-mix(in oklab, var(--primary) 9%, transparent)',
        border: '1px solid color-mix(in oklab, var(--primary) 20%, transparent)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className="faint" style={{ fontSize: 13, fontWeight: 600 }}>Saldo disponível</span>
        <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--primary)' }}>{brl(saldo)}</span>
      </div>

      {/* Valor */}
      <label className="ev-label">Valor do aporte (R$)</label>
      <div className="field" style={{ marginTop: 6, padding: '10px 12px' }}>
        <Ic.arrowUp size={16} style={{ color: 'var(--primary)' }}/>
        <input autoFocus type="number" min="0.01" max={saldo} step="0.01"
          value={val} onChange={e => setVal(e.target.value)} placeholder="0,00"
          style={{ flex:1, border:'none', background:'none', outline:'none', fontFamily:'var(--font-ui)', fontSize:15, fontWeight:700, color:'var(--ink)' }}/>
      </div>
      {num > saldo && num > 0 && (
        <div style={{ fontSize: 12, color: 'var(--negative)', marginTop: 5, fontWeight: 600 }}>
          Valor maior que o saldo disponível.
        </div>
      )}

      {/* Nome / descrição */}
      <label className="ev-label" style={{ marginTop: 14 }}>
        Nome do investimento <span className="faint" style={{ textTransform:'none', fontWeight:500 }}>(opcional)</span>
      </label>
      <div className="field" style={{ marginTop: 6 }}>
        <Ic.receipt size={16} style={{ color: 'var(--ink-faint)' }}/>
        <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex.: CDB 13% a.a., Tesouro Selic 2029…"/>
      </div>

      {/* Tipo de ativo */}
      <label className="ev-label" style={{ marginTop: 14 }}>Tipo de ativo <span style={{ color:'var(--negative)' }}>*</span></label>
      <div className="cat-scroll" style={{ marginTop: 7 }}>
        {tipos.map(t => (
          <button key={t} onClick={() => setTipo(p => p === t ? '' : t)}
            style={{ padding:'6px 12px', borderRadius:999, cursor:'pointer',
              fontFamily:'var(--font-ui)', fontSize:12.5, fontWeight:600, transition:'all 0.15s', whiteSpace:'nowrap',
              border:`1px solid ${tipo===t ? 'var(--primary)' : 'var(--line)'}`,
              background: tipo===t ? 'color-mix(in oklab, var(--primary) 14%, transparent)' : 'transparent',
              color: tipo===t ? 'var(--ink)' : 'var(--ink-soft)' }}>
            {t}
          </button>
        ))}
      </div>

      {/* Instituição */}
      <label className="ev-label" style={{ marginTop: 14 }}>
        Instituição <span className="faint" style={{ textTransform:'none', fontWeight:500 }}>(opcional)</span>
      </label>
      <div className="field" style={{ marginTop: 6 }}>
        <Ic.home size={16} style={{ color: 'var(--ink-faint)' }}/>
        <input value={inst} onChange={e => setInst(e.target.value)} placeholder="Ex.: XP, Nubank, Rico, BTG…"/>
      </div>

      {/* Resumo rápido */}
      {valid && (
        <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 12, fontSize: 13,
          background: 'color-mix(in oklab, var(--positive) 9%, transparent)',
          border: '1px solid color-mix(in oklab, var(--positive) 22%, transparent)',
          display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontWeight: 700, color: 'var(--positive)' }}>Será registrado:</div>
          <div className="faint">· Despesa de {brl(num)} com cat. "Investimentos" no histórico</div>
          <div className="faint">· Novo investimento: {nome || tipo}{inst ? ` · ${inst}` : ''}</div>
        </div>
      )}

      <div style={{ display:'flex', gap:10, marginTop:22 }}>
        <button className="btn btn-ghost" onClick={onClose} style={{ flex:1, justifyContent:'center' }}>Cancelar</button>
        <button className="btn" disabled={!valid} onClick={() => onSave(num, (nome || tipo).trim(), tipo, inst.trim())}
          style={{ flex:2, justifyContent:'center', opacity: valid ? 1 : 0.5 }}>
          <Ic.arrowUp size={15}/>Confirmar aporte
        </button>
      </div>
    </ModalShell>
  );
}

// ── ModalShell — base reutilizável para todos os modais ───────────────────────
function ModalShell({ title, children, onClose, onBack }) {
  return (
    <div className="modal-overlay" onClick={onClose}
      style={{ position:'fixed', inset:0, zIndex:60, background:'rgba(40,20,30,0.4)',
        backdropFilter:'blur(4px)', display:'grid', placeItems:'center', padding:20 }}>
      <GlassCard className="modal-card" onClick={e => e.stopPropagation()}
        style={{ width:'100%', maxWidth:480, padding:24, maxHeight:'88vh', overflowY:'auto' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18 }}>
          {onBack && (
            <button className="icon-btn" onClick={onBack} title="Voltar">
              {Ic.chevL({ size: 18 })}
            </button>
          )}
          <h3 className="serif" style={{ margin:0, fontSize:22, flex:1 }}>{title}</h3>
          <button className="icon-btn" onClick={onClose}><Ic.plus size={18} style={{ transform:'rotate(45deg)' }}/></button>
        </div>
        {children}
      </GlassCard>
    </div>
  );
}

Object.assign(window, { Financeiro, Legend, TransactionModal, CustomCategoryModal, CardManagerModal, ModalShell, AllocateToInvestModal });
