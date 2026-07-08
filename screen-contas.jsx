// screen-contas.jsx — Agenda financeira (Contas + Faturas)
const { useState: useS, useEffect: useE, useMemo: useM } = React;

const CAT_CONTAS = ['Moradia','Assinaturas','Saúde','Educação','Transporte','Alimentação','Pets','Academia','Seguros','Lazer','Outros'];
const FAT_STATUS_COLOR = { aberta:'var(--warn)', fechada:'var(--warn)', pago:'var(--positive)', atrasada:'var(--negative)' };
const FAT_STATUS_LABEL = { aberta:'Aberta', fechada:'Fechada', pago:'Paga', atrasada:'Atrasada' };
const CONTA_STATUS_COLOR = { pago:'var(--positive)', pendente:'var(--warn)', atrasado:'var(--negative)' };

function _mesLabel(mesRef, opts = {}) {
  const d = new Date(mesRef + '-01T12:00');
  return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', ...opts });
}
function _addMes(mesRef, n) {
  const d = new Date(mesRef + '-01T12:00');
  d.setMonth(d.getMonth() + n);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
}
function _mesAtualStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
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
      <label className="ev-label">Descrição</label>
      <div className="field" style={{ marginTop:6 }}>
        <Ic.receipt size={16} style={{ color:'var(--ink-faint)' }}/>
        <input autoFocus value={f.desc||''} onChange={e => set('desc', e.target.value)}
          placeholder="Ex.: Academia, Aluguel, Netflix…"/>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginTop:14 }}>
        <div>
          <label className="ev-label">Valor (R$)</label>
          <div className="field" style={{ marginTop:6, padding:'10px 14px' }}>
            <input type="number" min="0" step="0.01" value={f.valor||''} onChange={e => set('valor', e.target.value)}
              placeholder="0,00"
              style={{ flex:1, border:'none', background:'none', outline:'none', fontFamily:'var(--font-ui)', fontSize:15, fontWeight:700, color:'var(--ink)' }}/>
          </div>
        </div>
        <div>
          <label className="ev-label">Dia do vencimento</label>
          <div className="field" style={{ marginTop:6, padding:'10px 14px' }}>
            <input type="number" min="1" max="31" value={f.dia||''} onChange={e => set('dia', e.target.value)}
              placeholder="Ex.: 17"
              style={{ flex:1, border:'none', background:'none', outline:'none', fontFamily:'var(--font-ui)', fontSize:15, fontWeight:700, color:'var(--ink)' }}/>
          </div>
        </div>
      </div>

      <label className="ev-label" style={{ marginTop:14 }}>Categoria</label>
      <div className="cat-scroll" style={{ marginTop:7 }}>
        {CAT_CONTAS.map(cat => {
          const on = f.categoria === cat;
          const cor = (window.CustomCategoryStore && window.CustomCategoryStore.resolveColor(cat)) || 'var(--primary)';
          return (
            <button key={cat} onClick={() => set('categoria', cat)}
              style={{ padding:'6px 12px', borderRadius:999, cursor:'pointer', fontFamily:'var(--font-ui)',
                fontSize:12.5, fontWeight:600, transition:'all 0.15s',
                border:`1px solid ${on ? cor : 'var(--line)'}`,
                background: on ? `color-mix(in oklab,${cor} 16%,transparent)` : 'transparent',
                color: on ? 'var(--ink)' : 'var(--ink-soft)' }}>
              {cat}
            </button>
          );
        })}
      </div>

      <button onClick={() => set('recorrente', !f.recorrente)}
        style={{ display:'flex', alignItems:'center', gap:8, border:'none', background:'none',
          cursor:'pointer', fontFamily:'var(--font-ui)', fontSize:13.5, color:'var(--ink)', padding:'14px 0 0' }}>
        <div style={{ width:20, height:20, borderRadius:6, display:'grid', placeItems:'center',
          border:`2px solid ${f.recorrente ? 'var(--primary)' : 'var(--line-strong)'}`,
          background: f.recorrente ? 'var(--primary)' : 'transparent' }}>
          {f.recorrente && <Ic.check size={13} style={{ color:'#fff' }}/>}
        </div>
        Recorrente (repete todo mês)
      </button>

      <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:22 }}>
        {onDelete && (
          <button className="btn btn-ghost" onClick={onDelete} style={{ color:'var(--negative)' }}>
            <Ic.trash size={15}/>Excluir
          </button>
        )}
        <span style={{ flex:1 }}/>
        <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button className="btn" disabled={!valid}
          onClick={() => onSave({ ...f, valor:parseFloat(f.valor), dia:parseInt(f.dia) })}
          style={{ opacity: valid ? 1 : 0.5 }}>
          <Ic.check size={16}/>{isEdit ? 'Salvar' : 'Criar'}
        </button>
      </div>
    </ModalShell>
  );
}

// ── FaturaDetailPanel ─────────────────────────────────────────────────────────
function FaturaDetailPanel({ fatura, onClose, onPagar, onDesfazer }) {
  const card    = (window.CardStore && window.CardStore.getById(fatura.card_id)) || { name:'Cartão', color:'#97798a' };
  const compras = window.CompraStore ? window.CompraStore.getByFatura(fatura.card_id, fatura.mes_ref) : [];
  const status  = fatura.status || 'aberta';
  const cor     = FAT_STATUS_COLOR[status] || 'var(--warn)';
  const isPago  = status === 'pago';

  const total = compras.reduce((s,c) => s+(c.valor||0), 0);

  return (
    <ModalShell title="Detalhes da Fatura" onClose={onClose}>
      {/* Cabeçalho do cartão */}
      <div style={{ padding:'16px 18px', borderRadius:16, marginBottom:18,
        background:`color-mix(in oklab,${card.color} 10%,transparent)`,
        border:`1.5px solid color-mix(in oklab,${card.color} 25%,transparent)` }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:10, height:10, borderRadius:'50%', background:card.color }}/>
            <span style={{ fontWeight:800, fontSize:16, color:'var(--ink)' }}>{card.name}</span>
          </div>
          <span style={{ fontSize:12, fontWeight:700, color:cor,
            background:`color-mix(in oklab,${cor} 12%,transparent)`,
            padding:'3px 10px', borderRadius:999 }}>
            {FAT_STATUS_LABEL[status] || 'Aberta'}
          </span>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <div>
            <div className="faint" style={{ fontSize:11, fontWeight:700, textTransform:'uppercase' }}>Mês da Fatura</div>
            <div style={{ fontWeight:700, fontSize:14, color:'var(--ink)', textTransform:'capitalize', marginTop:2 }}>
              {_mesLabel(fatura.mes_ref)}
            </div>
          </div>
          <div>
            <div className="faint" style={{ fontSize:11, fontWeight:700, textTransform:'uppercase' }}>Vencimento</div>
            <div style={{ fontWeight:700, fontSize:14, color:'var(--ink)', marginTop:2 }}>
              {fatura.venc_date
                ? new Date(fatura.venc_date+'T12:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'})
                : '—'}
            </div>
          </div>
        </div>
        <div style={{ marginTop:12, paddingTop:12, borderTop:`1px solid color-mix(in oklab,${card.color} 20%,transparent)`,
          display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span className="faint" style={{ fontSize:13, fontWeight:600 }}>Total da fatura</span>
          <span style={{ fontWeight:900, fontSize:20, color:'var(--ink)' }}>{brl(total)}</span>
        </div>
      </div>

      {/* Lista de compras */}
      <div style={{ fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--ink-faint)', marginBottom:10 }}>
        {compras.length} compra{compras.length !== 1 ? 's' : ''}
      </div>
      {compras.length === 0 ? (
        <div className="faint" style={{ textAlign:'center', padding:'20px 0', fontSize:13 }}>
          Nenhuma compra registrada nesta fatura.
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:8, maxHeight:340, overflowY:'auto', paddingRight:4 }}>
          {compras.sort((a,b) => (a.data_compra||'').localeCompare(b.data_compra||'')).map(c => (
            <div key={c.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', borderRadius:12,
              background:'var(--chip-bg)', border:'1px solid var(--line)' }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:700, fontSize:14, color:'var(--ink)' }}>{c.desc}</div>
                <div className="faint" style={{ fontSize:11.5, marginTop:2, display:'flex', gap:8 }}>
                  <span>{c.cat}</span>
                  {c.data_compra && <span>· {new Date(c.data_compra+'T12:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'short'})}</span>}
                  {c.total_parcelas > 1 && (
                    <span style={{ color:'var(--primary)', fontWeight:700 }}>
                      {c.parcela_num}/{c.total_parcelas}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ fontWeight:800, fontSize:14, color:'var(--ink)', flexShrink:0 }}>{brl(c.valor)}</div>
            </div>
          ))}
        </div>
      )}

      {/* Rodapé com botões */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:20, paddingTop:16,
        borderTop:'1px solid var(--line)' }}>
        <div style={{ flex:1 }}>
          <div className="faint" style={{ fontSize:11, fontWeight:700, textTransform:'uppercase' }}>Total</div>
          <div style={{ fontWeight:900, fontSize:18, color:'var(--ink)' }}>{brl(total)}</div>
        </div>
        {!isPago ? (
          <button className="btn" onClick={() => { onPagar(fatura.id); onClose(); }}
            style={{ background:'var(--positive)', border:'none' }}>
            <Ic.check size={16}/>Pagar fatura
          </button>
        ) : (
          <button className="btn btn-ghost" onClick={() => { onDesfazer(fatura.id); onClose(); }}>
            Desfazer pagamento
          </button>
        )}
      </div>
    </ModalShell>
  );
}

// ── BillRow — linha de conta programada ──────────────────────────────────────
function BillRow({ conta, mesRef, onPagar, onDesfazer, onEdit }) {
  const isPago  = conta.status === 'pago';
  const cor     = CONTA_STATUS_COLOR[conta.status] || 'var(--warn)';
  const vencStr = conta.vencDate
    ? new Date(conta.vencDate+'T12:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'short'})
    : `dia ${conta.dia}`;

  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, padding:'13px 16px', borderRadius:14,
      background: isPago ? 'color-mix(in oklab,var(--positive) 5%,var(--glass-bg))' : 'var(--glass-bg)',
      border:`1.5px solid ${isPago ? 'color-mix(in oklab,var(--positive) 18%,transparent)' : 'var(--line)'}`,
      opacity: isPago ? 0.72 : 1, transition:'all 0.2s' }}>
      <div style={{ width:8, height:8, borderRadius:'50%', background:cor, flexShrink:0 }}/>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontWeight:700, fontSize:14, color:'var(--ink)',
          textDecoration: isPago ? 'line-through' : 'none' }}>
          {conta.desc}
        </div>
        <div className="faint" style={{ fontSize:12, marginTop:2, display:'flex', gap:6, flexWrap:'wrap' }}>
          <span>{conta.categoria}</span>
          <span>· vence {vencStr}</span>
          {conta.recorrente && <span style={{ color:'var(--primary)', fontWeight:600 }}>↺</span>}
        </div>
      </div>
      <div style={{ textAlign:'right', flexShrink:0 }}>
        <div style={{ fontWeight:800, fontSize:14 }}>{brl(conta.valor)}</div>
        <div style={{ fontSize:11, fontWeight:700, color:cor, marginTop:1 }}>
          {isPago ? 'Pago' : conta.status === 'atrasado' ? 'Atrasado' : 'Pendente'}
        </div>
      </div>
      <div style={{ display:'flex', gap:5, flexShrink:0 }}>
        {!isPago ? (
          <button onClick={() => onPagar(conta.id)}
            style={{ padding:'6px 12px', borderRadius:999, cursor:'pointer', fontFamily:'var(--font-ui)',
              fontSize:12, fontWeight:700, border:'1.5px solid var(--positive)',
              background:'color-mix(in oklab,var(--positive) 10%,transparent)', color:'var(--positive)',
              display:'flex', alignItems:'center', gap:4, transition:'all 0.15s' }}>
            <Ic.check size={13}/>Pagar
          </button>
        ) : (
          <button onClick={() => onDesfazer(conta.id)}
            style={{ padding:'6px 11px', borderRadius:999, cursor:'pointer', fontFamily:'var(--font-ui)',
              fontSize:11.5, fontWeight:600, border:'1px solid var(--line)',
              background:'transparent', color:'var(--ink-soft)' }}>
            Desfazer
          </button>
        )}
        <button onClick={() => onEdit(conta)}
          style={{ width:32, height:32, borderRadius:999, cursor:'pointer', border:'1px solid var(--line)',
            background:'transparent', display:'grid', placeItems:'center', color:'var(--ink-faint)' }}>
          <Ic.edit size={13}/>
        </button>
      </div>
    </div>
  );
}

// ── FaturaRow — linha de fatura do cartão ─────────────────────────────────────
function FaturaRow({ fatura, onClick }) {
  const card   = (window.CardStore && window.CardStore.getById(fatura.card_id)) || { name:'Cartão', color:'#97798a' };
  const status = fatura.status || 'aberta';
  const cor    = FAT_STATUS_COLOR[status] || 'var(--warn)';
  const isPago = status === 'pago';
  const compras = window.CompraStore ? window.CompraStore.getByFatura(fatura.card_id, fatura.mes_ref) : [];

  return (
    <div onClick={onClick} style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 18px', borderRadius:14,
      background: isPago ? 'color-mix(in oklab,var(--positive) 5%,var(--glass-bg))' : 'var(--glass-bg)',
      border:`1.5px solid ${isPago ? 'color-mix(in oklab,var(--positive) 18%,transparent)' : `color-mix(in oklab,${card.color} 30%,var(--line))`}`,
      cursor:'pointer', transition:'all 0.18s', opacity: isPago ? 0.75 : 1 }}
      onMouseEnter={e => !isPago && (e.currentTarget.style.background = `color-mix(in oklab,${card.color} 7%,var(--glass-bg))`)}
      onMouseLeave={e => e.currentTarget.style.background = isPago ? 'color-mix(in oklab,var(--positive) 5%,var(--glass-bg))' : 'var(--glass-bg)'}>

      {/* Ícone do cartão */}
      <div style={{ width:40, height:40, borderRadius:12, display:'grid', placeItems:'center', flexShrink:0,
        background:`color-mix(in oklab,${card.color} 15%,transparent)` }}>
        <Ic.wallet size={20} style={{ color:card.color }}/>
      </div>

      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontWeight:800, fontSize:15, color:'var(--ink)',
          textDecoration: isPago ? 'line-through' : 'none', opacity: isPago ? 0.7 : 1 }}>
          Fatura {card.name}
        </div>
        <div className="faint" style={{ fontSize:12, marginTop:2, display:'flex', gap:6, flexWrap:'wrap' }}>
          {fatura.venc_date && <span>Vence {new Date(fatura.venc_date+'T12:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'short'})}</span>}
          <span>· {compras.length} compra{compras.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      <div style={{ textAlign:'right', flexShrink:0 }}>
        <div style={{ fontWeight:900, fontSize:16, color:'var(--ink)' }}>{brl(fatura.valor_total||0)}</div>
        <div style={{ fontSize:11, fontWeight:700, color:cor, marginTop:2 }}>
          {FAT_STATUS_LABEL[status] || 'Aberta'}
        </div>
      </div>

      <Ic.chevR size={16} style={{ color:'var(--ink-faint)', flexShrink:0 }}/>
    </div>
  );
}

// ── MonthSection ──────────────────────────────────────────────────────────────
function MonthSection({ mesRef, contas, faturas, mesAtual, contasStore, onEditBill, onFaturaClick }) {
  const isPast    = mesRef < mesAtual;
  const isCurrent = mesRef === mesAtual;

  return (
    <div style={{ marginBottom:32 }}>
      {/* Cabeçalho do mês */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
        <div style={{ height:1, flex:1, background:'var(--line)' }}/>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontWeight:900, fontSize:15, color: isCurrent ? 'var(--primary)' : isPast ? 'var(--ink-faint)' : 'var(--ink)',
            textTransform:'capitalize' }}>
            {_mesLabel(mesRef, { month:'long', year:'numeric' })}
          </span>
          {isCurrent && (
            <span style={{ fontSize:10, fontWeight:700, color:'var(--primary)',
              background:'color-mix(in oklab,var(--primary) 12%,transparent)',
              padding:'2px 8px', borderRadius:999 }}>Agora</span>
          )}
          {isPast && (
            <span style={{ fontSize:10, fontWeight:700, color:'var(--negative)',
              background:'color-mix(in oklab,var(--negative) 10%,transparent)',
              padding:'2px 8px', borderRadius:999 }}>Passado</span>
          )}
        </div>
        <div style={{ height:1, flex:1, background:'var(--line)' }}/>
      </div>

      {/* Itens */}
      <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
        {contas.map(c => (
          <BillRow key={c.id} conta={c} mesRef={mesRef}
            onPagar={id => contasStore.marcarPago(id, mesRef)}
            onDesfazer={id => contasStore.marcarPendente(id, mesRef)}
            onEdit={onEditBill}/>
        ))}
        {faturas.map(f => (
          <FaturaRow key={f.id} fatura={f} onClick={() => onFaturaClick(f)}/>
        ))}
      </div>
    </div>
  );
}

// ── ContasProgramadas (tela principal) ───────────────────────────────────────
function ContasProgramadas() {
  const contasStore  = useContasProgramadasStore();
  const faturaStore  = useFaturaStore();
  const mesAtual     = _mesAtualStr();

  const [modal,       setModal]       = useS(null); // null | {mode:'new'|'edit', conta?}
  const [faturaDetalhe, setFaturaDetalhe] = useS(null); // fatura selecionada

  // Gera meses a exibir: meses com faturas atrasadas passadas + atual + 7 meses à frente
  const meses = useM(() => {
    const futuro = Array.from({ length: 8 }, (_, i) => _addMes(mesAtual, i));
    const todasFaturas = faturaStore.getAll();
    const passadas = todasFaturas
      .filter(f => f.mes_ref < mesAtual && f.status !== 'pago')
      .map(f => f.mes_ref);
    return [...new Set([...passadas, ...futuro])].sort();
  }, [faturaStore.getAll().length, mesAtual]);

  // Resumo geral
  const todasFaturas = faturaStore.getAll();
  const allContas    = contasStore.getAll();
  const totalPendFat = todasFaturas.filter(f => f.status !== 'pago' && f.mes_ref >= mesAtual)
    .reduce((s,f) => s+(f.valor_total||0), 0);
  const countPendFat = todasFaturas.filter(f => f.status !== 'pago' && f.mes_ref >= mesAtual).length;
  const totalPendCon = allContas.filter(c => c.ativa !== false && c.recorrente).length;

  const handleSaveBill = (data) => {
    if (modal.mode === 'edit') contasStore.update(modal.conta.id, data);
    else                       contasStore.add(data);
    setModal(null);
  };
  const handleDeleteBill = () => {
    contasStore.remove(modal.conta.id);
    setModal(null);
  };

  const hasSomething = meses.some(mes => {
    const c = contasStore.getForMes(mes);
    const f = todasFaturas.filter(fat => fat.mes_ref === mes);
    return c.length > 0 || f.length > 0;
  });

  return (
    <div style={{ maxWidth:860, margin:'0 auto', padding:'24px 20px' }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ margin:0, fontSize:26, fontWeight:900, color:'var(--ink)' }}>Agenda Financeira</h1>
          <p className="faint" style={{ margin:'4px 0 0', fontSize:13.5 }}>
            Faturas e contas organizadas por mês
          </p>
        </div>
        <button className="btn" onClick={() => setModal({ mode:'new' })}>
          <Ic.plus size={16}/>Nova conta
        </button>
      </div>

      {/* Resumo */}
      {hasSomething && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:28 }}>
          <GlassCard style={{ padding:'16px 18px' }}>
            <div className="faint" style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em' }}>Faturas abertas</div>
            <div style={{ fontWeight:900, fontSize:22, color:'#7c93c4', marginTop:4 }}>{brl(totalPendFat)}</div>
            <div className="faint" style={{ fontSize:12, marginTop:3 }}>{countPendFat} fatura{countPendFat !== 1 ? 's' : ''}</div>
          </GlassCard>
          <GlassCard style={{ padding:'16px 18px' }}>
            <div className="faint" style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em' }}>Contas fixas</div>
            <div style={{ fontWeight:900, fontSize:22, color:'var(--primary)', marginTop:4 }}>{totalPendCon}</div>
            <div className="faint" style={{ fontSize:12, marginTop:3 }}>recorrentes ativas</div>
          </GlassCard>
          <GlassCard style={{ padding:'16px 18px' }}>
            <div className="faint" style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em' }}>Faturas pagas</div>
            <div style={{ fontWeight:900, fontSize:22, color:'var(--positive)', marginTop:4 }}>
              {brl(faturaStore.getTotalPago())}
            </div>
            <div className="faint" style={{ fontSize:12, marginTop:3 }}>
              {todasFaturas.filter(f => f.status === 'pago').length} faturas quitadas
            </div>
          </GlassCard>
        </div>
      )}

      {/* Timeline */}
      {!hasSomething ? (
        <GlassCard style={{ padding:'48px 24px', textAlign:'center' }}>
          <div style={{ fontSize:40, marginBottom:12 }}>📅</div>
          <div style={{ fontWeight:800, fontSize:18, color:'var(--ink)', marginBottom:8 }}>
            Nenhuma obrigação registrada
          </div>
          <p className="faint" style={{ fontSize:13.5, maxWidth:340, margin:'0 auto 20px' }}>
            Adicione suas contas fixas ou registre compras no cartão de crédito para ver sua agenda financeira aqui.
          </p>
          <button className="btn" onClick={() => setModal({ mode:'new' })}>
            <Ic.plus size={16}/>Adicionar conta
          </button>
        </GlassCard>
      ) : (
        meses.map(mes => {
          const contas  = contasStore.getForMes(mes);
          const faturas = todasFaturas.filter(f => f.mes_ref === mes && f.valor_total > 0);
          if (contas.length === 0 && faturas.length === 0) return null;
          return (
            <MonthSection
              key={mes} mesRef={mes} contas={contas} faturas={faturas}
              mesAtual={mesAtual} contasStore={contasStore}
              onEditBill={conta => setModal({ mode:'edit', conta })}
              onFaturaClick={f => setFaturaDetalhe(f)}
            />
          );
        })
      )}

      {/* Modais */}
      {modal && (
        <ContaModal
          conta={modal.mode === 'edit' ? modal.conta : null}
          onSave={handleSaveBill}
          onDelete={modal.mode === 'edit' ? handleDeleteBill : undefined}
          onClose={() => setModal(null)}
        />
      )}

      {faturaDetalhe && (
        <FaturaDetailPanel
          fatura={faturaDetalhe}
          onClose={() => setFaturaDetalhe(null)}
          onPagar={id => { faturaStore.pagarFatura(id); setFaturaDetalhe(null); }}
          onDesfazer={id => { faturaStore.desfazerPagamento(id); setFaturaDetalhe(null); }}
        />
      )}
    </div>
  );
}

window.ContasProgramadas = ContasProgramadas;
