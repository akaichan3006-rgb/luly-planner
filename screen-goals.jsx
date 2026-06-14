// screen-goals.jsx
const GOAL_WIDGETS = [
  { id: 'resumo', label: 'Resumo geral + destaques' },
  { id: 'lista',  label: 'Lista de metas' },
];

function Metas() {
  const store = useGoalStore();
  const metas = store.getAll();
  const [modal, setModal] = useS(null);
  const [addValModal, setAddValModal] = useS(null);
  const [editing, setEditing] = useS(false);
  const { visible, hidden, setVisible, moveUp, moveDown, reset } = useScreenLayout('metas', GOAL_WIDGETS);

  const totalAlvo = metas.reduce((s, m) => s + (m.alvo||0), 0);
  const totalAtual = metas.reduce((s, m) => s + (m.atual||0), 0);
  const pctGeral = totalAlvo > 0 ? Math.round((totalAtual / totalAlvo) * 100) : 0;

  const openNew = () => setModal({ mode: 'new', meta: { titulo: '', icon: 'target', alvo: '', cor: '#9E4A69', data: '' } });
  const openEdit = (m) => setModal({ mode: 'edit', meta: m });
  const save = (data) => {
    if (modal.mode === 'new') store.add(data);
    else store.update(modal.meta.id, data);
    setModal(null);
  };
  const del = () => { store.remove(modal.meta.id); setModal(null); };

  const wrap = (id, content) => {
    const idx = visible.findIndex(w => w.id === id);
    return (
      <ScreenWidget key={id} id={id} label={GOAL_WIDGETS.find(d => d.id === id)?.label}
        editing={editing} isFirst={idx === 0} isLast={idx === visible.length - 1}
        onHide={i => setVisible(i, false)} onMoveUp={moveUp} onMoveDown={moveDown}>
        {content}
      </ScreenWidget>
    );
  };

  return (
    <div className="screen">
      <PageHeader title="Metas e Objetivos" sub={metas.length > 0 ? `${metas.length} meta${metas.length === 1 ? '' : 's'} · continue no caminho certo 🌸` : 'Defina suas metas e acompanhe o progresso.'}>
        {metas.length > 0 && (
          <button className="btn-ghost btn" onClick={() => setEditing(e => !e)}
            style={editing ? { background: 'color-mix(in oklab, var(--primary) 14%, transparent)', borderColor: 'var(--primary)', color: 'var(--primary)' } : {}}>
            <Ic.edit size={16}/>{editing ? 'Editando…' : 'Personalizar'}
          </button>
        )}
        <button className="btn" onClick={openNew}><Ic.plus size={16}/>Nova meta</button>
      </PageHeader>

      {metas.length === 0 ? (
        <GlassCard style={{ padding: 60, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 14 }}>🎯</div>
          <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 8 }}>Nenhuma meta ainda</div>
          <div className="faint" style={{ fontSize: 14, marginBottom: 24 }}>Defina objetivos financeiros e acompanhe o progresso rumo a eles.</div>
          <button className="btn" onClick={openNew} style={{ margin: '0 auto' }}><Ic.plus size={16}/>Criar minha primeira meta</button>
        </GlassCard>
      ) : (
        <React.Fragment>
          <ScreenEditBanner editing={editing} hidden={hidden} defs={GOAL_WIDGETS}
            onToggle={(id, v) => setVisible(id, v)} onReset={reset} onDone={() => setEditing(false)} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {visible.map(w => {
              if (w.id === 'resumo') return wrap('resumo',
                <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16 }}>
                  <GlassCard style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
                    <Ring pct={pctGeral} size={150} thickness={13} color="var(--primary)">
                      <div style={{ textAlign: 'center' }}>
                        <div className="serif" style={{ fontSize: 40, lineHeight: 1 }}>{pctGeral}%</div>
                        <div className="faint" style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5 }}>PROGRESSO GERAL</div>
                      </div>
                    </Ring>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontWeight: 700, fontSize: 17 }}>{brl(totalAtual)}</div>
                      <div className="faint" style={{ fontSize: 13 }}>de {brl(totalAlvo)} em objetivos</div>
                    </div>
                  </GlassCard>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    {metas.slice(0, 2).map((m) => <MetaCard key={m.id} m={m} big onEdit={() => openEdit(m)} onAddValue={() => setAddValModal(m)} />)}
                  </div>
                </div>
              );
              if (w.id === 'lista') return wrap('lista',
                metas.length > 2 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                    {metas.slice(2).map((m) => <MetaCard key={m.id} m={m} onEdit={() => openEdit(m)} onAddValue={() => setAddValModal(m)} />)}
                  </div>
                ) : (
                  <div className="faint" style={{ textAlign: 'center', padding: '20px 0', fontSize: 13 }}>
                    Crie mais de 2 metas para ver a lista completa aqui.
                  </div>
                )
              );
              return null;
            })}
          </div>
        </React.Fragment>
      )}

      {modal && <GoalModal modal={modal} onSave={save} onDelete={modal.mode === 'edit' ? del : null} onClose={() => setModal(null)} />}
      {addValModal && <AddValueModal meta={addValModal} onSave={(v) => { store.addValue(addValModal.id, v); setAddValModal(null); }} onClose={() => setAddValModal(null)} />}
    </div>
  );
}

function MetaCard({ m, big, onEdit, onAddValue }) {
  const pct = m.alvo > 0 ? Math.round(((m.atual||0) / m.alvo) * 100) : 0;
  const falta = (m.alvo||0) - (m.atual||0);
  return (
    <GlassCard style={{ padding: big ? 24 : 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ width: big ? 50 : 42, height: big ? 50 : 42, borderRadius: 14, display: 'grid', placeItems: 'center',
          background: `color-mix(in oklab, ${m.cor} 16%, transparent)`, color: m.cor }}>
          {Ic[m.icon] ? Ic[m.icon]({ size: big ? 26 : 22 }) : <Ic.target size={big ? 26 : 22}/>}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {m.data && <span className="chip" style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Ic.calMonth size={12}/>{m.data}</span>}
          <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={onEdit} title="Editar"><Ic.edit size={14}/></button>
        </div>
      </div>
      <div>
        <div style={{ fontWeight: 700, fontSize: big ? 19 : 15.5 }}>{m.titulo}</div>
        <div className="faint" style={{ fontSize: 12.5, marginTop: 2 }}>faltam {brl(falta)}</div>
      </div>
      <div style={{ marginTop: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
          <span className="serif" style={{ fontSize: big ? 26 : 21, color: m.cor }}>{pct}%</span>
          <span className="faint" style={{ fontSize: 12.5, fontWeight: 600 }}>{brl(m.atual||0)} / {brl(m.alvo)}</span>
        </div>
        <Bar pct={pct} color={m.cor} />
      </div>
      {big && (
        <button className="btn-ghost btn" onClick={onAddValue} style={{ justifyContent: 'center', marginTop: 4 }}><Ic.plus size={15}/>Adicionar valor</button>
      )}
    </GlassCard>
  );
}

const GOAL_COLORS = ['#9E4A69','#7c93c4','#4f9d7e','#d29a52','#C67C96','#caa7d0','#b04a34','#243D6B'];

function GoalModal({ modal, onSave, onDelete, onClose }) {
  const [f, setF] = useS(() => ({ ...modal.meta }));
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const valid = (f.titulo || '').trim() && parseFloat(f.alvo) > 0;

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(40,20,30,0.4)',
      backdropFilter: 'blur(4px)', display: 'grid', placeItems: 'center', padding: 20 }}>
      <GlassCard onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h3 className="serif" style={{ margin: 0, fontSize: 24 }}>{modal.mode === 'new' ? 'Nova meta' : 'Editar meta'}</h3>
          <button className="icon-btn" onClick={onClose}><Ic.plus size={18} style={{ transform: 'rotate(45deg)' }}/></button>
        </div>

        <label className="ev-label">Título da meta</label>
        <div className="field" style={{ marginTop: 6 }}>
          <Ic.target size={16} style={{ color: 'var(--ink-faint)' }}/>
          <input autoFocus value={f.titulo} onChange={(e) => set('titulo', e.target.value)} placeholder="Ex.: Casamento dos sonhos"/>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
          <div>
            <label className="ev-label">Valor alvo (R$)</label>
            <div className="field" style={{ marginTop: 6, padding: '10px 12px' }}>
              <input type="number" min="0" step="100" value={f.alvo} onChange={(e) => set('alvo', parseFloat(e.target.value)||'')} placeholder="0,00"/>
            </div>
          </div>
          <div>
            <label className="ev-label">Prazo (mês/ano)</label>
            <div className="field" style={{ marginTop: 6, padding: '10px 12px' }}>
              <input value={f.data||''} onChange={(e) => set('data', e.target.value)} placeholder="Ex.: Dez 2026"/>
            </div>
          </div>
        </div>

        <label className="ev-label" style={{ marginTop: 14 }}>Ícone</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 7 }}>
          {ICON_LIST.map((ic) => {
            const on = f.icon === ic;
            return (
              <button key={ic} onClick={() => set('icon', ic)} style={{ width: 38, height: 38, borderRadius: 10, display: 'grid', placeItems: 'center',
                cursor: 'pointer', border: '1px solid ' + (on ? f.cor : 'var(--line)'),
                background: on ? `color-mix(in oklab, ${f.cor} 18%, transparent)` : 'transparent',
                color: on ? f.cor : 'var(--ink-soft)', transition: 'all 0.15s' }}>
                {Ic[ic] ? Ic[ic]({ size: 18 }) : null}
              </button>
            );
          })}
        </div>

        <label className="ev-label" style={{ marginTop: 14 }}>Cor</label>
        <div style={{ display: 'flex', gap: 8, marginTop: 7, flexWrap: 'wrap' }}>
          {GOAL_COLORS.map((c) => (
            <button key={c} onClick={() => set('cor', c)} style={{ width: 32, height: 32, borderRadius: '50%', background: c, cursor: 'pointer',
              border: f.cor === c ? `3px solid var(--ink)` : '3px solid transparent', outline: f.cor === c ? `2px solid ${c}` : 'none', transition: 'all 0.15s' }}/>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 22 }}>
          {onDelete
            ? <button className="btn btn-ghost" onClick={onDelete} style={{ color: 'var(--negative)' }}><Ic.trash size={15}/>Excluir</button>
            : <span style={{ flex: 1 }}/>}
          <span style={{ flex: 1 }}/>
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn" disabled={!valid} onClick={() => onSave({ ...f, alvo: parseFloat(f.alvo), titulo: f.titulo.trim() })} style={{ opacity: valid ? 1 : 0.5 }}>
            <Ic.check size={16}/>{modal.mode === 'new' ? 'Criar' : 'Salvar'}
          </button>
        </div>
      </GlassCard>
    </div>
  );
}

function AddValueModal({ meta, onSave, onClose }) {
  const [val, setVal] = useS('');
  const falta = (meta.alvo||0) - (meta.atual||0);
  const num = parseFloat(val) || 0;
  const valid = num > 0 && num <= falta;

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(40,20,30,0.4)',
      backdropFilter: 'blur(4px)', display: 'grid', placeItems: 'center', padding: 20 }}>
      <GlassCard onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 380, padding: 24, textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, margin: '0 auto 16px', display: 'grid', placeItems: 'center',
          background: `color-mix(in oklab, ${meta.cor} 18%, transparent)`, color: meta.cor }}>
          {Ic[meta.icon] ? Ic[meta.icon]({ size: 26 }) : <Ic.target size={26}/>}
        </div>
        <h3 className="serif" style={{ margin: '0 0 4px' }}>{meta.titulo}</h3>
        <div className="faint" style={{ fontSize: 13, marginBottom: 20 }}>Faltam {brl(falta)} para a meta</div>

        <label className="ev-label" style={{ textAlign: 'left', display: 'block' }}>Valor a adicionar (R$)</label>
        <div className="field" style={{ marginTop: 7 }}>
          <Ic.wallet size={16} style={{ color: 'var(--ink-faint)' }}/>
          <input autoFocus type="number" min="0.01" max={falta} step="0.01" value={val} onChange={(e) => setVal(e.target.value)} placeholder="0,00"/>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button className="btn btn-ghost" onClick={onClose} style={{ flex: 1, justifyContent: 'center' }}>Cancelar</button>
          <button className="btn" disabled={!valid} onClick={() => onSave(num)} style={{ flex: 2, justifyContent: 'center', opacity: valid ? 1 : 0.5 }}>
            <Ic.check size={16}/>Confirmar
          </button>
        </div>
      </GlassCard>
    </div>
  );
}

Object.assign(window, { Metas, MetaCard, GoalModal, AddValueModal });
