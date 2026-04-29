import type { Ensayo, Curso, ResumenCurso } from '@/types'
import { puntajeSimce } from '@/lib/calculos'
import { formatFecha } from '@/lib/utils'

const NIVEL_COLOR: Record<string, string> = {
  Adecuado: '#10b981',
  Elemental: '#f59e0b',
  Insuficiente: '#ef4444',
}

function Bar({ pct, color }: { pct: number; color: string }) {
  return (
    <div style={{ background: '#e5e7eb', borderRadius: 4, height: 10, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, background: color, height: '100%', borderRadius: 4, transition: 'width 0s' }} />
    </div>
  )
}

interface Props {
  ensayo: Ensayo
  curso: Curso | null
  resumen: ResumenCurso
  nombreColegio: string
}

export function ReporteTemplate({ ensayo, curso, resumen, nombreColegio }: Props) {
  const simce = puntajeSimce(resumen.promedio)
  const oasBajos = [...resumen.resultadosPorPregunta].sort((a, b) => a.porcentaje - b.porcentaje).slice(0, 6)

  return (
    <div
      id="reporte-pdf-root"
      style={{
        width: 794,
        background: '#fff',
        color: '#111827',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: 12,
        padding: '32px 40px',
        boxSizing: 'border-box',
      }}
    >
      {/* ── Cabecera ── */}
      <div style={{ borderBottom: '3px solid #2563eb', paddingBottom: 16, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#1e3a8a' }}>{nombreColegio}</div>
            <div style={{ fontSize: 22, fontWeight: 800, marginTop: 4 }}>{ensayo.nombre}</div>
            <div style={{ color: '#6b7280', marginTop: 4 }}>
              {curso?.nombre} · {ensayo.asignatura} · {ensayo.nivel}
            </div>
          </div>
          <div style={{ textAlign: 'right', color: '#6b7280', fontSize: 11 }}>
            <div>{formatFecha(ensayo.fecha)}</div>
            <div style={{ marginTop: 4 }}>SIMCE — Reporte de resultados</div>
          </div>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
        {[
          { label: 'Evaluados', value: String(resumen.totalEvaluados), sub: 'estudiantes' },
          { label: 'Promedio', value: `${resumen.promedio}%`, sub: 'logro total' },
          { label: 'Pts SIMCE', value: String(simce), sub: 'escala 100–400' },
          { label: 'Adecuado', value: `${resumen.porcentajeAdecuado}%`, sub: `${resumen.distribucion.Adecuado} est.`, color: '#10b981' },
          { label: 'Elemental', value: `${resumen.porcentajeElemental}%`, sub: `${resumen.distribucion.Elemental} est.`, color: '#f59e0b' },
          { label: 'Insuficiente', value: `${resumen.porcentajeInsuficiente}%`, sub: `${resumen.distribucion.Insuficiente} est.`, color: '#ef4444' },
        ].map((kpi) => (
          <div
            key={kpi.label}
            style={{
              flex: 1,
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              padding: '12px 10px',
              textAlign: 'center',
              borderTop: kpi.color ? `3px solid ${kpi.color}` : '3px solid #2563eb',
            }}
          >
            <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 4 }}>{kpi.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: kpi.color ?? '#111827' }}>{kpi.value}</div>
            <div style={{ fontSize: 10, color: '#9ca3af' }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Distribución visual ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, color: '#374151' }}>Distribución por nivel de desempeño</div>
        <div style={{ display: 'flex', height: 24, borderRadius: 6, overflow: 'hidden', gap: 2 }}>
          {resumen.porcentajeAdecuado > 0 && (
            <div style={{ width: `${resumen.porcentajeAdecuado}%`, background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 600 }}>
              {resumen.porcentajeAdecuado}%
            </div>
          )}
          {resumen.porcentajeElemental > 0 && (
            <div style={{ width: `${resumen.porcentajeElemental}%`, background: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 600 }}>
              {resumen.porcentajeElemental}%
            </div>
          )}
          {resumen.porcentajeInsuficiente > 0 && (
            <div style={{ width: `${resumen.porcentajeInsuficiente}%`, background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 600 }}>
              {resumen.porcentajeInsuficiente}%
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 6, fontSize: 11, color: '#4b5563' }}>
          <span style={{ color: '#10b981' }}>● Adecuado ({resumen.distribucion.Adecuado})</span>
          <span style={{ color: '#f59e0b' }}>● Elemental ({resumen.distribucion.Elemental})</span>
          <span style={{ color: '#ef4444' }}>● Insuficiente ({resumen.distribucion.Insuficiente})</span>
        </div>
      </div>

      {/* ── Resultados por eje ── */}
      {resumen.resultadosPorEje.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, color: '#374151' }}>Resultados por eje OA</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {resumen.resultadosPorEje.map((eje) => (
              <div key={eje.eje} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 180, fontSize: 11, color: '#374151', flexShrink: 0 }}>{eje.eje}</div>
                <div style={{ flex: 1 }}>
                  <Bar pct={eje.porcentaje} color={eje.porcentaje >= 75 ? '#10b981' : eje.porcentaje >= 50 ? '#f59e0b' : '#ef4444'} />
                </div>
                <div style={{ width: 40, textAlign: 'right', fontWeight: 700, fontSize: 12,
                  color: eje.porcentaje >= 75 ? '#10b981' : eje.porcentaje >= 50 ? '#d97706' : '#ef4444' }}>
                  {eje.porcentaje}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tabla de estudiantes ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, color: '#374151' }}>Resultados por estudiante</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ background: '#f3f4f6' }}>
              <th style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid #e5e7eb', fontWeight: 600 }}>Estudiante</th>
              <th style={{ textAlign: 'center', padding: '6px 8px', borderBottom: '1px solid #e5e7eb', fontWeight: 600 }}>% Logro</th>
              <th style={{ textAlign: 'center', padding: '6px 8px', borderBottom: '1px solid #e5e7eb', fontWeight: 600 }}>Pts SIMCE</th>
              <th style={{ textAlign: 'center', padding: '6px 8px', borderBottom: '1px solid #e5e7eb', fontWeight: 600 }}>Correctas</th>
              <th style={{ textAlign: 'center', padding: '6px 8px', borderBottom: '1px solid #e5e7eb', fontWeight: 600 }}>Nivel</th>
            </tr>
          </thead>
          <tbody>
            {[...resumen.resultadosEstudiantes]
              .sort((a, b) => b.porcentaje - a.porcentaje)
              .map((r, idx) => (
                <tr key={r.estudianteId} style={{ background: idx % 2 === 0 ? '#fff' : '#f9fafb' }}>
                  <td style={{ padding: '5px 8px', borderBottom: '1px solid #f3f4f6' }}>{r.nombre}</td>
                  <td style={{ padding: '5px 8px', textAlign: 'center', borderBottom: '1px solid #f3f4f6', fontWeight: 600,
                    color: r.porcentaje >= 75 ? '#10b981' : r.porcentaje >= 50 ? '#d97706' : '#ef4444' }}>
                    {r.porcentaje}%
                  </td>
                  <td style={{ padding: '5px 8px', textAlign: 'center', borderBottom: '1px solid #f3f4f6', color: '#6b7280' }}>
                    {puntajeSimce(r.porcentaje)}
                  </td>
                  <td style={{ padding: '5px 8px', textAlign: 'center', borderBottom: '1px solid #f3f4f6', color: '#6b7280' }}>
                    {r.correctas}/{r.total}
                  </td>
                  <td style={{ padding: '5px 8px', textAlign: 'center', borderBottom: '1px solid #f3f4f6' }}>
                    <span style={{
                      background: NIVEL_COLOR[r.nivelDesempeno] + '20',
                      color: NIVEL_COLOR[r.nivelDesempeno],
                      padding: '2px 8px',
                      borderRadius: 12,
                      fontWeight: 600,
                      fontSize: 10,
                    }}>
                      {r.nivelDesempeno}
                    </span>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* ── OAs con menor logro ── */}
      {oasBajos.length > 0 && (
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, color: '#374151' }}>Preguntas con menor logro</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ background: '#f3f4f6' }}>
                <th style={{ textAlign: 'center', padding: '6px 8px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, width: 40 }}>P°</th>
                <th style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid #e5e7eb', fontWeight: 600 }}>OA</th>
                <th style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid #e5e7eb', fontWeight: 600 }}>Eje</th>
                <th style={{ textAlign: 'center', padding: '6px 8px', borderBottom: '1px solid #e5e7eb', fontWeight: 600 }}>% Logro</th>
              </tr>
            </thead>
            <tbody>
              {oasBajos.map((p, idx) => (
                <tr key={p.numero} style={{ background: idx % 2 === 0 ? '#fff' : '#f9fafb' }}>
                  <td style={{ padding: '5px 8px', textAlign: 'center', borderBottom: '1px solid #f3f4f6', fontWeight: 600 }}>P{p.numero}</td>
                  <td style={{ padding: '5px 8px', borderBottom: '1px solid #f3f4f6' }}>{p.oa || '—'}</td>
                  <td style={{ padding: '5px 8px', borderBottom: '1px solid #f3f4f6', color: '#6b7280' }}>{p.eje}</td>
                  <td style={{ padding: '5px 8px', textAlign: 'center', borderBottom: '1px solid #f3f4f6', fontWeight: 700,
                    color: p.porcentaje >= 50 ? '#d97706' : '#ef4444' }}>
                    {p.porcentaje}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Pie ── */}
      <div style={{ marginTop: 32, borderTop: '1px solid #e5e7eb', paddingTop: 12, color: '#9ca3af', fontSize: 10, textAlign: 'center' }}>
        Generado por SIMCE App · {nombreColegio} · {new Date().toLocaleDateString('es-CL')}
      </div>
    </div>
  )
}
