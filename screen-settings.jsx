// screen-settings.jsx — Configurações: perfil + tema (cards grandes) + preferências
function Settings({ theme, setTheme, userName, setUserName }) {
  const themes = window.THEMES || [];
  const [draft, setDraft] = useS(userName || '');
  useE(() => { setDraft(userName || ''); }, [userName]);

  const firstName = (draft || '').trim().split(/\s+/)[0] || '';
  const possessive = firstName ? `${firstName}\u2019s Planner` : 'My Planner';
  const initial = (firstName[0] || 'M').toUpperCase();

  const commit = (v) => { setDraft(v); setUserName(v); };

  // cosmetic preferences (demo)
  const [prefs, setPrefs] = useS(() => {
    try { return JSON.parse(localStorage.getItem('ps_prefs')) || {}; } catch (e) { return {}; }
  });
  const setPref = (k, v) => setPrefs(p => { const n = { ...p, [k]: v }; localStorage.setItem('ps_prefs', JSON.stringify(n)); return n; });
  const pref = (k, d) => (prefs[k] === undefined ? d : prefs[k]);

  return (
    <div className="screen">
      <PageHeader title="Configurações" sub="Personalize a aparência do sistema e o seu perfil." />

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 16, alignItems: 'start' }}>
        {/* ---------- PERFIL ---------- */}
        <GlassCard style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <CardTitle icon="settings" title="Perfil" />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, paddingTop: 4 }}>
            <div style={{ position: 'relative' }}>
              <div style={{ width: 86, height: 86, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 700, fontSize: 34, fontFamily: 'var(--font-display)',
                boxShadow: '0 12px 28px -12px color-mix(in oklab, var(--primary) 80%, transparent)' }}>{initial}</div>
              <button className="icon-btn" style={{ position: 'absolute', right: -4, bottom: -4, width: 30, height: 30, background: 'var(--bg-1)' }} title="Trocar foto"><Ic.edit size={14}/></button>
            </div>
            <div className="faint" style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap' }}>Seu título dinâmico</div>
            <div className="serif" style={{ fontSize: 22, marginTop: -6, color: 'var(--primary)', whiteSpace: 'nowrap' }}>{possessive}</div>
          </div>

          <div>
            <label className="faint" style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase' }}>Nome de exibição</label>
            <div className="field" style={{ marginTop: 7 }}>
              <Ic.sparkle size={17} style={{ color: 'var(--ink-faint)' }}/>
              <input value={draft} onChange={(e) => commit(e.target.value)} placeholder="Seu nome" maxLength={24}/>
            </div>
            <div className="faint" style={{ fontSize: 11.5, marginTop: 6 }}>Atualiza o título do app em tempo real.</div>
          </div>

          <div>
            <label className="faint" style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase' }}>E-mail</label>
            <div className="field" style={{ marginTop: 7 }}>
              <Ic.receipt size={17} style={{ color: 'var(--ink-faint)' }}/>
              <input defaultValue="lulu@planner.app" placeholder="seu@email.com"/>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 14, background: 'var(--chip-bg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ color: 'var(--primary)' }}><Ic.sparkle size={18}/></span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13.5 }}>Plano Premium</div>
                <div className="faint" style={{ fontSize: 11.5 }}>Renova em 12 set 2026</div>
              </div>
            </div>
            <button className="btn-ghost btn" style={{ padding: '7px 12px', fontSize: 12.5 }}>Gerenciar</button>
          </div>
        </GlassCard>

        {/* ---------- TEMA + PREFERÊNCIAS ---------- */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <GlassCard style={{ padding: 24 }}>
            <CardTitle icon="droplet" title="Tema do sistema" />
            <div className="faint" style={{ fontSize: 13, marginTop: 4 }}>A interface inteira muda na hora — sidebar, cards, gráficos e fundo.</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginTop: 18 }}>
              {themes.map((th) => {
                const active = th.id === theme;
                return (
                  <button key={th.id} onClick={() => setTheme(th.id)}
                    style={{ textAlign: 'left', cursor: 'pointer', padding: 0, borderRadius: 18, overflow: 'hidden',
                      border: '2px solid ' + (active ? 'var(--primary)' : 'var(--line)'),
                      background: 'var(--chip-bg)', fontFamily: 'var(--font-ui)', transition: 'transform 0.15s var(--ease), border-color 0.2s',
                      boxShadow: active ? '0 12px 28px -14px color-mix(in oklab, var(--primary) 75%, transparent)' : 'none' }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
                    {/* mini preview using the palette */}
                    <div style={{ height: 78, position: 'relative', background: th.swatches[4],
                      backgroundImage: `radial-gradient(60% 80% at 15% 10%, ${th.swatches[0]}55, transparent 60%), radial-gradient(60% 80% at 90% 100%, ${th.swatches[2]}55, transparent 60%)` }}>
                      <div style={{ position: 'absolute', left: 12, top: 12, width: 40, height: 8, borderRadius: 6, background: th.swatches[0] }}/>
                      <div style={{ position: 'absolute', left: 12, top: 26, width: 26, height: 8, borderRadius: 6, background: th.swatches[1] }}/>
                      <div style={{ position: 'absolute', right: 12, bottom: 12, display: 'flex', gap: 5 }}>
                        {th.swatches.slice(0, 3).map((c, i) => <span key={i} style={{ width: 14, height: 14, borderRadius: '50%', background: c, border: '2px solid rgba(255,255,255,0.7)' }}/>)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '11px 13px' }}>
                      <span style={{ fontSize: 18 }}>{th.emoji}</span>
                      <span style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--ink)', flex: 1 }}>{th.label}</span>
                      {active && <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--primary)', display: 'grid', placeItems: 'center', color: '#fff' }}><Ic.check size={14}/></span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </GlassCard>

          <GlassCard style={{ padding: 24 }}>
            <CardTitle icon="bell" title="Preferências" />
            <div style={{ display: 'flex', flexDirection: 'column', marginTop: 8 }}>
              {[
                ['notif', 'Notificações push', 'Lembretes de compromissos e contas', true, 'bell'],
                ['email', 'Resumo por e-mail', 'Um panorama do seu dia toda manhã', false, 'receipt'],
                ['sound', 'Sons da interface', 'Feedback sonoro nas ações', false, 'sparkle'],
                ['week', 'Semana começa na segunda', 'Define o início da grade da agenda', true, 'calWeek'],
              ].map(([k, title, sub, def, icon]) => {
                const on = pref(k, def);
                return (
                  <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '13px 2px', borderBottom: '1px solid var(--line)' }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, display: 'grid', placeItems: 'center', background: 'var(--chip-bg)', color: 'var(--primary)' }}>{Ic[icon]({ size: 17 })}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{title}</div>
                      <div className="faint" style={{ fontSize: 12 }}>{sub}</div>
                    </div>
                    <button onClick={() => setPref(k, !on)} title="Alternar"
                      style={{ width: 46, height: 27, borderRadius: 99, border: 'none', cursor: 'pointer', padding: 3, flexShrink: 0,
                        background: on ? 'var(--primary)' : 'color-mix(in oklab, var(--ink) 18%, transparent)', transition: 'background 0.2s' }}>
                      <span style={{ display: 'block', width: 21, height: 21, borderRadius: '50%', background: '#fff',
                        transform: on ? 'translateX(19px)' : 'translateX(0)', transition: 'transform 0.2s var(--ease)', boxShadow: '0 2px 5px rgba(0,0,0,0.25)' }}/>
                    </button>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

window.Settings = Settings;
