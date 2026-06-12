// screen-integrations.jsx — Calendar Integrations (Google + Apple)
// Connect flow, status, scopes, sync log, and a bidirectional-sync demo.
// NOTE: client-side simulation of OAuth/CalDAV (real ones need a backend).
function Integrations({ go }) {
  const store = useEventStore();
  const sync = store.getSync();
  const log = store.getLog();
  const events = store.getEvents();
  const [consent, setConsent] = useS(null); // 'google' | 'apple' | null
  const [connecting, setConnecting] = useS(false);

  const counts = {
    google: events.filter((e) => e.googleId).length,
    apple: events.filter((e) => e.appleId).length,
  };

  const doConnect = (provider) => {
    setConnecting(true);
    setTimeout(() => { store.connect(provider); setConnecting(false); setConsent(null); }, 1500);
  };

  return (
    <div className="screen">
      <PageHeader title="Integrações de Calendário" sub="Conecte o Planner ao Google e ao Apple Calendar — sincronização bidirecional em tempo real.">
        <button className="btn-ghost btn" onClick={() => go('agenda')}><Ic.calMonth size={16}/>Ir para a agenda</button>
      </PageHeader>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <ProviderCard provider="google" name="Google Calendar" brand="#4285F4"
          desc="Sincronize via Google Calendar API com OAuth 2.0."
          scopes={['.../auth/calendar — ler e gravar eventos', 'Criar · editar · excluir · ler', 'Sincronização automática']}
          connected={sync.google} at={sync.googleAt} count={counts.google}
          onConnect={() => setConsent('google')} onDisconnect={() => store.disconnect('google')} />

        <ProviderCard provider="apple" name="Apple Calendar" brand="#9aa0a6" dark
          desc="Assine o iCloud Calendar via CalDAV com senha de app."
          scopes={['CalDAV — iCloud Calendar', 'Criar · editar · excluir · ler', 'Atualização ao reabrir o app']}
          connected={sync.apple} at={sync.appleAt} count={counts.apple}
          onConnect={() => setConsent('apple')} onDisconnect={() => store.disconnect('apple')} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 16, marginTop: 16 }}>
        {/* Bidirectional demo */}
        <GlassCard style={{ padding: 22 }}>
          <CardTitle icon="leaf" title="Sincronização bidirecional" />
          <p className="faint" style={{ fontSize: 13, marginTop: 6, marginBottom: 0 }}>
            Tudo que você cria no Planner é enviado aos calendários conectados — e mudanças externas
            voltam para cá. Simule um evento externo para ver a agenda reagir:
          </p>
          {!(sync.google || sync.apple) && (
            <div className="chip" style={{ marginTop: 14, color: 'var(--warn)', borderColor: 'transparent', background: 'rgba(210,154,82,0.14)' }}>
              <Ic.bell size={13}/>Conecte um calendário para habilitar
            </div>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 16 }}>
            <button className="btn btn-ghost" disabled={!(sync.google || sync.apple)} onClick={() => store.simulateInbound('create')}><Ic.plus size={15}/>Evento criado fora</button>
            <button className="btn btn-ghost" disabled={!(sync.google || sync.apple)} onClick={() => store.simulateInbound('move')}><Ic.clock size={15}/>Horário alterado</button>
            <button className="btn btn-ghost" disabled={!(sync.google || sync.apple)} onClick={() => store.simulateInbound('delete')}><Ic.trash size={15}/>Excluído fora</button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 20, padding: '14px 16px', borderRadius: 14, background: 'var(--chip-bg)' }}>
            <Flow label="Planner" icon="sparkle" />
            <Ic.arrowUp size={16} style={{ transform: 'rotate(90deg)', color: 'var(--ink-faint)' }}/>
            <Flow label="Google" icon="calMonth" on={sync.google} color="#4285F4" />
            <Ic.arrowUp size={16} style={{ transform: 'rotate(90deg)', color: 'var(--ink-faint)' }}/>
            <Flow label="Apple" icon="calDay" on={sync.apple} color="#9aa0a6" />
          </div>
        </GlassCard>

        {/* Sync log */}
        <GlassCard style={{ padding: 22, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <CardTitle icon="receipt" title="Registro de sincronização" />
            <button className="icon-btn" style={{ width: 32, height: 32 }} title="Sincronizar agora" onClick={() => store.runSync()} disabled={!(sync.google || sync.apple)}>
              <span className={sync.syncing ? 'spin' : ''} style={{ display: 'grid' }}><Ic.arrowUp size={15}/></span>
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 12, maxHeight: 230, overflowY: 'auto' }}>
            {log.length === 0 && <div className="faint" style={{ fontSize: 13, padding: '20px 0', textAlign: 'center' }}>Sem atividade ainda.</div>}
            {log.map((l) => (
              <div key={l.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 4px', borderBottom: '1px solid var(--line)' }}>
                <span style={{ marginTop: 2, flexShrink: 0, color: l.kind === 'in' ? 'var(--positive)' : l.kind === 'out' ? 'var(--accent)' : 'var(--ink-faint)' }}>
                  {l.kind === 'in' ? <Ic.arrowDown size={14}/> : l.kind === 'out' ? <Ic.arrowUp size={14}/> : <Ic.dots size={14}/>}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3 }}>{l.msg}</div>
                  <div className="faint" style={{ fontSize: 11 }}>{new Date(l.at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {consent && <ConsentModal provider={consent} connecting={connecting} onAllow={() => doConnect(consent)} onClose={() => !connecting && setConsent(null)} />}
    </div>
  );
}

function Flow({ label, icon, on = true, color = 'var(--primary)' }) {
  return (
    <div style={{ flex: 1, textAlign: 'center', opacity: on ? 1 : 0.4 }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, margin: '0 auto 6px', display: 'grid', placeItems: 'center',
        background: `color-mix(in oklab, ${color} 16%, transparent)`, color }}>{Ic[icon]({ size: 19 })}</div>
      <div style={{ fontSize: 11.5, fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 10, fontWeight: 600, color: on ? 'var(--positive)' : 'var(--ink-faint)' }}>{on ? '● ativo' : '○ off'}</div>
    </div>
  );
}

function ProviderCard({ provider, name, brand, desc, scopes, connected, at, count, onConnect, onDisconnect, dark }) {
  return (
    <GlassCard style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 52, height: 52, borderRadius: 15, flexShrink: 0, display: 'grid', placeItems: 'center',
          background: dark ? 'linear-gradient(135deg,#3a3a3c,#1d1d1f)' : '#fff', border: '1px solid var(--line)',
          boxShadow: '0 6px 16px -10px rgba(0,0,0,0.5)' }}>
          {provider === 'google' ? <GoogleGlyph /> : <AppleGlyph />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 17 }}>{name}</div>
          <div className="faint" style={{ fontSize: 12.5 }}>{desc}</div>
        </div>
        <StatusBadge on={connected} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 7, padding: '14px 16px', borderRadius: 14, background: 'var(--chip-bg)' }}>
        {scopes.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 12.5, fontWeight: 500, color: 'var(--ink-soft)' }}>
            <Ic.check size={14} style={{ color: brand, flexShrink: 0 }}/>{s}
          </div>
        ))}
      </div>

      {connected && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12.5 }}>
          <span className="faint" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Ic.clock size={13}/>Último sync: {at ? new Date(at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '—'}</span>
          <span className="chip" style={{ color: brand, borderColor: 'transparent', background: `color-mix(in oklab, ${brand} 14%, transparent)` }}>{count} eventos</span>
        </div>
      )}

      {connected
        ? <button className="btn btn-ghost" onClick={onDisconnect} style={{ justifyContent: 'center', color: 'var(--negative)' }}><Ic.logout size={16}/>Desconectar</button>
        : <button className="btn" onClick={onConnect} style={{ justifyContent: 'center', background: dark ? 'linear-gradient(135deg,#3a3a3c,#1d1d1f)' : undefined }}><Ic.plus size={16}/>Conectar {name.split(' ')[0]}</button>}
    </GlassCard>
  );
}

function StatusBadge({ on }) {
  return (
    <span className="chip" style={{ gap: 6, flexShrink: 0, borderColor: 'transparent',
      background: on ? 'rgba(62,196,109,0.14)' : 'rgba(201,96,121,0.13)', color: on ? '#2e9c54' : 'var(--negative)' }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: on ? '#3ec46d' : '#c96079' }}/>{on ? 'Conectado' : 'Não conectado'}
    </span>
  );
}

/* OAuth-style consent (original Sakura styling, not a brand clone) */
function ConsentModal({ provider, connecting, onAllow, onClose }) {
  const isG = provider === 'google';
  const name = isG ? 'Google Calendar' : 'Apple Calendar';
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(40,20,30,0.45)', backdropFilter: 'blur(5px)', display: 'grid', placeItems: 'center', padding: 20 }}>
      <GlassCard onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 410, padding: 28, textAlign: 'center' }}>
        <div style={{ width: 60, height: 60, borderRadius: 18, margin: '0 auto 16px', display: 'grid', placeItems: 'center',
          background: isG ? '#fff' : 'linear-gradient(135deg,#3a3a3c,#1d1d1f)', border: '1px solid var(--line)', boxShadow: '0 10px 24px -12px rgba(0,0,0,0.5)' }}>
          {isG ? <GoogleGlyph size={30}/> : <AppleGlyph size={30}/>}
        </div>
        <h3 className="serif" style={{ margin: 0, fontSize: 23 }}>Conectar {name}</h3>
        <p className="faint" style={{ fontSize: 13, margin: '8px 0 20px' }}>
          O <strong>Luly Planner</strong> quer acesso para gerenciar seus eventos. Você pode revogar quando quiser.
        </p>
        <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 11, padding: '16px', borderRadius: 14, background: 'var(--chip-bg)', marginBottom: 20 }}>
          {['Ver seus eventos e calendários', 'Criar e editar eventos', 'Excluir eventos criados pelo app'].map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 500 }}>
              <span style={{ width: 22, height: 22, borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'color-mix(in oklab, var(--primary) 16%, transparent)', color: 'var(--primary)', flexShrink: 0 }}><Ic.check size={13}/></span>{s}
            </div>
          ))}
        </div>
        {connecting ? (
          <button className="btn" disabled style={{ width: '100%', justifyContent: 'center', padding: 13 }}>
            <span className="spin" style={{ display: 'grid' }}><Ic.leaf size={18}/></span>Conectando…
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-ghost" onClick={onClose} style={{ flex: 1, justifyContent: 'center' }}>Cancelar</button>
            <button className="btn" onClick={onAllow} style={{ flex: 2, justifyContent: 'center' }}><Ic.shield size={16}/>Permitir acesso</button>
          </div>
        )}
        <div className="faint" style={{ fontSize: 11, marginTop: 14 }}>🔒 Demonstração — fluxo OAuth/CalDAV simulado no protótipo</div>
      </GlassCard>
    </div>
  );
}

function GoogleGlyph({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48">
      <path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"/>
      <path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"/>
      <path fill="#FBBC05" d="M11.69 28.18c-.44-1.32-.69-2.73-.69-4.18s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.88l7.35-5.7z"/>
      <path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"/>
    </svg>
  );
}
function AppleGlyph({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#fff">
      <path d="M17.05 12.04c-.03-2.6 2.12-3.84 2.22-3.9-1.21-1.77-3.09-2.01-3.76-2.04-1.6-.16-3.12.94-3.93.94-.81 0-2.06-.92-3.39-.89-1.74.03-3.35 1.01-4.25 2.57-1.81 3.14-.46 7.79 1.3 10.34.86 1.25 1.88 2.65 3.22 2.6 1.29-.05 1.78-.83 3.34-.83 1.56 0 2 .83 3.37.81 1.39-.03 2.27-1.27 3.12-2.53.98-1.45 1.39-2.85 1.41-2.93-.03-.01-2.7-1.04-2.73-4.12-.02-2.58.13.04.04-.04zM14.6 4.6c.71-.87 1.19-2.07 1.06-3.27-1.02.04-2.26.68-3 1.55-.66.76-1.24 1.99-1.08 3.16 1.14.09 2.31-.58 3.02-1.44z"/>
    </svg>
  );
}

Object.assign(window, { Integrations });
