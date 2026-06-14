// ui.jsx — shared visual components
const { useState, useRef, useEffect } = React;

function GlassCard({ children, className = '', style, soft, ...p }) {
  return (
    <div className={`${soft ? 'glass-soft' : 'glass'} ${className}`} style={style} {...p}>
      {children}
    </div>
  );
}

// Donut / category breakdown
function Donut({ data, size = 168, thickness = 22, centerLabel, centerSub }) {
  const total = data.reduce((s, d) => s + d.valor, 0);
  const r = (size - thickness) / 2;
  const C = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(158,74,105,0.1)" strokeWidth={thickness}/>
      {data.map((d, i) => {
        const frac = d.valor / total;
        const len = frac * C;
        const el = (
          <circle key={i} cx={size/2} cy={size/2} r={r} fill="none"
            stroke={d.cor} strokeWidth={thickness} strokeLinecap="round"
            strokeDasharray={`${Math.max(len - 3, 0)} ${C}`} strokeDashoffset={-offset}
            style={{ transition: 'stroke-dashoffset 0.8s var(--ease), stroke-dasharray 0.8s var(--ease)' }}/>
        );
        offset += len;
        return el;
      })}
      {centerLabel && (
        <g style={{ transform: 'rotate(90deg)', transformOrigin: 'center' }}>
          <text x={size/2} y={size/2 - 4} textAnchor="middle" fontFamily="var(--font-display)"
            fontSize="26" fill="var(--ink)">{centerLabel}</text>
          <text x={size/2} y={size/2 + 16} textAnchor="middle" fontFamily="var(--font-ui)"
            fontSize="11" fontWeight="600" fill="var(--ink-faint)" letterSpacing="0.5">{centerSub}</text>
        </g>
      )}
    </svg>
  );
}

// Progress ring (single value)
function Ring({ pct, size = 64, thickness = 7, color = 'var(--primary)', children }) {
  const r = (size - thickness) / 2;
  const C = 2 * Math.PI * r;
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(158,74,105,0.14)" strokeWidth={thickness}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={thickness} strokeLinecap="round"
          strokeDasharray={`${(pct/100)*C} ${C}`} style={{ transition: 'stroke-dasharray 0.9s var(--ease)' }}/>
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>{children}</div>
    </div>
  );
}

// Dual-series bars (entrada/saida) with smooth area line for net
function EvolutionChart({ data, w = 560, h = 200 }) {
  const pad = { l: 8, r: 8, t: 14, b: 26 };
  const iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
  const max = Math.max(...data.flatMap(d => [d.entrada, d.saida])) * 1.12;
  const slot = iw / data.length;
  const bw = 13;
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="gIn" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#C67C96"/><stop offset="1" stopColor="#9E4A69"/>
        </linearGradient>
        <linearGradient id="gOut" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#cdd9ee"/><stop offset="1" stopColor="#9fb2e0"/>
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75, 1].map((g, i) => (
        <line key={i} x1={pad.l} x2={w-pad.r} y1={pad.t + ih*(1-g)} y2={pad.t + ih*(1-g)}
          stroke="rgba(158,74,105,0.09)" strokeWidth="1" strokeDasharray="2 5"/>
      ))}
      {data.map((d, i) => {
        const cx = pad.l + slot*i + slot/2;
        const hIn = (d.entrada/max)*ih, hOut = (d.saida/max)*ih;
        return (
          <g key={i}>
            <rect x={cx - bw - 2} y={pad.t + ih - hIn} width={bw} height={hIn} rx="5" fill="var(--primary)"/>
            <rect x={cx + 2} y={pad.t + ih - hOut} width={bw} height={hOut} rx="5" fill="var(--accent)"/>
            <text x={cx} y={h-8} textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--ink-faint)">{d.mes}</text>
          </g>
        );
      })}
    </svg>
  );
}

// Mini sparkline
function Spark({ points, w = 110, h = 36, color = 'var(--primary)' }) {
  const max = Math.max(...points), min = Math.min(...points);
  const rng = max - min || 1;
  const step = w / (points.length - 1);
  const pts = points.map((p, i) => [i*step, h - ((p-min)/rng)*(h-6) - 3]);
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const area = `${d} L${w} ${h} L0 ${h} Z`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <defs><linearGradient id={`sp${color.replace(/[^a-z0-9]/gi,'')}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={color} stopOpacity="0.28"/><stop offset="1" stopColor={color} stopOpacity="0"/>
      </linearGradient></defs>
      <path d={area} fill={`url(#sp${color.replace(/[^a-z0-9]/gi,'')})`}/>
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={pts[pts.length-1][0]} cy={pts[pts.length-1][1]} r="3" fill={color}/>
    </svg>
  );
}

// Section header
function PageHeader({ title, sub, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 22, flexWrap: 'wrap' }}>
      <div>
        <h1 className="serif" style={{ margin: 0, fontSize: 38, lineHeight: 1.05, color: 'var(--ink)' }}>{title}</h1>
        {sub && <p className="muted" style={{ margin: '6px 0 0', fontSize: 14 }}>{sub}</p>}
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>{children}</div>
    </div>
  );
}

function StatCard({ icon, label, value, delta, deltaUp, color = 'var(--primary)', spark, sparkColor }) {
  const I = Ic[icon];
  return (
    <GlassCard className="rise" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ width: 38, height: 38, borderRadius: 11, display: 'grid', placeItems: 'center',
          background: `color-mix(in oklab, ${color} 16%, transparent)`, color }}>
          {I && <I size={20}/>}
        </div>
        {delta && (
          <span className="chip" style={{ color: deltaUp ? 'var(--positive)' : 'var(--negative)',
            borderColor: 'transparent', background: deltaUp ? 'rgba(79,157,126,0.12)' : 'rgba(201,96,121,0.12)' }}>
            {deltaUp ? <Ic.arrowUp size={13}/> : <Ic.arrowDown size={13}/>}{delta}
          </span>
        )}
      </div>
      <div>
        <div className="faint" style={{ fontSize: 12.5, fontWeight: 600, letterSpacing: 0.3, textTransform: 'uppercase' }}>{label}</div>
        <div className="serif" style={{ fontSize: 30, lineHeight: 1.1, marginTop: 4, color: 'var(--ink)' }}>{value}</div>
      </div>
      {spark && <div style={{ marginTop: 'auto' }}><Spark points={spark} color={sparkColor || color} w={180}/></div>}
    </GlassCard>
  );
}

// ── Generic screen widget wrapper ─────────────────────────────────────────────
function ScreenWidget({ id, label, editing, isFirst, isLast, onHide, onMoveUp, onMoveDown, children }) {
  if (!editing) return <div style={{ marginBottom: 0 }}>{children}</div>;
  return (
    <div style={{ position: 'relative' }}>
      {/* Top control bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, padding: '5px 10px',
        borderRadius: 11, background: 'color-mix(in oklab, var(--primary) 10%, var(--bg-1))',
        border: '1px dashed color-mix(in oklab, var(--primary) 35%, transparent)' }}>
        {/* Drag dots */}
        <svg width="14" height="14" viewBox="0 0 16 16" fill="color-mix(in oklab, var(--ink) 30%, transparent)">
          <circle cx="5" cy="4" r="1.5"/><circle cx="11" cy="4" r="1.5"/>
          <circle cx="5" cy="8" r="1.5"/><circle cx="11" cy="8" r="1.5"/>
          <circle cx="5" cy="12" r="1.5"/><circle cx="11" cy="12" r="1.5"/>
        </svg>
        <span style={{ fontWeight: 700, fontSize: 12.5, color: 'var(--primary)', flex: 1 }}>{label}</span>
        <button disabled={isFirst} onClick={() => onMoveUp(id)}
          style={{ border: 'none', background: 'none', cursor: isFirst ? 'default' : 'pointer', opacity: isFirst ? 0.3 : 1,
            padding: '2px 5px', color: 'var(--ink-soft)', display: 'flex', alignItems: 'center' }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="3,10 8,5 13,10"/>
          </svg>
        </button>
        <button disabled={isLast} onClick={() => onMoveDown(id)}
          style={{ border: 'none', background: 'none', cursor: isLast ? 'default' : 'pointer', opacity: isLast ? 0.3 : 1,
            padding: '2px 5px', color: 'var(--ink-soft)', display: 'flex', alignItems: 'center' }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="3,6 8,11 13,6"/>
          </svg>
        </button>
        <div style={{ width: 1, height: 14, background: 'var(--line)' }}/>
        <button onClick={() => { onHide(id); window.showToast && window.showToast('Seção ocultada. Reative em "Personalizar".', 'info'); }}
          style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '2px 6px', color: 'var(--negative)',
            fontSize: 11.5, fontWeight: 700, fontFamily: 'var(--font-ui)', display: 'flex', alignItems: 'center', gap: 3 }}>
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M2 2l12 12"/><path d="M6.5 3.5A6 6 0 0 1 8 3c4 0 6 5 6 5s-.8 1.5-2.2 2.8"/>
            <path d="M9.5 12.5A6 6 0 0 1 8 13c-4 0-6-5-6-5s.8-1.5 2.2-2.8"/>
          </svg>Ocultar
        </button>
      </div>
      <div style={{ outline: '1.5px dashed color-mix(in oklab, var(--primary) 28%, transparent)', outlineOffset: 4,
        borderRadius: 'calc(var(--glass-radius) + 5px)', pointerEvents: 'none', position: 'absolute', inset: '30px 0 0 0' }}/>
      {children}
    </div>
  );
}

// ── Edit mode banner + manager panel ─────────────────────────────────────────
function ScreenEditBanner({ editing, hidden, defs, onToggle, onReset, onDone }) {
  const [showPanel, setShowPanel] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  if (!editing) return null;
  return (
    <React.Fragment>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderRadius: 14, marginBottom: 14,
        background: 'color-mix(in oklab, var(--primary) 10%, transparent)',
        border: '1px dashed color-mix(in oklab, var(--primary) 40%, transparent)' }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round">
          <path d="M11 2l3 3-8 8H3v-3l8-8z"/>
        </svg>
        <span style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--primary)' }}>Modo de edição</span>
        <span className="faint" style={{ fontSize: 12.5 }}>Use ↑ ↓ para reordenar · clique em Ocultar para esconder seções</span>
        <span style={{ flex: 1 }}/>
        {hidden.length > 0 && (
          <button onClick={() => setShowPanel(true)} style={{ border: '1px solid var(--line)', background: 'var(--bg-1)', borderRadius: 10,
            padding: '5px 12px', cursor: 'pointer', fontSize: 12.5, fontFamily: 'var(--font-ui)', color: 'var(--ink-soft)', display: 'flex', alignItems: 'center', gap: 5 }}>
            {hidden.length} ocult{hidden.length === 1 ? 'a' : 'as'}
          </button>
        )}
        <button onClick={onDone} style={{ border: 'none', background: 'var(--primary)', color: '#fff', borderRadius: 10,
          padding: '6px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-ui)', display: 'flex', alignItems: 'center', gap: 5 }}>
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="2,8 6,12 14,4"/></svg>
          Concluir
        </button>
      </div>

      {/* Hidden sections hint */}
      {hidden.length > 0 && !showPanel && (
        <div onClick={() => setShowPanel(true)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', borderRadius: 14,
          marginBottom: 14, background: 'var(--chip-bg)', border: '1.5px dashed var(--line)', cursor: 'pointer' }}>
          <span style={{ fontSize: 18 }}>👁</span>
          <div>
            <span style={{ fontWeight: 700, fontSize: 13.5 }}>{hidden.length} seção{hidden.length > 1 ? 'ões' : ''} oculta{hidden.length > 1 ? 's' : ''}: </span>
            <span className="faint" style={{ fontSize: 12.5 }}>{hidden.map(w => defs.find(d => d.id === w.id)?.label).join(' · ')}</span>
          </div>
          <span style={{ marginLeft: 'auto', fontSize: 12.5, fontWeight: 600, color: 'var(--primary)' }}>Gerenciar →</span>
        </div>
      )}

      {/* Manager panel */}
      {showPanel && (
        <div onClick={() => setShowPanel(false)} style={{ position: 'fixed', inset: 0, zIndex: 55, background: 'rgba(40,20,30,0.35)', backdropFilter: 'blur(6px)', display: 'grid', placeItems: 'center', padding: 20 }}>
          <GlassCard onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 380, padding: 24, maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <h3 className="serif" style={{ margin: 0, fontSize: 20 }}>Seções</h3>
              <button onClick={() => setShowPanel(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--ink-faint)', lineHeight: 1 }}>×</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {defs.map(def => {
                const w = hidden.find(h => h.id === def.id) || { id: def.id, visible: true };
                const isHidden = hidden.some(h => h.id === def.id);
                return (
                  <div key={def.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                    borderRadius: 12, background: 'var(--chip-bg)', border: '1px solid var(--line)' }}>
                    <span style={{ flex: 1, fontWeight: 600, fontSize: 13.5, color: isHidden ? 'var(--ink-faint)' : 'var(--ink)' }}>{def.label}</span>
                    <button onClick={() => onToggle(def.id, isHidden)}
                      style={{ width: 44, height: 26, borderRadius: 99, border: 'none', cursor: 'pointer', padding: 3,
                        background: !isHidden ? 'var(--primary)' : 'color-mix(in oklab, var(--ink) 18%, transparent)', transition: 'background 0.2s' }}>
                      <span style={{ display: 'block', width: 20, height: 20, borderRadius: '50%', background: '#fff',
                        transform: !isHidden ? 'translateX(18px)' : 'translateX(0)', transition: 'transform 0.2s var(--ease)', boxShadow: '0 2px 5px rgba(0,0,0,0.25)' }}/>
                    </button>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--line)' }}>
              {!confirmReset ? (
                <button onClick={() => setConfirmReset(true)} style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--negative)', fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 13, padding: '8px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  Restaurar padrão
                </button>
              ) : (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span className="faint" style={{ flex: 1, fontSize: 12 }}>Restaurar a ordem e visibilidade padrão?</span>
                  <button onClick={() => setConfirmReset(false)} style={{ border: '1px solid var(--line)', background: 'var(--bg-1)', borderRadius: 9, padding: '5px 12px', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontSize: 12 }}>Não</button>
                  <button onClick={() => { onReset(); setConfirmReset(false); setShowPanel(false); window.showToast && window.showToast('Layout restaurado!'); }}
                    style={{ border: 'none', background: 'var(--negative)', color: '#fff', borderRadius: 9, padding: '5px 12px', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 700 }}>Restaurar</button>
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      )}
    </React.Fragment>
  );
}

// shared hook aliases for sibling babel scripts (each has its own scope)
window.useS = React.useState;
window.useE = React.useEffect;

Object.assign(window, { GlassCard, Donut, Ring, EvolutionChart, Spark, PageHeader, StatCard, ScreenWidget, ScreenEditBanner });
