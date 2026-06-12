// app.jsx — shell: sidebar, topbar, router, theme, tweaks
const { useState: useS, useEffect: useE } = React;

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: 'grid' },
  { id: 'financeiro', label: 'Financeiro', icon: 'wallet' },
  { id: 'agenda', label: 'Agenda', icon: 'calMonth' },
  { id: 'tarefas', label: 'Tarefas', icon: 'kanban' },
  { id: 'metas', label: 'Metas', icon: 'target' },
  { id: 'habitos', label: 'Hábitos', icon: 'flame' },
  { id: 'integracoes', label: 'Integrações', icon: 'sync' },
  { id: 'config', label: 'Configurações', icon: 'settings' },
];

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "glassBlur": 22,
  "glassAlpha": 0.55,
  "glassRadius": 22,
  "petals": true,
  "accent": "#9E4A69"
}/*EDITMODE-END*/;

function Petals({ on }) {
  if (!on) return null;
  const arr = Array.from({ length: 9 });
  return arr.map((_, i) => (
    <div key={i} className="petal" style={{
      left: `${(i * 11 + 5) % 100}%`,
      animationDuration: `${9 + (i % 5) * 2.5}s`,
      animationDelay: `${-i * 2.1}s`,
      transform: `scale(${0.6 + (i % 4) * 0.22})`,
      opacity: 0.5,
    }}/>
  ));
}

// Reactive user-name store — reads from localStorage (acts as the auth/profile
// source), updates instantly across the UI on login/signup/profile edit, in
// this tab (custom event) and other tabs (native storage event). No reload.
function useUserName() {
  const [name, setName] = useS(() => {
    let n = localStorage.getItem('ps_userName');
    if (n === null) { n = 'Luly'; localStorage.setItem('ps_userName', n); } // seed demo profile
    return n;
  });
  useE(() => {
    const sync = () => setName(localStorage.getItem('ps_userName') || '');
    window.addEventListener('storage', sync);
    window.addEventListener('ps_user_changed', sync);
    return () => { window.removeEventListener('storage', sync); window.removeEventListener('ps_user_changed', sync); };
  }, []);
  const update = (v) => {
    const val = (v || '').trim();
    if (val) localStorage.setItem('ps_userName', val); else localStorage.removeItem('ps_userName');
    window.dispatchEvent(new Event('ps_user_changed'));
    setName(val);
  };
  return [name, update];
}

// Inline-editable profile name in the sidebar footer
function EditableName({ value, onSave }) {
  const [editing, setEditing] = useS(false);
  const [draft, setDraft] = useS(value);
  useE(() => { setDraft(value); }, [value]);
  const commit = () => { onSave(draft); setEditing(false); };
  if (editing) {
    return (
      <input autoFocus value={draft} onChange={(e) => setDraft(e.target.value)}
        onBlur={commit} onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setDraft(value); setEditing(false); } }}
        placeholder="Seu nome" maxLength={24}
        style={{ width: '100%', border: '1px solid var(--line-strong)', background: 'var(--bg-1)', borderRadius: 8,
          padding: '3px 7px', font: 'inherit', fontWeight: 700, fontSize: 13.5, color: 'var(--ink)', outline: 'none' }}/>
    );
  }
  return (
    <button onClick={() => setEditing(true)} title="Editar nome do perfil"
      style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', font: 'inherit', fontWeight: 700,
        fontSize: 13.5, color: 'var(--ink)', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5, textAlign: 'left' }}>
      {value || 'Definir nome'}<Ic.edit size={12} style={{ opacity: 0.5, flexShrink: 0 }}/>
    </button>
  );
}

// Global theme system — 4 seasonal palettes + the original Sakura light/dark.
// theme drives the data-theme attribute; all CSS variables cascade from it.
const THEMES = [
  { id: 'light',  label: 'Sakura Claro',  emoji: '🌺', swatches: ['#9E4A69','#C67C96','#7c93c4','#E8C8D9','#fbeef4'] },
  { id: 'dark',   label: 'Sakura Escuro', emoji: '🌙', swatches: ['#e29bb5','#c67c96','#9fb2e0','#3a202e','#1a1016'] },
  { id: 'autumn', label: 'Autumn',        emoji: '🍂', swatches: ['#B04A34','#D9A13A','#4D6B47','#5B3F46','#F5EFE9'] },
  { id: 'winter', label: 'Winter',        emoji: '❄️', swatches: ['#243D6B','#6A4377','#0F5660','#38448A','#EEF2F7'] },
  { id: 'spring', label: 'Spring',        emoji: '🌸', swatches: ['#F35C68','#F29180','#8FA60E','#F4C08A','#FFFDF8'] },
  { id: 'summer', label: 'Summer',        emoji: '☀️', swatches: ['#A75597','#8A70AF','#6D63B5','#DCA6D0','#F8F6FB'] },
];
const ThemeContext = React.createContext({ theme: 'light', setTheme: () => {} });
window.ThemeContext = ThemeContext;
window.THEMES = THEMES;

// Theme picker popover (lives in the header — the system's "Configurações de tema")
function ThemeMenu() {
  const { theme, setTheme } = React.useContext(ThemeContext);
  const [open, setOpen] = useS(false);
  const cur = THEMES.find(x => x.id === theme) || THEMES[0];
  return (
    <div style={{ position: 'relative' }}>
      <button className="icon-btn" title="Tema do sistema" onClick={() => setOpen(o => !o)}
        style={{ gap: 0 }}>
        <span style={{ fontSize: 17, lineHeight: 1 }}>{cur.emoji}</span>
      </button>
      {open && (
        <React.Fragment>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
          <div className="glass" style={{ position: 'absolute', right: 0, top: 50, width: 286, padding: 12, zIndex: 41 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 13.5, padding: '4px 6px 12px' }}>
              <Ic.droplet size={16} style={{ color: 'var(--primary)' }} />Tema do sistema
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {THEMES.map(th => {
                const active = th.id === theme;
                return (
                  <button key={th.id} onClick={() => { setTheme(th.id); setOpen(false); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '9px 10px', borderRadius: 12, cursor: 'pointer',
                      fontFamily: 'var(--font-ui)', textAlign: 'left', transition: 'background 0.15s',
                      border: '1px solid ' + (active ? 'color-mix(in oklab, var(--primary) 45%, transparent)' : 'transparent'),
                      background: active ? 'var(--chip-bg)' : 'transparent' }}
                    onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--chip-bg)'; }}
                    onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}>
                    <span style={{ fontSize: 19, lineHeight: 1, width: 22, textAlign: 'center' }}>{th.emoji}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--ink)' }}>{th.label}</div>
                      <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                        {th.swatches.map((c, i) => (
                          <span key={i} style={{ width: 17, height: 17, borderRadius: 5, background: c, border: '1px solid rgba(0,0,0,0.10)', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.3)' }} />
                        ))}
                      </div>
                    </div>
                    {active && <span style={{ color: 'var(--primary)', flexShrink: 0 }}><Ic.check size={17} /></span>}
                  </button>
                );
              })}
            </div>
          </div>
        </React.Fragment>
      )}
    </div>
  );
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [userName, setUserName] = useUserName();
  const firstName = (userName || '').trim().split(/\s+/)[0] || '';
  const possessive = firstName ? `${firstName}’s` : 'My';
  const plannerTitle = firstName ? `${firstName}’s Planner` : 'My Planner';
  const avatarInitial = (firstName[0] || 'M').toUpperCase();
  const [screen, setScreen] = useS(() => {
    let s = localStorage.getItem('ps_screen') || 'dashboard';
    if (s.indexOf('agenda') === 0) s = 'agenda'; // migrate old agendaDia/Semana/Mes
    return s;
  });
  const [theme, setTheme] = useS(() => localStorage.getItem('ps_theme') ||
    (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  const [collapsed, setCollapsed] = useS(false);
  const [loggedIn, setLoggedIn] = useS(() => localStorage.getItem('ps_loggedIn') === '1');
  const [appEnter, setAppEnter] = useS(false);

  useE(() => { localStorage.setItem('ps_loggedIn', loggedIn ? '1' : '0'); }, [loggedIn]);

  const handleLogin = (nm) => {
    if (nm) setUserName(nm);
    setAppEnter(true);
    setLoggedIn(true);
  };
  const handleLogout = () => { setLoggedIn(false); setAppEnter(false); };

  useE(() => { localStorage.setItem('ps_screen', screen); }, [screen]);
  useE(() => { document.title = `${plannerTitle} · Organização & Finanças`; }, [plannerTitle]);
  useE(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ps_theme', theme);
  }, [theme]);
  useE(() => {
    const r = document.documentElement.style;
    r.setProperty('--glass-blur', t.glassBlur + 'px');
    r.setProperty('--glass-radius', t.glassRadius + 'px');
    const isSakura = theme === 'light' || theme === 'dark';
    if (isSakura) {
      // accent tweak only steers the Sakura themes; seasonal themes own their palette
      r.setProperty('--glass-alpha', theme === 'dark' ? Math.min(t.glassAlpha, 0.6) : t.glassAlpha);
      r.setProperty('--primary', t.accent);
      r.setProperty('--sakura-kiss', t.accent);
    } else {
      r.setProperty('--glass-alpha', Math.min(t.glassAlpha, 0.62));
      r.removeProperty('--primary');
      r.removeProperty('--sakura-kiss');
    }
  }, [t, theme]);

  const go = (s) => setScreen(s);
  const Screen = {
    dashboard: Dashboard, financeiro: Financeiro, agenda: Agenda,
    tarefas: Tarefas, metas: Metas, habitos: Habitos, integracoes: Integrations, config: Settings,
  }[screen] || Dashboard;

  const current = NAV.find(n => n.id === screen) || NAV[0];

  if (!loggedIn) {
    return <Login onLogin={handleLogin} initialName={userName} />;
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
    <div className={appEnter ? 'app-fade-in' : undefined} style={{ position: 'relative', zIndex: 2, display: 'flex', height: '100vh', padding: 14, gap: 14 }}>
      {/* Sidebar */}
      <aside className="glass" style={{ width: collapsed ? 76 : 246, flexShrink: 0, display: 'flex', flexDirection: 'column',
        padding: 16, transition: 'width 0.3s var(--ease)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '4px 6px 18px' }}>
          <img src="images/luly-logo.png" alt={plannerTitle} style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
            objectFit: 'cover', boxShadow: '0 6px 16px -6px rgba(158,74,105,0.7)', border: '2px solid rgba(255,255,255,0.7)' }}/>
          {!collapsed && <div style={{ minWidth: 0 }}>
            <div className="serif" style={{ fontSize: 22, lineHeight: 1.1, whiteSpace: 'nowrap' }}>{possessive}</div>
            <div className="faint" style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.5 }}>PLANNER</div>
          </div>}
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
          {NAV.map((n) => {
            const active = n.id === screen;
            return (
              <button key={n.id} onClick={() => go(n.id)} title={n.label}
                style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '11px 12px', borderRadius: 13,
                  border: 'none', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: active ? 700 : 600,
                  color: active ? '#fff' : 'var(--ink-soft)', textAlign: 'left',
                  background: active ? 'linear-gradient(135deg, var(--sakura-kiss), var(--blossom-blush))' : 'transparent',
                  boxShadow: active ? '0 8px 18px -8px rgba(158,74,105,0.6)' : 'none',
                  transition: 'all 0.18s var(--ease)' }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--chip-bg)'; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}>
                <span style={{ flexShrink: 0 }}>{Ic[n.icon]({ size: 20 })}</span>
                {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>{n.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="glass-soft" style={{ padding: collapsed ? 10 : 14, marginTop: 12, display: 'flex', alignItems: 'center', gap: 11 }}>
          <div style={{ width: 38, height: 38, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg, #D6A1B5, #7c93c4)',
            display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 700, fontSize: 15 }}>{avatarInitial}</div>
          {!collapsed && <div style={{ flex: 1, minWidth: 0 }}>
            <EditableName value={userName} onSave={setUserName} />
            <div className="faint" style={{ fontSize: 11.5 }}>Plano Premium</div>
          </div>}
          {!collapsed && <button className="icon-btn" style={{ width: 32, height: 32 }} title="Sair" onClick={handleLogout}><Ic.logout size={16}/></button>}
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Topbar */}
        <header className="glass" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '11px 16px', flexShrink: 0, position: 'relative', zIndex: 20 }}>
          <button className="icon-btn" onClick={() => setCollapsed(c => !c)} title="Recolher menu">
            {Ic.chevL({ size: 18, style: { transform: collapsed ? 'rotate(180deg)' : 'none', transition: '0.2s' } })}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontWeight: 700, fontSize: 15 }}>
            <span style={{ color: 'var(--primary)' }}>{Ic[current.icon]({ size: 18 })}</span>{current.label}
          </div>
          <div className="glass-soft" style={{ flex: 1, maxWidth: 360, display: 'flex', alignItems: 'center', gap: 9, padding: '9px 14px', marginLeft: 8 }}>
            <Ic.search size={17} style={{ color: 'var(--ink-faint)' }}/>
            <input placeholder="Buscar tarefas, eventos, lançamentos…" style={{ border: 'none', background: 'none', outline: 'none',
              fontFamily: 'var(--font-ui)', fontSize: 13.5, color: 'var(--ink)', width: '100%' }}/>
          </div>
          <div style={{ flex: 1 }}/>
          <ThemeMenu />
          <button className="icon-btn" title="Notificações" style={{ position: 'relative' }}>
            <Ic.bell size={18}/>
            <span style={{ position: 'absolute', top: 7, right: 8, width: 8, height: 8, borderRadius: '50%', background: 'var(--negative)', border: '2px solid var(--bg-1)' }}/>
          </button>
        </header>

        {/* Scrollable screen */}
        <main key={screen} style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', paddingRight: 4, paddingTop: 6 }}>
          <Screen go={go} theme={theme} setTheme={setTheme} userName={userName} setUserName={setUserName} />
        </main>
      </div>

      <TweaksPanel>
        <TweakSection label="Liquid Glass" />
        <TweakSlider label="Desfoque (blur)" value={t.glassBlur} min={4} max={40} unit="px" onChange={(v) => setTweak('glassBlur', v)} />
        <TweakSlider label="Opacidade do vidro" value={t.glassAlpha} min={0.25} max={0.85} step={0.05} onChange={(v) => setTweak('glassAlpha', v)} />
        <TweakSlider label="Arredondamento" value={t.glassRadius} min={10} max={32} unit="px" onChange={(v) => setTweak('glassRadius', v)} />
        <TweakSection label="Tema Sakura" />
        <TweakColor label="Cor de acento (Sakura)" value={t.accent} options={['#9E4A69', '#C67C96', '#7c93c4', '#4f9d7e', '#b06a86']} onChange={(v) => setTweak('accent', v)} />
        <TweakToggle label="Pétalas caindo" value={t.petals} onChange={(v) => setTweak('petals', v)} />
      </TweaksPanel>

      <Petals on={t.petals} />
    </div>
    </ThemeContext.Provider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
