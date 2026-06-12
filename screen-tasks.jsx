// screen-tasks.jsx — Kanban with drag & drop, backed by TaskStore
function Tarefas() {
  const store = useTaskStore();
  const cols = store.getCols();
  const [drag, setDrag] = useS(null); // {id, from}
  const [over, setOver] = useS(null);
  const [modal, setModal] = useS(null); // null | {mode:'new'|'edit', col, task}

  const colMeta = {
    'A Fazer': { dot: '#C67C96' }, 'Em Andamento': { dot: '#d29a52' }, 'Concluído': { dot: '#4f9d7e' },
  };

  const onDrop = (toCol) => {
    if (!drag) return;
    if (drag.from !== toCol) store.move(drag.id, toCol);
    setDrag(null); setOver(null);
  };

  const openNew = (col) => setModal({ mode: 'new', col, task: { titulo: '', tag: 'Trabalho', prio: 'Média', prazo: '' } });
  const openEdit = (col, task) => setModal({ mode: 'edit', col, task });
  const save = (data) => {
    if (modal.mode === 'new') store.add(modal.col, data);
    else store.update(modal.task.id, data);
    setModal(null);
  };
  const del = () => { store.remove(modal.task.id); setModal(null); };

  const totalTasks = Object.values(cols).reduce((s, arr) => s + arr.length, 0);

  return (
    <div className="screen">
      <PageHeader title="Lista de Tarefas" sub="Quadro Kanban · arraste os cartões entre as colunas">
        <button className="btn-ghost btn"><Ic.filter size={16}/>Filtrar</button>
        <button className="btn" onClick={() => openNew('A Fazer')}><Ic.plus size={16}/>Nova tarefa</button>
      </PageHeader>

      {totalTasks === 0 && (
        <GlassCard style={{ padding: 40, textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>Nenhuma tarefa ainda</div>
          <div className="faint" style={{ fontSize: 14, marginBottom: 20 }}>Crie sua primeira tarefa para começar a organizar sua rotina.</div>
          <button className="btn" onClick={() => openNew('A Fazer')} style={{ margin: '0 auto' }}><Ic.plus size={16}/>Nova tarefa</button>
        </GlassCard>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, alignItems: 'start' }}>
        {store.COLS.map((col) => (
          <GlassCard key={col}
            onDragOver={(e) => { e.preventDefault(); setOver(col); }}
            onDragLeave={() => setOver(o => o === col ? null : o)}
            onDrop={() => onDrop(col)}
            style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12, minHeight: 200,
              outline: over === col ? '2px dashed color-mix(in oklab, var(--primary) 55%, transparent)' : '2px dashed transparent',
              outlineOffset: -4, transition: 'outline-color 0.15s' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontWeight: 700, fontSize: 15 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: colMeta[col].dot }}/>{col}
                <span className="chip" style={{ padding: '1px 9px' }}>{(cols[col]||[]).length}</span>
              </div>
              <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={() => openNew(col)}><Ic.plus size={15}/></button>
            </div>

            {(cols[col]||[]).map((t) => (
              <div key={t.id} draggable
                onDragStart={() => setDrag({ id: t.id, from: col })}
                onDragEnd={() => { setDrag(null); setOver(null); }}
                onClick={() => openEdit(col, t)}
                className="glass-soft"
                style={{ padding: 14, cursor: 'grab', opacity: drag && drag.id === t.id ? 0.4 : 1,
                  display: 'flex', flexDirection: 'column', gap: 10, transition: 'opacity 0.15s, transform 0.15s' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: prioColor[t.prio] || '#999', marginTop: 6, flexShrink: 0 }}/>
                  <div style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.3, textDecoration: col === 'Concluído' ? 'line-through' : 'none', opacity: col === 'Concluído' ? 0.6 : 1 }}>{t.titulo}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                  {t.tag && <span className="chip" style={{ color: catColors[t.tag] || 'var(--ink-soft)', background: `color-mix(in oklab, ${catColors[t.tag] || '#999'} 13%, transparent)`, borderColor: 'transparent' }}>{t.tag}</span>}
                  {t.prio && <span className="chip" style={{ color: prioColor[t.prio], borderColor: 'transparent', background: `color-mix(in oklab, ${prioColor[t.prio]} 13%, transparent)` }}>{t.prio}</span>}
                  <span style={{ flex: 1 }}/>
                  {t.prazo && <span className="faint" style={{ fontSize: 11.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}><Ic.clock size={12}/>{t.prazo}</span>}
                </div>
              </div>
            ))}
            {(cols[col]||[]).length === 0 && (
              <div className="faint" style={{ textAlign: 'center', padding: '24px 0', fontSize: 13, border: '1.5px dashed var(--line-strong)', borderRadius: 12 }}>Solte aqui</div>
            )}
          </GlassCard>
        ))}
      </div>

      {modal && <TaskModal modal={modal} onSave={save} onDelete={modal.mode === 'edit' ? del : null} onClose={() => setModal(null)} />}
    </div>
  );
}

function TaskModal({ modal, onSave, onDelete, onClose }) {
  const [f, setF] = useS(() => ({ ...modal.task }));
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const valid = (f.titulo || '').trim().length > 0;

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(40,20,30,0.4)',
      backdropFilter: 'blur(4px)', display: 'grid', placeItems: 'center', padding: 20 }}>
      <GlassCard onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 460, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h3 className="serif" style={{ margin: 0, fontSize: 24 }}>{modal.mode === 'new' ? 'Nova tarefa' : 'Editar tarefa'}</h3>
          <button className="icon-btn" onClick={onClose}><Ic.plus size={18} style={{ transform: 'rotate(45deg)' }}/></button>
        </div>

        <label className="ev-label">Título</label>
        <div className="field" style={{ marginTop: 6 }}>
          <Ic.kanban size={16} style={{ color: 'var(--ink-faint)' }}/>
          <input autoFocus value={f.titulo} onChange={(e) => set('titulo', e.target.value)} placeholder="Descreva a tarefa"/>
        </div>

        <label className="ev-label" style={{ marginTop: 14 }}>Categoria</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 7 }}>
          {TASK_TAGS.map((tag) => {
            const on = f.tag === tag;
            return (
              <button key={tag} onClick={() => set('tag', tag)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 11px', borderRadius: 999,
                cursor: 'pointer', fontFamily: 'var(--font-ui)', fontSize: 12.5, fontWeight: 600, transition: 'all 0.15s',
                border: '1px solid ' + (on ? 'transparent' : 'var(--line)'),
                background: on ? `color-mix(in oklab, ${catColors[tag]} 20%, transparent)` : 'transparent',
                color: on ? 'var(--ink)' : 'var(--ink-soft)' }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: catColors[tag] }}/>{tag}
              </button>
            );
          })}
        </div>

        <label className="ev-label" style={{ marginTop: 14 }}>Prioridade</label>
        <div style={{ display: 'flex', gap: 8, marginTop: 7 }}>
          {['Alta','Média','Baixa'].map((p) => {
            const on = f.prio === p;
            return (
              <button key={p} onClick={() => set('prio', p)} style={{ flex: 1, padding: '8px', borderRadius: 10, cursor: 'pointer',
                fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
                border: '1px solid ' + (on ? 'transparent' : 'var(--line)'),
                background: on ? `color-mix(in oklab, ${prioColor[p]} 18%, transparent)` : 'transparent',
                color: on ? prioColor[p] : 'var(--ink-soft)' }}>
                {p}
              </button>
            );
          })}
        </div>

        <label className="ev-label" style={{ marginTop: 14 }}>Prazo</label>
        <div className="field" style={{ marginTop: 6, padding: '10px 12px' }}>
          <input type="date" value={f.prazo || ''} onChange={(e) => set('prazo', e.target.value)} style={{ colorScheme: 'light', flex: 1, border: 'none', background: 'none', outline: 'none', fontFamily: 'var(--font-ui)', fontSize: 14, color: 'var(--ink)' }}/>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 22 }}>
          {onDelete
            ? <button className="btn btn-ghost" onClick={onDelete} style={{ color: 'var(--negative)' }}><Ic.trash size={15}/>Excluir</button>
            : <span style={{ flex: 1 }}/>}
          <span style={{ flex: 1 }}/>
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn" disabled={!valid} onClick={() => onSave({ ...f, titulo: f.titulo.trim() })} style={{ opacity: valid ? 1 : 0.5 }}>
            <Ic.check size={16}/>{modal.mode === 'new' ? 'Criar' : 'Salvar'}
          </button>
        </div>
      </GlassCard>
    </div>
  );
}

Object.assign(window, { Tarefas, TaskModal });
