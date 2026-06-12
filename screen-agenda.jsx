// screen-agenda.jsx — Diária / Semanal / Mensal, all reading from ONE store (EventStore)
const HOURS = Array.from({ length: 16 }, (_, i) => i + 6); // 06h..21h
const fmtHr = (h) => `${String(Math.floor(h)).padStart(2,'0')}:${(h % 1) ? '30' : '00'}`;
const DOW = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
const MON_LONG = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
const MON_SHORT = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
const fmtLong = (iso) => { const d = new Date(iso + 'T12:00'); return `${DOW[d.getDay()]}, ${d.getDate()} de ${MON_LONG[d.getMonth()]}`; };

// Compute week dates (Mon..Sun) for any ISO date
function weekDatesOf(iso) {
  const d = new Date(iso + 'T12:00');
  const dow = d.getDay() === 0 ? 6 : d.getDay() - 1; // Mon=0..Sun=6
  return Array.from({ length: 7 }, (_, i) => {
    const dt = new Date(d);
    dt.setDate(d.getDate() - dow + i);
    return dt.toISOString().slice(0, 10);
  });
}

function CatLegend() {
  return (
    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
      {Object.entries(catColors).map(([k, c]) => (
        <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--ink-soft)' }}>
          <span style={{ width: 9, height: 9, borderRadius: 3, background: c }}/>{k}
        </div>
      ))}
    </div>
  );
}

function SourceDots({ ev, size = 6 }) {
  return (
    <span style={{ display: 'inline-flex', gap: 3, alignItems: 'center' }}>
      {ev.googleId && <span title="Google Calendar" style={{ width: size, height: size, borderRadius: '50%', background: '#4285F4' }}/>}
      {ev.appleId && <span title="Apple Calendar" style={{ width: size, height: size, borderRadius: '50%', background: '#A2AAAD' }}/>}
    </span>
  );
}

/* ---------------- VIEW SWITCHER ---------------- */
function AgendaSwitch({ view, setView }) {
  const opts = [['dia', 'Diária', 'calDay'], ['semana', 'Semanal', 'calWeek'], ['mes', 'Mensal', 'calMonth']];
  return (
    <div className="glass-soft" style={{ display: 'flex', padding: 4, gap: 2, marginRight: 2 }}>
      {opts.map(([id, label, icon]) => (
        <button key={id} onClick={() => setView(id)} title={`Agenda ${label}`}
          style={{ border: 'none', cursor: 'pointer', padding: '7px 13px', borderRadius: 10,
            fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6,
            background: view === id ? 'var(--primary)' : 'transparent', color: view === id ? '#fff' : 'var(--ink-soft)',
            boxShadow: view === id ? '0 6px 14px -7px rgba(158,74,105,0.7)' : 'none', transition: 'all 0.2s var(--ease)' }}>
          {Ic[icon]({ size: 15 })}<span className="agenda-switch-label">{label}</span>
        </button>
      ))}
    </div>
  );
}

/* ---------------- SYNC STATUS BAR ---------------- */
function SyncBar({ store, go }) {
  const sync = store.getSync();
  const any = sync.google || sync.apple;
  const last = Math.max(sync.googleAt || 0, sync.appleAt || 0);
  const ago = last ? agoText(last) : '—';
  return (
    <div className="glass-soft" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 14px', marginBottom: 14, flexWrap: 'wrap' }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontWeight: 700, fontSize: 12.5 }}>
        <span className={sync.syncing ? 'spin' : ''} style={{ color: 'var(--primary)', display: 'grid' }}><Ic.leaf size={15}/></span>
        Fonte única de eventos
      </span>
      <span className="faint" style={{ fontSize: 12 }}>Diária · Semanal · Mensal compartilham os mesmos dados</span>
      <span style={{ flex: 1 }}/>
      <ProviderPill on={sync.google} label="Google" color="#4285F4" />
      <ProviderPill on={sync.apple} label="Apple" color="#A2AAAD" />
      <span className="faint" style={{ fontSize: 11.5, display: 'flex', alignItems: 'center', gap: 5 }}>
        <Ic.clock size={12}/>{sync.syncing ? 'sincronizando…' : `sync ${ago}`}
      </span>
      <button className="btn-ghost btn" style={{ padding: '6px 11px', fontSize: 12 }} onClick={() => store.runSync()} disabled={!any} title={any ? 'Sincronizar agora' : 'Conecte um calendário'}>
        <Ic.arrowUp size={13}/>Sincronizar
      </button>
      <button className="btn-ghost btn" style={{ padding: '6px 11px', fontSize: 12 }} onClick={() => go('integracoes')}>
        <Ic.settings size={13}/>Integrações
      </button>
    </div>
  );
}
function ProviderPill({ on, label, color }) {
  return (
    <span className="chip" style={{ gap: 6, borderColor: 'transparent', background: on ? `color-mix(in oklab, ${color} 16%, transparent)` : 'var(--chip-bg)' }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: on ? '#3ec46d' : '#c96079' }}/>{label}
    </span>
  );
}
function agoText(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'agora';
  if (s < 3600) return `há ${Math.floor(s/60)} min`;
  if (s < 86400) return `há ${Math.floor(s/3600)} h`;
  return `há ${Math.floor(s/86400)} d`;
}

/* ---------------- WRAPPER (holds store + modal, shared by all views) ---------------- */
function Agenda({ go }) {
  const store = useEventStore();
  const [view, setView] = useS(() => localStorage.getItem('ps_agendaView') || 'dia');
  const [cursor, setCursor] = useS(() => new Date().toISOString().slice(0, 10));
  const [modal, setModal] = useS(null); // null | {mode:'new'|'edit', ev}
  useE(() => { localStorage.setItem('ps_agendaView', view); }, [view]);
  useE(() => { store.runSync(); }, []);

  const events = store.getEvents();
  const openNew = (prefill = {}) => setModal({ mode: 'new', ev: { titulo: '', cat: 'Pessoal', date: cursor, ini: 9, fim: 10, local: '', note: '', ...prefill } });
  const openEdit = (ev) => setModal({ mode: 'edit', ev });
  const save = (data) => {
    if (modal.mode === 'new') store.add(data); else store.update(modal.ev.id, data);
    setModal(null);
  };
  const del = () => { store.remove(modal.ev.id); setModal(null); };

  const shared = { events, store, cursor, setCursor, openNew, openEdit, view, setView, go };
  const View = { dia: AgendaDia, semana: AgendaSemana, mes: AgendaMes }[view] || AgendaDia;

  return (
    <React.Fragment>
      <View {...shared} />
      {modal && <EventModal modal={modal} onSave={save} onDelete={del} onClose={() => setModal(null)} />}
    </React.Fragment>
  );
}

/* ---------------- DIÁRIA ---------------- */
function AgendaDia({ events, store, cursor, setCursor, openNew, openEdit, view, setView, go }) {
  const ROW = 62;
  const dayEvents = events.filter((e) => e.date === cursor).sort((a, b) => a.ini - b.ini);
  const shift = (d) => { const nd = new Date(cursor + 'T12:00'); nd.setDate(nd.getDate() + d); setCursor(nd.toISOString().slice(0, 10)); };
  const isToday = cursor === new Date().toISOString().slice(0, 10);

  return (
    <div className="screen">
      <PageHeader title="Agenda" sub={`${fmtLong(cursor)} · ${dayEvents.length} compromisso${dayEvents.length === 1 ? '' : 's'}`}>
        <AgendaSwitch view={view} setView={setView} />
        <button className="icon-btn" onClick={() => shift(-1)}><Ic.chevL size={18}/></button>
        <button className="btn-ghost btn" onClick={() => setCursor(new Date().toISOString().slice(0, 10))}>Hoje</button>
        <button className="icon-btn" onClick={() => shift(1)}><Ic.chevR size={18}/></button>
        <button className="btn" onClick={() => openNew({ date: cursor })}><Ic.plus size={16}/>Compromisso</button>
      </PageHeader>

      <SyncBar store={store} go={go} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
        <GlassCard style={{ padding: '20px 22px 24px' }}>
          <div style={{ position: 'relative' }}>
            {HOURS.map((h) => (
              <div key={h} style={{ display: 'flex', gap: 14, height: ROW }}>
                <div className="faint" style={{ width: 46, fontSize: 12, fontWeight: 600, marginTop: -7, flexShrink: 0, textAlign: 'right' }}>{fmtHr(h)}</div>
                <div onClick={() => openNew({ date: cursor, ini: h, fim: h + 1 })} title="Adicionar às" style={{ flex: 1, borderTop: '1px solid var(--line)', cursor: 'pointer' }}/>
              </div>
            ))}
            {isToday && <NowLine top={(new Date().getHours() + new Date().getMinutes()/60 - 6) * ROW} />}
            {dayEvents.map((e) => {
              const top = (e.ini - 6) * ROW;
              const height = (e.fim - e.ini) * ROW - 6;
              const c = catColors[e.cat] || 'var(--primary)';
              return (
                <div key={e.id} onClick={() => openEdit(e)} style={{ position: 'absolute', left: 60, right: 6, top, height,
                  background: `color-mix(in oklab, ${c} 16%, var(--bg-1))`, borderLeft: `3px solid ${c}`,
                  borderRadius: 12, padding: '8px 12px', overflow: 'hidden', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', gap: 2,
                  backdropFilter: 'blur(6px)', boxShadow: '0 4px 14px -8px rgba(0,0,0,0.3)', transition: 'transform 0.15s' }}
                  onMouseEnter={ev => ev.currentTarget.style.transform = 'translateX(2px)'}
                  onMouseLeave={ev => ev.currentTarget.style.transform = 'none'}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                    <div style={{ fontWeight: 700, fontSize: 13.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: 6 }}>{e.titulo}<SourceDots ev={e}/></div>
                    <span style={{ color: c, fontWeight: 600, fontSize: 11, flexShrink: 0 }}>{fmtHr(e.ini)}–{fmtHr(e.fim)}</span>
                  </div>
                  {height > 44 && e.local && <div className="faint" style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}><Ic.pin size={11}/>{e.local}</div>}
                </div>
              );
            })}
            {dayEvents.length === 0 && (
              <div className="faint" style={{ position: 'absolute', top: 120, left: 60, right: 6, textAlign: 'center', fontSize: 13.5 }}>Nenhum compromisso neste dia — clique numa faixa de horário para adicionar.</div>
            )}
          </div>
        </GlassCard>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <GlassCard style={{ padding: 20 }}>
            <CardTitle icon="filter" title="Categorias" />
            <div style={{ marginTop: 14 }}><CatLegend /></div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

function NowLine({ top }) {
  return (
    <div style={{ position: 'absolute', left: 48, right: 6, top, display: 'flex', alignItems: 'center', gap: 0, zIndex: 5 }}>
      <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--negative)', boxShadow: '0 0 0 4px rgba(201,96,121,0.2)' }}/>
      <div style={{ flex: 1, height: 2, background: 'var(--negative)' }}/>
    </div>
  );
}

/* ---------------- SEMANAL ---------------- */
function AgendaSemana({ events, store, cursor, setCursor, openNew, openEdit, view, setView, go }) {
  const dias = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  const week = weekDatesOf(cursor);
  const nums = week.map((d) => parseInt(d.slice(8, 10), 10));
  const ROW = 46;

  const shiftWeek = (dir) => {
    const d = new Date(cursor + 'T12:00');
    d.setDate(d.getDate() + dir * 7);
    setCursor(d.toISOString().slice(0, 10));
  };

  const today = new Date().toISOString().slice(0, 10);
  const weekStart = week[0];
  const weekEnd = week[6];
  const startD = new Date(weekStart + 'T12:00');
  const endD = new Date(weekEnd + 'T12:00');
  const weekLabel = startD.getMonth() === endD.getMonth()
    ? `${startD.getDate()} – ${endD.getDate()} de ${MON_LONG[startD.getMonth()]} de ${startD.getFullYear()}`
    : `${startD.getDate()} ${MON_SHORT[startD.getMonth()]} – ${endD.getDate()} ${MON_SHORT[endD.getMonth()]} de ${endD.getFullYear()}`;

  return (
    <div className="screen">
      <PageHeader title="Agenda" sub={`${weekLabel} · clique numa faixa para criar`}>
        <AgendaSwitch view={view} setView={setView} />
        <button className="icon-btn" onClick={() => shiftWeek(-1)}><Ic.chevL size={18}/></button>
        <button className="btn-ghost btn" onClick={() => setCursor(today)}>Esta semana</button>
        <button className="icon-btn" onClick={() => shiftWeek(1)}><Ic.chevR size={18}/></button>
        <button className="btn" onClick={() => openNew({ date: cursor })}><Ic.plus size={16}/>Compromisso</button>
      </PageHeader>

      <SyncBar store={store} go={go} />

      <GlassCard style={{ padding: 18 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '52px repeat(7, 1fr)', gap: 6, marginBottom: 8 }}>
          <div/>
          {dias.map((d, i) => {
            const isToday = week[i] === today;
            return (
              <div key={d} style={{ textAlign: 'center', padding: '8px 0', borderRadius: 12, background: isToday ? 'color-mix(in oklab, var(--primary) 14%, transparent)' : 'transparent' }}>
                <div className="faint" style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: 0.5 }}>{d.toUpperCase()}</div>
                <div className="serif" style={{ fontSize: 22, color: isToday ? 'var(--primary)' : 'var(--ink)' }}>{nums[i]}</div>
              </div>
            );
          })}
        </div>
        <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '52px repeat(7, 1fr)', gap: 6 }}>
          <div>
            {HOURS.map(h => <div key={h} className="faint" style={{ height: ROW, fontSize: 11, fontWeight: 600, textAlign: 'right', paddingRight: 8, marginTop: -6 }}>{fmtHr(h)}</div>)}
          </div>
          {dias.map((d, di) => (
            <div key={d} style={{ position: 'relative', borderLeft: '1px solid var(--line)' }}>
              {HOURS.map(h => <div key={h} onClick={() => openNew({ date: week[di], ini: h, fim: h + 1 })} style={{ height: ROW, borderTop: '1px solid var(--line)', cursor: 'pointer' }}/>)}
              {events.filter(e => e.date === week[di]).map(e => {
                const c = catColors[e.cat] || 'var(--primary)';
                return (
                  <div key={e.id} onClick={() => openEdit(e)} title={`${e.titulo} · ${fmtHr(e.ini)}–${fmtHr(e.fim)}`}
                    style={{ position: 'absolute', left: 3, right: 3, top: (e.ini - 6) * ROW, height: (e.fim - e.ini) * ROW - 4,
                      background: `color-mix(in oklab, ${c} 20%, var(--bg-1))`, borderLeft: `3px solid ${c}`, borderRadius: 9,
                      padding: '5px 7px', overflow: 'hidden', cursor: 'pointer', fontSize: 11.5, lineHeight: 1.2, backdropFilter: 'blur(4px)' }}>
                    <div style={{ fontWeight: 700, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.titulo}</div>
                    <div style={{ color: c, fontWeight: 600, fontSize: 10.5 }}>{fmtHr(e.ini)}</div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--line)' }}><CatLegend /></div>
      </GlassCard>
    </div>
  );
}

/* ---------------- MENSAL ---------------- */
function AgendaMes({ events, store, cursor, setCursor, openNew, openEdit, view, setView, go }) {
  const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const today = new Date().toISOString().slice(0, 10);

  // Dynamic month from cursor
  const monthD = new Date(cursor.slice(0, 7) + '-01T12:00');
  const year = monthD.getFullYear();
  const month = monthD.getMonth();
  const firstDow = monthD.getDay(); // 0=Sun..6=Sat
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayNum = today.slice(0, 7) === cursor.slice(0, 7) ? parseInt(today.slice(8, 10), 10) : -1;

  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const pad2 = (n) => String(n).padStart(2, '0');
  const isoDay = (d) => `${year}-${pad2(month + 1)}-${pad2(d)}`;

  const byDay = {};
  events.forEach((e) => {
    if (e.date.slice(0, 7) === cursor.slice(0, 7)) {
      const d = parseInt(e.date.slice(8, 10), 10);
      (byDay[d] = byDay[d] || []).push(e);
    }
  });
  Object.values(byDay).forEach((arr) => arr.sort((a, b) => a.ini - b.ini));

  const shiftMonth = (dir) => {
    const d = new Date(year, month + dir, 1);
    setCursor(d.toISOString().slice(0, 10));
  };

  const openDay = (d) => {
    const iso = isoDay(d);
    setCursor(iso);
    openNew({ date: iso });
  };

  return (
    <div className="screen">
      <PageHeader title="Agenda" sub={`${MON_LONG[month].charAt(0).toUpperCase() + MON_LONG[month].slice(1)} de ${year} · clique num dia para adicionar`}>
        <AgendaSwitch view={view} setView={setView} />
        <button className="icon-btn" onClick={() => shiftMonth(-1)}><Ic.chevL size={18}/></button>
        <button className="btn-ghost btn" onClick={() => setCursor(today)}>Hoje</button>
        <button className="icon-btn" onClick={() => shiftMonth(1)}><Ic.chevR size={18}/></button>
        <button className="btn" onClick={() => openNew({ date: cursor })}><Ic.plus size={16}/>Evento</button>
      </PageHeader>

      <SyncBar store={store} go={go} />

      <GlassCard style={{ padding: 18 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, marginBottom: 8 }}>
          {dias.map(d => <div key={d} className="faint" style={{ textAlign: 'center', fontSize: 11.5, fontWeight: 700, letterSpacing: 0.5, padding: '4px 0' }}>{d.toUpperCase()}</div>)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: '1fr', gap: 8 }}>
          {cells.map((d, i) => {
            const ev = d ? (byDay[d] || []) : [];
            const isToday = d === todayNum && todayNum > 0;
            return (
              <div key={i} onClick={() => d && openDay(d)} style={{ minHeight: 92, borderRadius: 14, padding: 8, position: 'relative',
                background: d ? (isToday ? 'color-mix(in oklab, var(--primary) 13%, var(--chip-bg))' : 'var(--chip-bg)') : 'transparent',
                border: isToday ? '1px solid color-mix(in oklab, var(--primary) 45%, transparent)' : '1px solid transparent',
                opacity: d ? 1 : 0.35, cursor: d ? 'pointer' : 'default', transition: 'transform 0.15s' }}
                onMouseEnter={e => { if (d) e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
                {d && <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: isToday ? 800 : 600, fontSize: 13.5, color: isToday ? 'var(--primary)' : 'var(--ink)' }}>{d}</span>
                  {ev.length > 2 && <span className="faint" style={{ fontSize: 10, fontWeight: 600 }}>+{ev.length - 2}</span>}
                </div>}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 5 }}>
                  {ev.slice(0, 2).map((e) => {
                    const c = catColors[e.cat] || 'var(--primary)';
                    return (
                      <div key={e.id} onClick={(evt) => { evt.stopPropagation(); openEdit(e); }} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10.5, fontWeight: 600,
                        background: `color-mix(in oklab, ${c} 18%, var(--bg-1))`, color: 'var(--ink)',
                        padding: '2px 6px', borderRadius: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: c, flexShrink: 0 }}/>{e.titulo}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--line)' }}><CatLegend /></div>
      </GlassCard>
    </div>
  );
}

/* ---------------- EVENT MODAL (create / edit / delete) ---------------- */
function EventModal({ modal, onSave, onDelete, onClose }) {
  const [f, setF] = useS(() => ({ ...modal.ev }));
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const toHM = (h) => `${String(Math.floor(h)).padStart(2, '0')}:${String(Math.round((h % 1) * 60)).padStart(2, '0')}`;
  const fromHM = (s) => { const [h, m] = s.split(':').map(Number); return h + (m || 0) / 60; };
  const valid = f.titulo.trim() && f.fim > f.ini;

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(40,20,30,0.4)',
      backdropFilter: 'blur(4px)', display: 'grid', placeItems: 'center', padding: 20 }}>
      <GlassCard onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 460, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h3 className="serif" style={{ margin: 0, fontSize: 24 }}>{modal.mode === 'new' ? 'Novo compromisso' : 'Editar compromisso'}</h3>
          <button className="icon-btn" onClick={onClose}><Ic.plus size={18} style={{ transform: 'rotate(45deg)' }}/></button>
        </div>

        <label className="ev-label">Título</label>
        <div className="field" style={{ marginTop: 6 }}>
          <Ic.pin size={16} style={{ color: 'var(--ink-faint)' }}/>
          <input value={f.titulo} autoFocus onChange={(e) => set('titulo', e.target.value)} placeholder="Ex.: Consulta veterinária"/>
        </div>

        <label className="ev-label" style={{ marginTop: 14 }}>Categoria</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 7 }}>
          {Object.keys(catColors).map((cat) => {
            const on = f.cat === cat;
            return (
              <button key={cat} onClick={() => set('cat', cat)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 11px', borderRadius: 999,
                cursor: 'pointer', fontFamily: 'var(--font-ui)', fontSize: 12.5, fontWeight: 600, transition: 'all 0.15s',
                border: '1px solid ' + (on ? 'transparent' : 'var(--line)'),
                background: on ? `color-mix(in oklab, ${catColors[cat]} 20%, transparent)` : 'transparent',
                color: on ? 'var(--ink)' : 'var(--ink-soft)' }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: catColors[cat] }}/>{cat}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginTop: 14 }}>
          <div>
            <label className="ev-label">Data</label>
            <div className="field" style={{ marginTop: 6, padding: '10px 12px' }}>
              <input type="date" value={f.date} onChange={(e) => set('date', e.target.value)} style={{ colorScheme: 'light', flex: 1, border: 'none', background: 'none', outline: 'none', fontFamily: 'var(--font-ui)', fontSize: 14, color: 'var(--ink)' }}/>
            </div>
          </div>
          <div>
            <label className="ev-label">Início</label>
            <div className="field" style={{ marginTop: 6, padding: '10px 12px' }}>
              <input type="time" step="1800" value={toHM(f.ini)} onChange={(e) => set('ini', fromHM(e.target.value))} style={{ flex: 1, border: 'none', background: 'none', outline: 'none', fontFamily: 'var(--font-ui)', fontSize: 14, color: 'var(--ink)' }}/>
            </div>
          </div>
          <div>
            <label className="ev-label">Fim</label>
            <div className="field" style={{ marginTop: 6, padding: '10px 12px' }}>
              <input type="time" step="1800" value={toHM(f.fim)} onChange={(e) => set('fim', fromHM(e.target.value))} style={{ flex: 1, border: 'none', background: 'none', outline: 'none', fontFamily: 'var(--font-ui)', fontSize: 14, color: 'var(--ink)' }}/>
            </div>
          </div>
        </div>

        <label className="ev-label" style={{ marginTop: 14 }}>Local</label>
        <div className="field" style={{ marginTop: 6 }}>
          <Ic.pin size={16} style={{ color: 'var(--ink-faint)' }}/>
          <input value={f.local} onChange={(e) => set('local', e.target.value)} placeholder="Opcional"/>
        </div>

        <label className="ev-label" style={{ marginTop: 14 }}>Notas</label>
        <div className="field" style={{ marginTop: 6, alignItems: 'flex-start' }}>
          <Ic.edit size={15} style={{ color: 'var(--ink-faint)', marginTop: 2 }}/>
          <textarea value={f.note} onChange={(e) => set('note', e.target.value)} placeholder="Opcional" rows={2}
            style={{ flex: 1, border: 'none', background: 'none', outline: 'none', fontFamily: 'var(--font-ui)', fontSize: 14, color: 'var(--ink)', resize: 'none' }}/>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 22 }}>
          {modal.mode === 'edit'
            ? <button className="btn btn-ghost" onClick={onDelete} style={{ color: 'var(--negative)' }}><Ic.trash size={15}/>Excluir</button>
            : <span style={{ flex: 1 }}/>}
          <span style={{ flex: 1 }}/>
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn" disabled={!valid} onClick={() => onSave({ ...f, titulo: f.titulo.trim() })} style={{ opacity: valid ? 1 : 0.5 }}>
            <Ic.check size={16}/>{modal.mode === 'new' ? 'Criar' : 'Salvar'}
          </button>
        </div>
        <div className="faint" style={{ fontSize: 11.5, marginTop: 12, display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
          <Ic.leaf size={12}/>Será sincronizado com os calendários conectados
        </div>
      </GlassCard>
    </div>
  );
}

Object.assign(window, { Agenda, AgendaSwitch, AgendaDia, AgendaSemana, AgendaMes, EventModal, SyncBar });
