// screen-login.jsx — login with Sakura "bloom" animation
function Login({ onLogin, initialName }) {
  const [name, setName] = useS(initialName || '');
  const [pass, setPass] = useS('••••••••');
  const [showPass, setShowPass] = useS(false);
  const [phase, setPhase] = useS('form'); // form | loading | bloom

  const displayName = (name || '').trim().split(/\s+/)[0] || '';

  const submit = (e) => {
    e && e.preventDefault();
    if (phase !== 'form') return;
    setPhase('loading');
    setTimeout(() => setPhase('bloom'), 750);
    setTimeout(() => onLogin((name || '').trim()), 2750);
  };

  // burst petals positioned radially
  const petals = Array.from({ length: 16 }, (_, i) => {
    const ang = (i / 16) * Math.PI * 2 + (i % 2) * 0.2;
    const dist = 120 + (i % 4) * 26;
    return { tx: Math.cos(ang) * dist, ty: Math.sin(ang) * dist, r: (i % 2 ? 1 : -1) * (180 + i * 22), d: (i % 5) * 0.05 };
  });

  return (
    <div className="login-stage">
      <Petals on />
      <GlassCard className={phase === 'bloom' ? 'login-card fade-away' : 'login-card'} style={{ position: 'relative', overflow: 'hidden', minHeight: 520 }}>
        {/* FORM */}
        <img src="images/luly-logo.png" alt="Luly" className="login-logo" />
        <div className="serif" style={{ fontSize: 30, lineHeight: 1.1 }}>
          {displayName ? `Olá, ${displayName}` : 'Bem-vinda de volta'} <span style={{ fontFamily: 'var(--font-ui)' }}>🌸</span>
        </div>
        <p className="muted" style={{ margin: '8px 0 22px', fontSize: 14 }}>Entre para organizar o seu dia com leveza.</p>

        <form onSubmit={submit} style={{ textAlign: 'left' }}>
          <label className="faint" style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', paddingLeft: 2 }}>Nome</label>
          <div className="field">
            <Ic.sparkle size={18} style={{ color: 'var(--ink-faint)' }} />
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Como devemos te chamar?" maxLength={24} autoFocus />
          </div>

          <label className="faint" style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', paddingLeft: 2, display: 'block', marginTop: 16 }}>Senha</label>
          <div className="field">
            <Ic.shield size={18} style={{ color: 'var(--ink-faint)' }} />
            <input type={showPass ? 'text' : 'password'} value={pass} onChange={(e) => setPass(e.target.value)} placeholder="Sua senha" />
            <button type="button" onClick={() => setShowPass(s => !s)} title="Mostrar senha"
              style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--ink-faint)', padding: 0, display: 'grid' }}>
              <Ic.search size={16} />
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '14px 2px 18px' }}>
            <label className="muted" style={{ fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}>
              <input type="checkbox" defaultChecked style={{ accentColor: 'var(--primary)', width: 15, height: 15 }} />Manter conectada
            </label>
            <a href="#" onClick={(e) => e.preventDefault()} style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--primary)', textDecoration: 'none' }}>Esqueci a senha</a>
          </div>

          <button type="submit" className="btn" style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: 15, whiteSpace: 'nowrap' }} disabled={phase !== 'form'}>
            {phase === 'loading'
              ? <Ic.leaf size={19} className="spin" />
              : <React.Fragment><Ic.check size={18} />Entrar no planner</React.Fragment>}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
          <span className="faint" style={{ fontSize: 12 }}>ou</span>
          <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
        </div>
        <button type="button" onClick={submit} className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', padding: '11px' }}>
          <Ic.heart size={17} style={{ color: 'var(--primary)' }} />Continuar como convidada
        </button>

        <p className="faint" style={{ fontSize: 12.5, marginTop: 18, marginBottom: 0 }}>
          Nova por aqui? <a href="#" onClick={(e) => e.preventDefault()} style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Criar conta</a>
        </p>

        {/* BLOOM overlay */}
        {phase === 'bloom' && (
          <div className="bloom">
            <span className="halo" />
            <span className="halo h2" />
            {petals.map((p, i) => (
              <span key={i} className="burst-petal" style={{ '--tx': p.tx + 'px', '--ty': p.ty + 'px', '--r': p.r + 'deg', animationDelay: p.d + 's' }} />
            ))}
            <img src="images/luly-logo.png" alt="" className="bloom-logo" />
            <div className="welcome-text">
              <div className="serif" style={{ fontSize: 26 }}>{displayName ? `Bem-vinda, ${displayName}!` : 'Bem-vinda!'}</div>
              <div className="muted" style={{ fontSize: 13.5, marginTop: 4 }}>Preparando o seu dia…</div>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
}

window.Login = Login;
