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

// shared hook aliases for sibling babel scripts (each has its own scope)
window.useS = React.useState;
window.useE = React.useEffect;

Object.assign(window, { GlassCard, Donut, Ring, EvolutionChart, Spark, PageHeader, StatCard });
