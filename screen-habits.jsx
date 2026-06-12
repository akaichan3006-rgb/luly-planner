// screen-habits.jsx
function Habitos() {
  const store = useHabitStore();
  const habitos = store.getAll();
  const [modal, setModal] = useS(null); // null | {mode:'new'|'edit', habit}

  const dias = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];
  const concluidos = habitos.filter(h => (h.hoje||0) >= (h.meta||1)).length;
  const melhorSeq = habitos.length > 0 ? Math.max(...habitos.map(h => h.melhor||0)) : 0;
  const seqAtiva = habitos.length > 0 ? Math.max(...habitos.map(h => h.seq||0)) : 0;

  // 5-week progress calendar (illustrative pattern based on semana data)
  const calData = habitos.length > 0
    ? Array.from({ length: 35 }, (_, i) => (i * 7 + 3) % 9 > 2 ? 1 : 0)
    : Array(35).fill(0);

  const openNew = () => setModal({ mode: 'new', habit: { nome: '', icon: 'flame', cor: '#9E4A69', meta: 1, unidade: 'vez' } });
  const openEdit = (h) => setModal({ mode: 'edit', habit: h });
  const save = (data) => {
    if (modal.mode === 'new') store.add(data);
    else store.update(modal.habit.id, data);
    setModal(null);
  };
  const del = () => { store.remove(modal.habit.id); setModal(null); };

  return (
    <div className="screen">
      <PageHeader title="Controle de Hábitos" sub={habitos.length > 0 ? 'Pequenos passos, grandes sequências' : 'Crie hábitos e acompanhe sua consistência.'}>
        <button className="btn" onClick={openNew}><Ic.plus size={16}/>Novo hábito</button>
      </PageHeader>

      {habitos.length === 0 ? (
        <GlassCard style={{ padding: 60, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 14 }}>🔥</div>
          <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 8 }}>Nenhum hábito ainda</div>
          <div className="faint" style={{ fontSize: 14, marginBottom: 24 }}>Comece a construir sua rotina criando seu primeiro hábito.</div>
          <button className="btn" onClick={openNew} style={{ margin: '0 auto' }}><Ic.plus size={16}/>Criar meu primeiro hábito</button>
        </GlassCard>
      ) : (
        <React.Fragment>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 16 }}>
            <StatCard icon="check" label="Concluídos hoje" value={`${concluidos} / ${habitos.length}`} color="#4f9d7e" />
            <StatCard icon="flame" label="Sequência ativa" value={`${seqAtiva} dias`} color="var(--primary)" />
            <StatCard icon="sparkle" label="Melhor sequência" value={`${melhorSeq} dias`} color="#d29a52" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16 }}>
            {/* habit list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {habitos.map((h) => {
                const done = (h.hoje||0) >= (h.meta||1);
                const pct = Math.min(100, Math.round(((h.hoje||0) / (h.meta||1)) * 100));
                return (
                  <GlassCard key={h.id} style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 16 }}>
                    <button onClick={() => store.markToday(h.id)} title="Marcar hoje" style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}>
                      <Ring pct={pct} size={56} thickness={6} color={h.cor}>
                        {done ? <Ic.check size={22} style={{ color: h.cor }}/> : (Ic[h.icon] ? Ic[h.icon]({ size: 20, style: { color: h.cor } }) : null)}
                      </Ring>
                    </button>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontWeight: 700, fontSize: 15.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.nome}</span>
                        {(h.seq||0) > 0 && (
                          <span className="chip" style={{ flexShrink: 0, color: 'var(--warn)', borderColor: 'transparent', background: 'rgba(210,154,82,0.13)' }}>
                            <Ic.flame size={12}/>{h.seq} dias
                          </span>
                        )}
                      </div>
                      <div className="faint" style={{ fontSize: 12.5, marginTop: 3 }}>{h.hoje||0}/{h.meta} {h.unidade} · melhor {h.melhor||0} dias</div>
                      <div style={{ display: 'flex', gap: 7, marginTop: 10 }}>
                        {(h.semana||[0,0,0,0,0,0,0]).map((v, i) => (
                          <div key={i} title={dias[i]} style={{ width: 26, height: 26, borderRadius: 8, display: 'grid', placeItems: 'center',
                            fontSize: 10.5, fontWeight: 700,
                            background: v ? h.cor : 'var(--chip-bg)', color: v ? '#fff' : 'var(--ink-faint)',
                            border: `2px solid ${v ? 'transparent' : 'transparent'}` }}>
                            {v ? <Ic.check size={13}/> : dias[i]}
                          </div>
                        ))}
                      </div>
                    </div>
                    <button className="icon-btn" style={{ width: 30, height: 30, flexShrink: 0 }} onClick={() => openEdit(h)} title="Editar"><Ic.edit size={14}/></button>
                  </GlassCard>
                );
              })}
            </div>

            {/* right column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <GlassCard style={{ padding: 22 }}>
                <CardTitle icon="calMonth" title="Calendário de progresso" />
                <div className="faint" style={{ fontSize: 12.5, marginTop: 4 }}>Dias com todos os hábitos concluídos</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginTop: 16 }}>
                  {dias.map((d, i) => <div key={i} className="faint" style={{ textAlign: 'center', fontSize: 10.5, fontWeight: 700 }}>{d}</div>)}
                  {calData.map((v, i) => (
                    <div key={i} style={{ aspectRatio: '1', borderRadius: 8,
                      background: v ? `color-mix(in oklab, var(--primary) ${40 + (i % 3) * 25}%, transparent)` : 'var(--chip-bg)' }}/>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
                  <span className="faint" style={{ fontSize: 11 }}>menos</span>
                  {[0.2, 0.45, 0.7, 1].map((o, i) => <span key={i} style={{ width: 13, height: 13, borderRadius: 4, background: `color-mix(in oklab, var(--primary) ${o*100}%, transparent)` }}/>)}
                  <span className="faint" style={{ fontSize: 11 }}>mais</span>
                </div>
              </GlassCard>

              <GlassCard style={{ padding: 22 }}>
                <CardTitle icon="sparkle" title="Resumo da semana" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
                  {habitos.slice(0, 4).map(h => {
                    const semanaPct = Math.round(((h.semana||[]).filter(Boolean).length / 7) * 100);
                    return (
                      <div key={h.id}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
                            <span style={{ color: h.cor }}>{Ic[h.icon] ? Ic[h.icon]({ size: 15 }) : null}</span>{h.nome}
                          </span>
                          <span className="faint" style={{ fontWeight: 600 }}>{semanaPct}%</span>
                        </div>
                        <Bar pct={semanaPct} color={h.cor} />
                      </div>
                    );
                  })}
                </div>
              </GlassCard>
            </div>
          </div>
        </React.Fragment>
      )}

      {modal && <HabitModal modal={modal} onSave={save} onDelete={modal.mode === 'edit' ? del : null} onClose={() => setModal(null)} />}
    </div>
  );
}

const HABIT_ICONS = ['flame','droplet','dumbbell','book','leaf','salad','sparkle','heart','check','shield','clock','target'];
const HABIT_COLORS = ['#9E4A69','#7c93c4','#C67C96','#4f9d7e','#d29a52','#caa7d0','#b04a34','#243D6B','#A75597'];
const UNIDADES = ['vez','vezes','min','horas','copos','páginas','km','kg','sessão','dia'];

function HabitModal({ modal, onSave, onDelete, onClose }) {
  const [f, setF] = useS(() => ({ ...modal.habit }));
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const valid = (f.nome || '').trim().length > 0 && (f.meta||0) > 0;

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(40,20,30,0.4)',
      backdropFilter: 'blur(4px)', display: 'grid', placeItems: 'center', padding: 20 }}>
      <GlassCard onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 460, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h3 className="serif" style={{ margin: 0, fontSize: 24 }}>{modal.mode === 'new' ? 'Novo hábito' : 'Editar hábito'}</h3>
          <button className="icon-btn" onClick={onClose}><Ic.plus size={18} style={{ transform: 'rotate(45deg)' }}/></button>
        </div>

        <label className="ev-label">Nome do hábito</label>
        <div className="field" style={{ marginTop: 6 }}>
          <Ic.flame size={16} style={{ color: 'var(--ink-faint)' }}/>
          <input autoFocus value={f.nome} onChange={(e) => set('nome', e.target.value)} placeholder="Ex.: Beber 2L de água"/>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
          <div>
            <label className="ev-label">Meta diária</label>
            <div className="field" style={{ marginTop: 6, padding: '10px 12px' }}>
              <input type="number" min="1" value={f.meta||''} onChange={(e) => set('meta', parseInt(e.target.value)||1)}/>
            </div>
          </div>
          <div>
            <label className="ev-label">Unidade</label>
            <div className="field" style={{ marginTop: 6, padding: '10px 12px' }}>
              <select value={f.unidade||'vez'} onChange={(e) => set('unidade', e.target.value)} style={{ flex: 1, border: 'none', background: 'none', outline: 'none', fontFamily: 'var(--font-ui)', fontSize: 14, color: 'var(--ink)' }}>
                {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
        </div>

        <label className="ev-label" style={{ marginTop: 14 }}>Ícone</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 7 }}>
          {HABIT_ICONS.map((ic) => {
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
          {HABIT_COLORS.map((c) => (
            <button key={c} onClick={() => set('cor', c)} style={{ width: 32, height: 32, borderRadius: '50%', background: c, cursor: 'pointer',
              border: f.cor === c ? `3px solid var(--ink)` : '3px solid transparent', transition: 'all 0.15s' }}/>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 22 }}>
          {onDelete
            ? <button className="btn btn-ghost" onClick={onDelete} style={{ color: 'var(--negative)' }}><Ic.trash size={15}/>Excluir</button>
            : <span style={{ flex: 1 }}/>}
          <span style={{ flex: 1 }}/>
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn" disabled={!valid} onClick={() => onSave({ ...f, nome: f.nome.trim(), meta: parseInt(f.meta)||1 })} style={{ opacity: valid ? 1 : 0.5 }}>
            <Ic.check size={16}/>{modal.mode === 'new' ? 'Criar' : 'Salvar'}
          </button>
        </div>
      </GlassCard>
    </div>
  );
}

Object.assign(window, { Habitos, HabitModal });
