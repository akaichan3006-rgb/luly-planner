// screen-settings.jsx — Configurações: perfil + tema (cards grandes) + preferências

// ── Reset do Sistema ──────────────────────────────────────────────────────────
function ResetModal({ onClose }) {
  const [confirmText, setConfirmText] = useS('');
  const [running, setRunning]         = useS(false);
  const [done, setDone]               = useS(false);
  const canReset = confirmText.trim().toUpperCase() === 'REINICIAR';

  const doReset = async () => {
    if (!canReset || running) return;
    setRunning(true);
    try {
      // 1. Limpar localStorage (todas as chaves ps_*)
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('ps_')) keysToRemove.push(k);
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));

      // 2. Limpar SessionStorage
      sessionStorage.clear();

      // 3. Limpar caches do PWA
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(n => caches.delete(n)));
      }

      // 4. Limpar IndexedDB
      if ('indexedDB' in window) {
        const dbs = await indexedDB.databases().catch(() => []);
        await Promise.all(dbs.map(db => {
          return new Promise(res => { const req = indexedDB.deleteDatabase(db.name); req.onsuccess = res; req.onerror = res; });
        }));
      }

      // 5. Desregistrar Service Worker (força nova instalação limpa)
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(r => r.unregister()));
      }

      setDone(true);
      // Redirecionar após 1.5s
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      console.error('[Reset] Erro:', err);
      window.showToast && window.showToast('Erro ao reiniciar. Tente novamente.', 'error');
      setRunning(false);
    }
  };

  if (done) return (
    <div style={{ position:'fixed', inset:0, zIndex:999, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(6px)',
      display:'grid', placeItems:'center', padding:20 }}>
      <div style={{ textAlign:'center', color:'#fff' }}>
        <div style={{ fontSize:56, marginBottom:16 }}>✓</div>
        <div style={{ fontWeight:800, fontSize:24, marginBottom:8 }}>Sistema reiniciado</div>
        <div style={{ opacity:0.7, fontSize:14 }}>Recarregando…</div>
      </div>
    </div>
  );

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:60, background:'rgba(40,10,10,0.5)',
      backdropFilter:'blur(4px)', display:'grid', placeItems:'center', padding:20 }}>
      <GlassCard onClick={e => e.stopPropagation()}
        style={{ width:'100%', maxWidth:460, padding:28, border:'1px solid color-mix(in oklab,#e05 18%,transparent)' }}>

        {/* Cabeçalho */}
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
          <div style={{ width:44, height:44, borderRadius:14, background:'color-mix(in oklab,#e05 16%,transparent)',
            display:'grid', placeItems:'center', flexShrink:0 }}>
            <span style={{ fontSize:22 }}>⚠️</span>
          </div>
          <div style={{ flex:1 }}>
            <h3 style={{ margin:0, fontSize:20, fontFamily:'var(--font-display)', fontWeight:700 }}>Reiniciar Sistema</h3>
            <div className="faint" style={{ fontSize:12.5, marginTop:2 }}>Ação irreversível</div>
          </div>
          <button className="icon-btn" onClick={onClose}><Ic.plus size={18} style={{ transform:'rotate(45deg)' }}/></button>
        </div>

        {/* Aviso */}
        <div style={{ padding:'12px 14px', borderRadius:12, marginBottom:20,
          background:'color-mix(in oklab,#e05 9%,transparent)',
          border:'1px solid color-mix(in oklab,#e05 22%,transparent)',
          fontSize:13.5, lineHeight:1.6 }}>
          Esta ação <strong>removerá permanentemente</strong> todos os dados cadastrados — finanças, investimentos, hábitos, metas, eventos, tarefas, cartões e configurações personalizadas.<br/>
          <strong>Não poderá ser desfeita.</strong>
        </div>

        {/* Lista do que será apagado */}
        <div style={{ fontSize:12.5, marginBottom:20, display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4px 16px' }}>
          {['Lançamentos financeiros','Investimentos','Hábitos e histórico','Metas e progresso',
            'Eventos da agenda','Tarefas','Cartões e parcelas','Layout personalizado',
            'Foto de perfil','Categorias customizadas','Tipos de ativo','Cache do PWA']
            .map(item => (
              <div key={item} className="faint" style={{ display:'flex', alignItems:'center', gap:5 }}>
                <span style={{ color:'#e05', fontWeight:700 }}>×</span> {item}
              </div>
            ))}
        </div>

        {/* Confirmação */}
        <label style={{ fontSize:13, fontWeight:700, display:'block', marginBottom:8, color:'var(--ink)' }}>
          Para confirmar, digite <span style={{ color:'#e05', fontFamily:'monospace', letterSpacing:1 }}>REINICIAR</span>:
        </label>
        <div className="field" style={{ marginBottom:20, border:'1px solid color-mix(in oklab,#e05 30%,transparent)' }}>
          <input autoFocus value={confirmText} onChange={e => setConfirmText(e.target.value)}
            placeholder="REINICIAR" style={{ fontFamily:'monospace', letterSpacing:2, fontSize:15, fontWeight:700,
              color: canReset ? '#e05' : 'var(--ink)' }}/>
        </div>

        <div style={{ display:'flex', gap:10 }}>
          <button className="btn btn-ghost" onClick={onClose} style={{ flex:1, justifyContent:'center' }} disabled={running}>
            Cancelar
          </button>
          <button onClick={doReset} disabled={!canReset || running}
            style={{ flex:2, padding:'10px 16px', borderRadius:12, cursor: canReset ? 'pointer' : 'not-allowed',
              fontFamily:'var(--font-ui)', fontWeight:700, fontSize:14, display:'flex', alignItems:'center',
              justifyContent:'center', gap:8, border:'none', transition:'all 0.15s',
              background: canReset ? '#c0392b' : 'color-mix(in oklab,#e05 18%,transparent)',
              color: canReset ? '#fff' : 'color-mix(in oklab,#e05 50%,transparent)' }}>
            {running ? '⟳ Reiniciando…' : '🔴 Reiniciar Sistema'}
          </button>
        </div>
      </GlassCard>
    </div>
  );
}

function Settings({ theme, setTheme, userName, setUserName }) {
  const themes = window.THEMES || [];
  const [draft, setDraft] = useS(userName || '');
  useE(() => { setDraft(userName || ''); }, [userName]);

  const firstName = (draft || '').trim().split(/\s+/)[0] || '';
  const possessive = firstName ? `${firstName}\u2019s Planner` : 'My Planner';
  const initial = (firstName[0] || 'M').toUpperCase();

  const commit = (v) => { setDraft(v); setUserName(v); };

  // ── Avatar ─────────────────────────────────────────────────────────────
  const [avatar, setAvatar] = useS(() => localStorage.getItem('ps_avatar') || '');
  const fileRef = React.useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    // Redimensiona para máx 400×400 e comprime para caber no localStorage
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const MAX = 400;
        const scale = Math.min(1, MAX / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width  = Math.round(img.width  * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        try {
          localStorage.setItem('ps_avatar', dataUrl);
          setAvatar(dataUrl);
          window.dispatchEvent(new Event('ps_avatar_changed'));
          window.showToast && window.showToast('Foto de perfil atualizada!');
        } catch {
          window.showToast && window.showToast('Não foi possível salvar a foto.', 'error');
        }
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
    // Limpa o input para permitir re-selecionar a mesma foto
    e.target.value = '';
  };

  const removeAvatar = () => {
    localStorage.removeItem('ps_avatar');
    setAvatar('');
    window.dispatchEvent(new Event('ps_avatar_changed'));
    window.showToast && window.showToast('Foto removida', 'info');
  };

  const [resetModal, setResetModal] = useS(false);

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
              {avatar ? (
                <img src={avatar} alt="avatar" style={{ width: 86, height: 86, borderRadius: '50%', objectFit: 'cover',
                  boxShadow: '0 12px 28px -12px color-mix(in oklab, var(--primary) 80%, transparent)',
                  border: '3px solid rgba(255,255,255,0.8)' }}/>
              ) : (
                <div style={{ width: 86, height: 86, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                  display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 700, fontSize: 34, fontFamily: 'var(--font-display)',
                  boxShadow: '0 12px 28px -12px color-mix(in oklab, var(--primary) 80%, transparent)' }}>{initial}</div>
              )}
              <input ref={fileRef} type="file" accept="image/*" capture="user"
                style={{ display: 'none' }} onChange={handleFileChange}/>
              {/* Área inteira clicável */}
              <div onClick={() => fileRef.current.click()}
                style={{ position: 'absolute', inset: 0, borderRadius: '50%', cursor: 'pointer',
                  background: 'rgba(0,0,0,0)', transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.18)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0)'}/>
              <button className="icon-btn"
                style={{ position: 'absolute', right: -4, bottom: -4, width: 30, height: 30, background: 'var(--bg-1)',
                  border: '2px solid var(--line)', boxShadow: '0 2px 8px rgba(0,0,0,0.12)', pointerEvents: 'none' }}
                title="Trocar foto">
                <Ic.edit size={14}/>
              </button>
            </div>
            {avatar && (
              <button onClick={removeAvatar} style={{ border: 'none', background: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--negative)', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 4 }}>
                <Ic.trash size={12}/> Remover foto
              </button>
            )}
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

          {/* ── Zona de Perigo ── */}
          <GlassCard style={{ padding: 24, border: '1px solid color-mix(in oklab,#e05 18%,transparent)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
              <div style={{ flex:1, display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:18 }}>⚠️</span>
                <span style={{ fontWeight:700, fontSize:16 }}>Zona de Perigo</span>
              </div>
            </div>
            <div className="faint" style={{ fontSize:12.5, marginBottom:16, paddingLeft:26 }}>
              Ações destrutivas e irreversíveis. Proceda com cuidado.
            </div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
              padding:'14px 16px', borderRadius:14,
              background:'color-mix(in oklab,#e05 6%,transparent)',
              border:'1px solid color-mix(in oklab,#e05 15%,transparent)' }}>
              <div>
                <div style={{ fontWeight:700, fontSize:14 }}>🔴 Reiniciar Sistema</div>
                <div className="faint" style={{ fontSize:12, marginTop:2 }}>
                  Apaga todos os dados e retorna ao estado de instalação inicial.
                </div>
              </div>
              <button onClick={() => setResetModal(true)}
                style={{ padding:'9px 16px', borderRadius:10, border:'1px solid #c0392b',
                  background:'color-mix(in oklab,#e05 12%,transparent)', color:'#c0392b',
                  fontFamily:'var(--font-ui)', fontWeight:700, fontSize:13, cursor:'pointer',
                  transition:'all 0.15s', flexShrink:0, marginLeft:16 }}
                onMouseEnter={e => { e.currentTarget.style.background='#c0392b'; e.currentTarget.style.color='#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background='color-mix(in oklab,#e05 12%,transparent)'; e.currentTarget.style.color='#c0392b'; }}>
                Reiniciar
              </button>
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
      {resetModal && <ResetModal onClose={() => setResetModal(false)} />}
    </div>
  );
}

window.Settings = Settings;
