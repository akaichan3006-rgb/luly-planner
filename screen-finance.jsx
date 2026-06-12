// screen-finance.jsx
function Financeiro({ go }) {
  const store = useFinanceStore();
  const [periodo, setPeriodo] = useS('Mês');
  const [modal, setModal] = useS(null); // null | { mode:'new'|'edit', tipo:'receita'|'despesa', entry }

  const receitas = store.getReceitas();
  const despesas = store.getDespesas();
  const categorias = store.getCategorias();
  const evolucao = store.getEvolucao();

  const lancamentos = [
    ...receitas.map(r => ({ ...r, tipo: 'in', desc: r.fonte || r.desc, cat: 'Receita', icon: 'arrowDown', _tipo: 'receita' })),
    ...despesas.map(d => ({ ...d, tipo: 'out', desc: d.desc || d.fonte, _tipo: 'despesa', icon: d.icon || 'receipt' })),
  ].sort((a, b) => (b.dia||0) - (a.dia||0));

  const maxCat = categorias.length > 0 ? Math.max(...categorias.map(c => c.valor)) : 1;
  const hasData = lancamentos.length > 0;

  const openNew = (tipo) => setModal({ mode: 'new', tipo, entry: { desc: '', fonte: '', cat: tipo === 'receita' ? 'Salário' : 'Alimentação', valor: '', dia: new Date().getDate(), recorrente: false } });
  const openEdit = (l) => setModal({ mode: 'edit', tipo: l._tipo, entry: l });
  const save = (data) => {
    if (modal.mode === 'new') store.add(modal.tipo, data);
    else store.update(modal.tipo, modal.entry.id, data);
    setModal(null);
  };
  const del = () => { store.remove(modal.tipo, modal.entry.id); setModal(null); };

  return (
    <div className="screen">
      <PageHeader title="Controle Financeiro" sub="Acompanhe entradas, saídas e para onde seu dinheiro vai.">
        <div className="glass-soft" style={{ display: 'flex', padding: 4, gap: 2 }}>
          {['Semana', 'Mês', 'Ano'].map(p => (
            <button key={p} onClick={() => setPeriodo(p)} style={{ border: 'none', cursor: 'pointer', padding: '7px 14px', borderRadius: 10,
              fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 600,
              background: periodo === p ? 'var(--primary)' : 'transparent', color: periodo === p ? '#fff' : 'var(--ink-soft)', transition: '0.2s' }}>{p}</button>
          ))}
        </div>
        <button className="btn-ghost btn" onClick={() => openNew('receita')}><Ic.arrowDown size={16}/>Receita</button>
        <button className="btn" onClick={() => openNew('despesa')}><Ic.plus size={16}/>Despesa</button>
      </PageHeader>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 16 }}>
        <StatCard icon="wallet" label="Saldo atual" value={brl(store.getSaldo())} color="var(--primary)" />
        <StatCard icon="arrowDown" label="Entradas" value={brl(store.getEntradasMes())} color="var(--positive)" />
        <StatCard icon="arrowUp" label="Saídas" value={brl(store.getSaidasMes())} color="var(--negative)" />
        <StatCard icon="leaf" label="Economia" value={brl(store.getEconomiaMes())} color="var(--accent)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.45fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Evolution */}
        <GlassCard style={{ padding: 22 }}>
          <CardTitle icon="arrowUp" title="Evolução financeira" />
          <div style={{ display: 'flex', gap: 18, margin: '12px 0 4px' }}>
            <Legend color="var(--primary)" label="Entradas" />
            <Legend color="var(--accent)" label="Saídas" />
          </div>
          <EvolutionChart data={evolucao} />
        </GlassCard>

        {/* Donut */}
        <GlassCard style={{ padding: 22 }}>
          <CardTitle icon="filter" title="Gastos por categoria" />
          {categorias.length === 0 ? (
            <div className="faint" style={{ textAlign: 'center', padding: '40px 0', fontSize: 13 }}>Adicione despesas para ver a distribuição.</div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 12 }}>
              <Donut data={categorias} centerLabel={brl(store.getSaidasMes())} centerSub="TOTAL GASTO" />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7, maxHeight: 168, overflowY: 'auto' }}>
                {categorias.slice(0,6).map((c) => (
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.45fr', gap: 16 }}>
        {/* Ranking */}
        <GlassCard style={{ padding: 22 }}>
          <CardTitle icon="grid" title="Ranking de categorias" />
          {categorias.length === 0 ? (
            <div className="faint" style={{ textAlign: 'center', padding: '40px 0', fontSize: 13 }}>Sem categorias ainda.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 16 }}>
              {categorias.slice(0,7).map((c) => (
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

        {/* Histórico */}
        <GlassCard style={{ padding: 22 }}>
          <CardTitle icon="receipt" title="Histórico financeiro" />
          {!hasData ? (
            <div className="faint" style={{ textAlign: 'center', padding: '40px 0', fontSize: 13 }}>
              Sem lançamentos ainda.<br/>Use os botões acima para adicionar receitas e despesas.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', marginTop: 12 }}>
              {lancamentos.slice(0, 10).map((l, i) => (
                <div key={l.id} onClick={() => openEdit(l)} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '11px 4px',
                  borderBottom: i < Math.min(9, lancamentos.length - 1) ? '1px solid var(--line)' : 'none', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                  <div style={{ width: 38, height: 38, borderRadius: 11, display: 'grid', placeItems: 'center', flexShrink: 0,
                    background: l.tipo === 'in' ? 'rgba(79,157,126,0.13)' : 'var(--chip-bg)',
                    color: l.tipo === 'in' ? 'var(--positive)' : 'var(--ink-soft)' }}>
                    {Ic[l.icon] ? Ic[l.icon]({ size: 18 }) : <Ic.receipt size={18}/>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{l.desc}</div>
                    <div className="faint" style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 7 }}>
                      {l.cat}
                      {l.parcela && <span className="chip" style={{ padding: '1px 7px', fontSize: 10.5 }}>{l.parcela}</span>}
                      {l.recorrente && <span className="chip" style={{ padding: '1px 7px', fontSize: 10.5 }}><Ic.clock size={10}/>fixo</span>}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: l.tipo === 'in' ? 'var(--positive)' : 'var(--ink)' }}>
                      {l.tipo === 'in' ? '+' : '–'}{brl(l.valor)}
                    </div>
                    <div className="faint" style={{ fontSize: 11.5 }}>{String(l.dia||'—').padStart(2,'0')}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>

      {modal && (
        <TransactionModal
          modal={modal}
          onSave={save}
          onDelete={modal.mode === 'edit' ? del : null}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

function Legend({ color, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, fontWeight: 600, color: 'var(--ink-soft)' }}>
      <span style={{ width: 12, height: 12, borderRadius: 4, background: color }}/>{label}
    </div>
  );
}

function TransactionModal({ modal, onSave, onDelete, onClose }) {
  const isReceita = modal.tipo === 'receita';
  const [f, setF] = useS(() => ({ ...modal.entry }));
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const valid = (f.desc || f.fonte || '').trim() && parseFloat(f.valor) > 0;

  const RECEITA_CATS = ['Salário','Freelance','Comissão','Rendimentos','Dividendos','Aluguel recebido','Outros'];

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(40,20,30,0.4)',
      backdropFilter: 'blur(4px)', display: 'grid', placeItems: 'center', padding: 20 }}>
      <GlassCard onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 460, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h3 className="serif" style={{ margin: 0, fontSize: 24 }}>
            {modal.mode === 'new' ? (isReceita ? 'Nova receita' : 'Nova despesa') : (isReceita ? 'Editar receita' : 'Editar despesa')}
          </h3>
          <button className="icon-btn" onClick={onClose}><Ic.plus size={18} style={{ transform: 'rotate(45deg)' }}/></button>
        </div>

        <label className="ev-label">Descrição</label>
        <div className="field" style={{ marginTop: 6 }}>
          <Ic.receipt size={16} style={{ color: 'var(--ink-faint)' }}/>
          <input autoFocus value={f.desc || f.fonte || ''} onChange={(e) => { set('desc', e.target.value); set('fonte', e.target.value); }} placeholder={isReceita ? 'Ex.: Salário mensal' : 'Ex.: Aluguel'}/>
        </div>

        <label className="ev-label" style={{ marginTop: 14 }}>Categoria</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 7 }}>
          {(isReceita ? RECEITA_CATS : CAT_FINANCE).map((cat) => {
            const on = f.cat === cat;
            return (
              <button key={cat} onClick={() => set('cat', cat)} style={{ padding: '6px 11px', borderRadius: 999, cursor: 'pointer',
                fontFamily: 'var(--font-ui)', fontSize: 12.5, fontWeight: 600, transition: 'all 0.15s',
                border: '1px solid ' + (on ? 'var(--primary)' : 'var(--line)'),
                background: on ? 'color-mix(in oklab, var(--primary) 16%, transparent)' : 'transparent',
                color: on ? 'var(--ink)' : 'var(--ink-soft)' }}>
                {cat}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
          <div>
            <label className="ev-label">Valor (R$)</label>
            <div className="field" style={{ marginTop: 6, padding: '10px 12px' }}>
              <input type="number" min="0" step="0.01" value={f.valor} onChange={(e) => set('valor', parseFloat(e.target.value) || '')} placeholder="0,00"/>
            </div>
          </div>
          <div>
            <label className="ev-label">Dia do mês</label>
            <div className="field" style={{ marginTop: 6, padding: '10px 12px' }}>
              <input type="number" min="1" max="31" value={f.dia||''} onChange={(e) => set('dia', parseInt(e.target.value)||1)}/>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14 }}>
          <button onClick={() => set('recorrente', !f.recorrente)} style={{ display: 'flex', alignItems: 'center', gap: 8, border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontSize: 13.5, color: 'var(--ink)', padding: 0 }}>
            <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${f.recorrente ? 'var(--primary)' : 'var(--line-strong)'}`, display: 'grid', placeItems: 'center', background: f.recorrente ? 'var(--primary)' : 'transparent' }}>
              {f.recorrente && <Ic.check size={13} style={{ color: '#fff' }}/>}
            </div>
            Recorrente (fixo)
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 22 }}>
          {onDelete
            ? <button className="btn btn-ghost" onClick={onDelete} style={{ color: 'var(--negative)' }}><Ic.trash size={15}/>Excluir</button>
            : <span style={{ flex: 1 }}/>}
          <span style={{ flex: 1 }}/>
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn" disabled={!valid} onClick={() => onSave({ ...f })} style={{ opacity: valid ? 1 : 0.5 }}>
            <Ic.check size={16}/>{modal.mode === 'new' ? 'Salvar' : 'Atualizar'}
          </button>
        </div>
      </GlassCard>
    </div>
  );
}

Object.assign(window, { Financeiro, Legend, TransactionModal });
