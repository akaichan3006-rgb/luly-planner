// screen-dashboard.jsx
function Dashboard({ go }) {
  const eventStore = useEventStore();
  const finStore = useFinanceStore();
  const taskStore = useTaskStore();
  const goalStore = useGoalStore();
  const habitStore = useHabitStore();

  const today = eventStore.getEvents().filter((e) => e.date === eventStore.TODAY).sort((a, b) => a.ini - b.ini);
  const proximos = today.slice(0, 4);

  const cols = taskStore.getCols();
  const pend = [...(cols['A Fazer'] || []), ...(cols['Em Andamento'] || [])].slice(0, 4);

  const metas = goalStore.getAll().slice(0, 3);
  const habitos = habitStore.getAll().slice(0, 4);
  const contas = finStore.getContasVencer();

  const fmtH = (h) => `${String(Math.floor(h)).padStart(2,'0')}:${(h%1)*60 ? '30' : '00'}`;

  // Dynamic greeting based on current time
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  const DOW = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
  const MON = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  const dateStr = `${DOW[now.getDay()]}, ${now.getDate()} de ${MON[now.getMonth()]}`;

  return (
    <div className="screen">
      <PageHeader title={`${greeting} 🌸`} sub={`${dateStr} · ${today.length} compromisso${today.length === 1 ? '' : 's'} hoje.`}>
        <button className="btn-ghost btn" onClick={() => go('agenda')}><Ic.calDay size={17}/>Minha agenda</button>
        <button className="btn" onClick={() => go('agenda')}><Ic.plus size={17}/>Adicionar</button>
      </PageHeader>

      {/* top stat row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 16 }}>
        <StatCard icon="wallet" label="Saldo disponível" value={brl(finStore.getSaldo())} color="var(--primary)" />
        <StatCard icon="arrowDown" label="Entradas do mês" value={brl(finStore.getEntradasMes())} color="var(--positive)" sparkColor="var(--positive)" />
        <StatCard icon="arrowUp" label="Saídas do mês" value={brl(finStore.getSaidasMes())} color="var(--negative)" sparkColor="var(--negative)" />
        <StatCard icon="leaf" label="Economia do mês" value={brl(finStore.getEconomiaMes())} color="var(--accent)" sparkColor="var(--accent)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16 }}>
        {/* Resumo do dia */}
        <GlassCard style={{ padding: 22 }}>
          <CardTitle icon="clock" title="Resumo do dia" action="Ver agenda" onAction={() => go('agenda')} />
          {proximos.length === 0 ? (
            <div className="faint" style={{ textAlign: 'center', padding: '32px 0', fontSize: 13.5 }}>
              Nenhum compromisso hoje — vá para a agenda para adicionar.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
              {proximos.map((e) => (
                <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 12px', borderRadius: 14, background: 'var(--chip-bg)' }}>
                  <div style={{ textAlign: 'center', minWidth: 46 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{fmtH(e.ini)}</div>
                    <div className="faint" style={{ fontSize: 11 }}>{fmtH(e.fim)}</div>
                  </div>
                  <div style={{ width: 4, alignSelf: 'stretch', borderRadius: 4, background: catColors[e.cat] || 'var(--primary)' }}/>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14.5 }}>{e.titulo}</div>
                    <div className="faint" style={{ fontSize: 12.5, display: 'flex', gap: 6, alignItems: 'center' }}>
                      <Ic.pin size={12}/>{e.local || '—'}
                    </div>
                  </div>
                  <span className="chip" style={{ color: catColors[e.cat], background: `color-mix(in oklab, ${catColors[e.cat] || 'var(--primary)'} 13%, transparent)`, borderColor: 'transparent' }}>{e.cat}</span>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        {/* right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Resumo financeiro */}
          <GlassCard style={{ padding: 22 }}>
            <CardTitle icon="wallet" title="Resumo financeiro" action="Detalhes" onAction={() => go('financeiro')} />
            <div style={{ marginTop: 14 }}>
              {contas.length === 0 ? (
                <div className="faint" style={{ fontSize: 12.5, textAlign: 'center', padding: '14px 0' }}>Sem contas próximas do vencimento.</div>
              ) : (
                <React.Fragment>
                  <div className="faint" style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.3 }}>Contas próximas do vencimento</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
                    {contas.slice(0,3).map((c) => (
                      <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 30, height: 30, borderRadius: 9, display: 'grid', placeItems: 'center',
                            background: c.em <= 2 ? 'rgba(201,96,121,0.14)' : 'var(--chip-bg)', color: c.em <= 2 ? 'var(--negative)' : 'var(--ink-soft)' }}>
                            <Ic.receipt size={15}/>
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13.5, whiteSpace: 'nowrap' }}>{c.desc}</div>
                            <div className="faint" style={{ fontSize: 11.5, whiteSpace: 'nowrap' }}>vence em {c.em} {c.em === 1 ? 'dia' : 'dias'}</div>
                          </div>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: 13.5 }}>{brl(c.valor)}</div>
                      </div>
                    ))}
                  </div>
                </React.Fragment>
              )}
            </div>
          </GlassCard>

          {/* Hábitos do dia */}
          <GlassCard style={{ padding: 22 }}>
            <CardTitle icon="flame" title="Hábitos de hoje" action="Ver tudo" onAction={() => go('habitos')} />
            {habitos.length === 0 ? (
              <div className="faint" style={{ fontSize: 12.5, textAlign: 'center', padding: '14px 0' }}>Nenhum hábito cadastrado ainda.</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
                {habitos.map((h) => {
                  const pct = Math.min(100, Math.round(((h.hoje||0)/(h.meta||1))*100));
                  return (
                    <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 12, background: 'var(--chip-bg)' }}>
                      <Ring pct={pct} size={40} thickness={5} color={h.cor}>
                        {pct >= 100 ? <Ic.check size={16} style={{ color: h.cor }}/> : Ic[h.icon] ? Ic[h.icon]({ size: 16, style: { color: h.cor } }) : null}
                      </Ring>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 12.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.nome}</div>
                        <div className="faint" style={{ fontSize: 11 }}>{h.hoje||0}/{h.meta} {h.unidade}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </GlassCard>
        </div>
      </div>

      {/* bottom row: tasks + goals */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
        <GlassCard style={{ padding: 22 }}>
          <CardTitle icon="kanban" title="Tarefas pendentes" action="Quadro" onAction={() => go('tarefas')} />
          {pend.length === 0 ? (
            <div className="faint" style={{ fontSize: 12.5, textAlign: 'center', padding: '14px 0' }}>Nenhuma tarefa pendente.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
              {pend.map((t) => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 12px', borderRadius: 12, background: 'var(--chip-bg)' }}>
                  <div style={{ width: 18, height: 18, borderRadius: 6, border: `2px solid ${prioColor[t.prio] || '#999'}` }}/>
                  <div style={{ flex: 1, fontWeight: 600, fontSize: 13.5 }}>{t.titulo}</div>
                  {t.prazo && <span className="chip">{t.prazo}</span>}
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        <GlassCard style={{ padding: 22 }}>
          <CardTitle icon="target" title="Metas em andamento" action="Ver metas" onAction={() => go('metas')} />
          {metas.length === 0 ? (
            <div className="faint" style={{ fontSize: 12.5, textAlign: 'center', padding: '14px 0' }}>Nenhuma meta cadastrada ainda.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 16 }}>
              {metas.map((m) => {
                const pct = m.alvo > 0 ? Math.round(((m.atual||0)/m.alvo)*100) : 0;
                return (
                  <div key={m.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontWeight: 600, fontSize: 13.5 }}>
                        <span style={{ color: m.cor }}>{Ic[m.icon] ? Ic[m.icon]({ size: 16 }) : null}</span>{m.titulo}
                      </div>
                      <span className="faint" style={{ fontSize: 12.5, fontWeight: 600 }}>{pct}%</span>
                    </div>
                    <Bar pct={pct} color={m.cor} />
                    <div className="faint" style={{ fontSize: 11.5, marginTop: 5 }}>{brl(m.atual||0)} de {brl(m.alvo)}</div>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}

function CardTitle({ icon, title, action, onAction }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ color: 'var(--primary)' }}>{Ic[icon] ? Ic[icon]({ size: 19 }) : null}</span>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{title}</h3>
      </div>
      {action && <button onClick={onAction} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--primary)', fontWeight: 600, fontSize: 13, fontFamily: 'var(--font-ui)', display: 'flex', alignItems: 'center', gap: 3 }}>{action}<Ic.chevR size={15}/></button>}
    </div>
  );
}

function Bar({ pct, color }) {
  return (
    <div style={{ height: 8, borderRadius: 8, background: 'rgba(158,74,105,0.12)', overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${pct}%`, borderRadius: 8, background: `linear-gradient(90deg, ${color}, color-mix(in oklab, ${color} 60%, white))`, transition: 'width 0.9s var(--ease)' }}/>
    </div>
  );
}

Object.assign(window, { Dashboard, CardTitle, Bar });
