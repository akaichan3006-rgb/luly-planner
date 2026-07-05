// screen-contas.jsx — Contas Programadas
const { useState: useS, useEffect: useE, useMemo: useM } = React;

const CAT_CONTAS = ['Moradia','Assinaturas','Saúde','Educação','Transporte','Alimentação','Pets','Academia','Seguros','Lazer','Outros'];

const STATUS_COLOR = { pago: 'var(--positive)', pendente: 'var(--warn)', atrasado: 'var(--negative)' };
const STATUS_LABEL = { pago: 'Pago', pendente: 'Pendente', atrasado: 'Atrasado' };

function mesLabel(mesRef) {
  const d = new Date(mesRef + '-01T12:00');
  return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

// ── ContaModal ────────────────────────────────────────────────────────────────
function ContaModal({ conta, onSave, onDelete, onClose }) {
  const isEdit = !!conta;
  const [f, setF] = useS(isEdit ? { ...conta } : {
    desc: '', valor: '', dia: '', categoria: CAT_CONTAS[0], recorrente: true, ativa: true,
  });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const valid = (f.desc||'').trim() && parseFloat(f.valor) > 0 && parseInt(f.dia) >= 1 && parseInt(f.dia) <= 31;

  return (
    <ModalShell title={isEdit ? 'Editar conta' : 'Nova conta programada'} onClose={onClose}>
      {/* Descrição */}
      <label className="ev-label">Descrição</label>
      <div className="field" style={{ marginTop: 6 }}>
        <Ic.receipt size={16} style={{ color: 'var(--ink-faint)' }}/>
        <input autoFocus value={f.desc||''} onChange={e => set('desc', e.target.value)} placeholder="Ex.: Academia, Aluguel, Netflix…"/>
      </div>

      {/* Valor + Dia */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
        <div>
          <label className="ev-label">Valor (R$)</label>
          <div className="field" style={{ marginTop: 6, padding: '10px 14px' }}>
            <input type="number" min="0" step="0.01" value={f.valor||''} onChange={e => set('valor', e.target.value)}
              placeholder="0,00"
              style={{ flex:1, border:'none', background:'none', outline:'none', fontFamily:'var(--font-ui)', fontSize:15, fontWeight:700, color:'var(--ink)' }}/>
          </div>
        </div>
        <div>
          <label className="ev-label">Dia do vencimento</label>
          <div className="field" style={{ marginTop: 6, padding: '10px 14px' }}>
            <input type="number" min="1" max="31" value={f.dia||''} onChange={e => set('dia', e.target.value)}
              placeholder="Ex.: 17"
              style={{ flex:1, border:'none', background:'none', outline:'none', fontFamily:'var(--font-ui)', fontSize:15, fontWeight:700, color:'var(--ink)' }}/>
          </div>
        </div>
      </div>

      {/* Categoria */}
      <label className="ev-label" style={{ marginTop: 14 }}>Categoria</label>
      <div className="cat-scroll" style={{ marginTop: 7 }}>
        {CAT_CONTAS.map(cat => {
          const on = f.categoria === cat;
          const cor = (window.CustomCategoryStore && window.CustomCategoryStore.resolveColor(cat)) || 'var(--primary)';
          return (
            <button key={cat} onClick={() => set('categoria', cat)}
              style={{ padding: '6px 12px', borderRadius: 999, cursor: 'pointer', fontFamily: 'var(--font-ui)',
                fontSize: 12.5, fontWeight: 600, transition: 'all 0.15s',
                border: `1px solid ${on ? cor : 'var(--line)'}`,
                background: on ? `color-mix(in oklab, ${cor} 16%, transparent)` : 'transparent',
                color: on ? 'var(--ink)' : 'var(--ink-soft)' }}>
              {cat}
            </button>
          );
        })}
      </div>

      {/* Recorrente toggle */}
      <button onClick={() => set('recorrente', !f.recorrente)}
        style={{ display: 'flex', alignItems: 'center', gap: 8, border: 'none', background: 'none',
          cursor: 'pointer', fontFamily: 'var(--font-ui)', fontSize: 13.5, color: 'var(--ink)', padding: '14px 0 0' }}>
        <div style={{ width: 20, height: 20, borderRadius: 6,
          border: `2px solid ${f.recorrente ? 'var(--primary)' : 'var(--line-strong)'}`,
          display: 'grid', placeItems: 'center', background: f.recorrente ? 'var(--primary)' : 'transparent' }}>
          {f.recorrente && <Ic.check size={13} style={{ color: '#fff' }}/>}
        </div>
        Recorrente (repete todo mês)
      </button>
      <p className="faint" style={{ fontSize: 11.5, margin: '4px 0 0 28px' }}>
        {f.recorrente ? 'Aparece em todos os meses automaticamente.' : 'Aparece apenas no mês selecionado.'}
      </p>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 22 }}>
        {onDelete && (
          <button className="btn btn-ghost" onClick={onDelete} style={{ color: 'var(--negative)' }}>
            <Ic.trash size={15}/>Excluir
          </button>
        )}
        <span style={{ flex: 1 }}/>
        <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button className="btn" disabled={!valid} onClick={() => onSave({ ...f, valor: parseFloat(f.valor), dia: parseInt(f.dia) })}
          style={{ opacity: valid ? 1 : 0.5 }}>
          <Ic.check size={16}/>{isEdit ? 'Salvar' : 'Criar'}
        </button>
      </div>
    </ModalShell>
  );
}

// ── ContaCard ────────────────────────────────────────────────────────────────
function ContaCard({ conta, mesRef, onPagar, onDesfazer, onEdit }) {
  const cor    = STATUS_COLOR[conta.status] || STATUS_COLOR.pendente;
  const label  = STATUS_LABEL[conta.status] || 'Pendente';
  const isPago = conta.status === 'pago';
  const venc   = conta.vencDate
    ? new Date(conta.vencDate + 'T12:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
    : `dia ${conta.dia}`;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderRadius: 16,
      background: isPago ? 'color-mix(in oklab, var(--positive) 5%, var(--glass-bg))' : 'var(--glass-bg)',
      border: `1.5px solid ${isPago ? 'color-mix(in oklab, var(--positive) 20%, transparent)' : 'var(--line)'}`,
      opacity: isPago ? 0.75 : 1, transition: 'all 0.2s' }}>

      {/* Status dot */}
      <div style={{ width: 10, height: 10, borderRadius: '50%', background: cor, flexShrink: 0 }}/>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)',
          textDecoration: isPago ? 'line-through' : 'none', opacity: isPago ? 0.7 : 1 }}>
          {conta.desc}
        </div>
        <div className="faint" style={{ fontSize: 12, marginTop: 2, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span>{conta.categoria}</span>
          <span>·</span>
          <span>Vence {venc}</span>
          {conta.recorrente && <span style={{ color: 'var(--primary)', fontWeight: 600 }}>↺ recorrente</span>}
        </div>
      </div>

      {/* Valor + status */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--ink)' }}>{brl(conta.valor)}</div>
        <div style={{ fontSize: 11, fontWeight: 700, color: cor, marginTop: 2 }}>{label}</div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        {!isPago ? (
          <button onClick={() => onPagar(conta.id)} title="Marcar como pago"
            style={{ padding: '7px 13px', borderRadius: 999, cursor: 'pointer', fontFamily: 'var(--font-ui)',
              fontSize: 12.5, fontWeight: 700, border: '1.5px solid var(--positive)',
              background: 'color-mix(in oklab, var(--positive) 10%, transparent)', color: 'var(--positive)',
              display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'color-mix(in oklab, var(--positive) 20%, transparent)'}
            onMouseLeave={e => e.currentTarget.style.background = 'color-mix(in oklab, var(--positive) 10%, transparent)'}>
            <Ic.check size={13}/>Pagar
          </button>
        ) : (
          <button onClick={() => onDesfazer(conta.id)} title="Desfazer pagamento"
            style={{ padding: '7px 13px', borderRadius: 999, cursor: 'pointer', fontFamily: 'var(--font-ui)',
              fontSize: 12, fontWeight: 600, border: '1px solid var(--line)',
              background: 'transparent', color: 'var(--ink-soft)', transition: 'all 0.15s' }}>
            Desfazer
          </button>
        )}
        <button onClick={() => onEdit(conta)} title="Editar"
          style={{ width: 34, height: 34, borderRadius: 999, cursor: 'pointer', border: '1px solid var(--line)',
            background: 'transparent', display: 'grid', placeItems: 'center', color: 'var(--ink-faint)', transition: 'all 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.background = 'color-mix(in oklab, var(--primary) 8%, transparent)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          <Ic.edit size={14}/>
        </button>
      </div>
    </div>
  );
}

// ── ContasProgramadas (main screen) ──────────────────────────────────────────
function ContasProgramadas() {
  const store = useContasProgramadasStore();
  const hoje  = new Date();
  const mesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth()+1).padStart(2,'0')}`;

  const [mesRef, setMesRef] = useS(mesAtual);
  const [modal,  setModal]  = useS(null); // null | { mode: 'new' } | { mode: 'edit', conta }

  const contas  = store.getForMes(mesRef);
  const pagas   = contas.filter(c => c.status === 'pago');
  const pendentes = contas.filter(c => c.status === 'pendente' || c.status === 'atrasado');
  const totalMes  = contas.reduce((s, c) => s + (c.valor || 0), 0);
  const totalPago = pagas.reduce((s, c) => s + (c.valor || 0), 0);
  const pct = totalMes > 0 ? Math.round((totalPago / totalMes) * 100) : 0;

  // Navigate months
  const addMes = (n) => {
    const d = new Date(mesRef + '-01T12:00');
    d.setMonth(d.getMonth() + n);
    setMesRef(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`);
  };

  const handleSave = (data) => {
    if (modal.mode === 'edit') {
      store.update(modal.conta.id, data);
    } else {
      store.add(data);
    }
    setModal(null);
  };
  const handleDelete = () => {
    store.remove(modal.conta.id);
    setModal(null);
  };

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 20px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: 'var(--ink)' }}>Contas Programadas</h1>
          <p className="faint" style={{ margin: '4px 0 0', fontSize: 13.5 }}>Gerencie suas contas recorrentes e agendadas</p>
        </div>
        <button className="btn" onClick={() => setModal({ mode: 'new' })}
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Ic.plus size={16}/>Nova conta
        </button>
      </div>

      {/* Navegação de mês */}
      <GlassCard style={{ padding: '14px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
        <button onClick={() => addMes(-1)} style={{ width: 34, height: 34, borderRadius: '50%', border: '1px solid var(--line)', background: 'transparent', cursor: 'pointer', display: 'grid', placeItems: 'center', color: 'var(--ink)' }}>
          <Ic.chevL size={16}/>
        </button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--ink)', textTransform: 'capitalize' }}>
            {mesLabel(mesRef)}
          </span>
          {mesRef === mesAtual && (
            <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, color: 'var(--primary)',
              background: 'color-mix(in oklab, var(--primary) 12%, transparent)',
              padding: '2px 8px', borderRadius: 999 }}>Mês atual</span>
          )}
        </div>
        <button onClick={() => addMes(1)} style={{ width: 34, height: 34, borderRadius: '50%', border: '1px solid var(--line)', background: 'transparent', cursor: 'pointer', display: 'grid', placeItems: 'center', color: 'var(--ink)' }}>
          <Ic.chevR size={16}/>
        </button>
      </GlassCard>

      {/* Resumo */}
      {contas.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
          <GlassCard style={{ padding: '16px 18px' }}>
            <div className="faint" style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total do mês</div>
            <div style={{ fontWeight: 900, fontSize: 22, color: 'var(--ink)', marginTop: 4 }}>{brl(totalMes)}</div>
            <div className="faint" style={{ fontSize: 12, marginTop: 3 }}>{contas.length} conta{contas.length !== 1 ? 's' : ''}</div>
          </GlassCard>
          <GlassCard style={{ padding: '16px 18px' }}>
            <div className="faint" style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Pago</div>
            <div style={{ fontWeight: 900, fontSize: 22, color: 'var(--positive)', marginTop: 4 }}>{brl(totalPago)}</div>
            <div className="faint" style={{ fontSize: 12, marginTop: 3 }}>{pagas.length} de {contas.length}</div>
          </GlassCard>
          <GlassCard style={{ padding: '16px 18px' }}>
            <div className="faint" style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Progresso</div>
            <div style={{ fontWeight: 900, fontSize: 22, color: pct === 100 ? 'var(--positive)' : 'var(--warn)', marginTop: 4 }}>{pct}%</div>
            <div style={{ marginTop: 8, height: 6, borderRadius: 999, background: 'var(--line)', overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', borderRadius: 999,
                background: pct === 100 ? 'var(--positive)' : 'var(--primary)', transition: 'width 0.4s var(--ease)' }}/>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Pendentes / Atrasadas */}
      {pendentes.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 800, color: 'var(--ink)',
            display: 'flex', alignItems: 'center', gap: 8 }}>
            <Ic.clock size={16} style={{ color: 'var(--warn)' }}/>
            Pendentes
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--warn)',
              background: 'color-mix(in oklab, var(--warn) 12%, transparent)',
              padding: '2px 8px', borderRadius: 999 }}>{pendentes.length}</span>
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pendentes.sort((a,b) => (a.dia||1) - (b.dia||1)).map(c => (
              <ContaCard key={c.id} conta={c} mesRef={mesRef}
                onPagar={id => store.marcarPago(id, mesRef)}
                onDesfazer={id => store.marcarPendente(id, mesRef)}
                onEdit={conta => setModal({ mode: 'edit', conta })}/>
            ))}
          </div>
        </div>
      )}

      {/* Pagas */}
      {pagas.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 800, color: 'var(--ink)',
            display: 'flex', alignItems: 'center', gap: 8 }}>
            <Ic.check size={16} style={{ color: 'var(--positive)' }}/>
            Pagas
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--positive)',
              background: 'color-mix(in oklab, var(--positive) 12%, transparent)',
              padding: '2px 8px', borderRadius: 999 }}>{pagas.length}</span>
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pagas.sort((a,b) => (a.dia||1) - (b.dia||1)).map(c => (
              <ContaCard key={c.id} conta={c} mesRef={mesRef}
                onPagar={id => store.marcarPago(id, mesRef)}
                onDesfazer={id => store.marcarPendente(id, mesRef)}
                onEdit={conta => setModal({ mode: 'edit', conta })}/>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {contas.length === 0 && (
        <GlassCard style={{ padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
          <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--ink)', marginBottom: 8 }}>
            Nenhuma conta programada
          </div>
          <p className="faint" style={{ fontSize: 13.5, maxWidth: 320, margin: '0 auto 20px' }}>
            Adicione suas contas recorrentes como academia, aluguel, assinaturas e veja tudo organizado por mês.
          </p>
          <button className="btn" onClick={() => setModal({ mode: 'new' })}>
            <Ic.plus size={16}/>Adicionar primeira conta
          </button>
        </GlassCard>
      )}

      {/* Modal */}
      {modal && (
        <ContaModal
          conta={modal.mode === 'edit' ? modal.conta : null}
          onSave={handleSave}
          onDelete={modal.mode === 'edit' ? handleDelete : undefined}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

window.ContasProgramadas = ContasProgramadas;
