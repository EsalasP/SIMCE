import type { Ensayo, ResumenCurso } from '@/types'
import { puntajeSimce } from '@/lib/calculos'
import { formatFecha } from '@/lib/utils'

export type Tendencia = 'sube' | 'baja' | 'igual' | null

export interface FilaEstudiante {
  nombre: string
  pcts: (number | null)[]
  tendencia: Tendencia
}

interface Props {
  resultados: { ensayo: Ensayo; resumen: ResumenCurso }[]
  estudiantes: FilaEstudiante[]
  cursoNombre: string
  nombreColegio: string
  colors: string[]
}

const colorPct = (pct: number) => (pct >= 75 ? '#10b981' : pct >= 50 ? '#d97706' : '#ef4444')

const TENDENCIA: Record<'sube' | 'baja' | 'igual', { label: string; color: string }> = {
  sube: { label: '↑ Sube', color: '#10b981' },
  baja: { label: '↓ Baja', color: '#ef4444' },
  igual: { label: '→ Estable', color: '#6b7280' },
}

const th = { padding: '6px 8px', borderBottom: '1px solid #e5e7eb', fontWeight: 600 } as const
const td = { padding: '5px 8px', borderBottom: '1px solid #f3f4f6' } as const
const titulo = { fontWeight: 700, fontSize: 13, marginBottom: 10, color: '#374151' } as const

export function ComparacionTemplate({ resultados, estudiantes, cursoNombre, nombreColegio, colors }: Props) {
  const primero = resultados[0].ensayo
  const ultimo = resultados[resultados.length - 1].ensayo
  const conteo = { sube: 0, baja: 0, igual: 0 }
  for (const e of estudiantes) if (e.tendencia) conteo[e.tendencia]++

  return (
    <div
      style={{
        width: 840,
        background: '#fff',
        color: '#111827',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: 12,
        padding: '36px 48px',
        boxSizing: 'border-box',
      }}
    >
      {/* ── Cabecera ── */}
      <div style={{ borderBottom: '3px solid #2563eb', paddingBottom: 16, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#1e3a8a' }}>{nombreColegio}</div>
            <div style={{ fontSize: 22, fontWeight: 800, marginTop: 4 }}>Comparación de ensayos</div>
            <div style={{ color: '#6b7280', marginTop: 4 }}>
              {cursoNombre} · {resultados.length} ensayos
            </div>
          </div>
          <div style={{ textAlign: 'right', color: '#6b7280', fontSize: 11 }}>
            <div>{formatFecha(primero.fecha)} — {formatFecha(ultimo.fecha)}</div>
            <div style={{ marginTop: 4 }}>SIMCE — Reporte de progresión</div>
          </div>
        </div>
      </div>

      {/* ── Progresión del promedio (barras HTML) ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={titulo}>Progresión del promedio del curso</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, height: 180, borderBottom: '1px solid #d1d5db', padding: '0 8px' }}>
          {resultados.map(({ ensayo, resumen }, i) => (
            <div key={ensayo.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: colors[i] }}>{resumen.promedio}%</div>
              <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 4 }}>{puntajeSimce(resumen.promedio)} pts</div>
              <div style={{ width: '60%', height: `${resumen.promedio * 1.3}px`, background: colors[i], borderRadius: '4px 4px 0 0' }} />
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 16, padding: '6px 8px 0' }}>
          {resultados.map(({ ensayo }) => (
            <div key={ensayo.id} style={{ flex: 1, textAlign: 'center', fontSize: 10, color: '#4b5563' }}>
              <div style={{ fontWeight: 600 }}>{ensayo.nombre}</div>
              <div style={{ color: '#9ca3af' }}>{formatFecha(ensayo.fecha)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Resumen por ensayo ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={titulo}>Resumen por ensayo</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ background: '#f3f4f6' }}>
              <th style={{ ...th, textAlign: 'left' }}>Ensayo</th>
              <th style={{ ...th, textAlign: 'center' }}>Evaluados</th>
              <th style={{ ...th, textAlign: 'center' }}>% Logro</th>
              <th style={{ ...th, textAlign: 'center' }}>Δ</th>
              <th style={{ ...th, textAlign: 'center' }}>Pts SIMCE</th>
              <th style={{ ...th, textAlign: 'left', width: 220 }}>Distribución de niveles</th>
            </tr>
          </thead>
          <tbody>
            {resultados.map(({ ensayo, resumen }, i) => {
              const delta = i > 0 ? resumen.promedio - resultados[i - 1].resumen.promedio : null
              return (
                <tr key={ensayo.id} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                  <td style={td}>
                    <span style={{ color: colors[i] }}>●</span>{' '}
                    <span style={{ fontWeight: 600 }}>{ensayo.nombre}</span>
                    <span style={{ color: '#9ca3af' }}> · {formatFecha(ensayo.fecha)}</span>
                  </td>
                  <td style={{ ...td, textAlign: 'center', color: '#6b7280' }}>{resumen.totalEvaluados}</td>
                  <td style={{ ...td, textAlign: 'center', fontWeight: 700, color: colorPct(resumen.promedio) }}>{resumen.promedio}%</td>
                  <td style={{ ...td, textAlign: 'center', fontWeight: 600,
                    color: delta === null ? '#9ca3af' : delta > 0 ? '#10b981' : delta < 0 ? '#ef4444' : '#6b7280' }}>
                    {delta === null ? '—' : `${delta > 0 ? '+' : ''}${delta}`}
                  </td>
                  <td style={{ ...td, textAlign: 'center', color: '#6b7280' }}>{puntajeSimce(resumen.promedio)}</td>
                  <td style={td}>
                    <div style={{ display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden', gap: 1 }}>
                      {resumen.porcentajeAdecuado > 0 && <div style={{ width: `${resumen.porcentajeAdecuado}%`, background: '#10b981' }} />}
                      {resumen.porcentajeElemental > 0 && <div style={{ width: `${resumen.porcentajeElemental}%`, background: '#f59e0b' }} />}
                      {resumen.porcentajeInsuficiente > 0 && <div style={{ width: `${resumen.porcentajeInsuficiente}%`, background: '#ef4444' }} />}
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 3, fontSize: 9 }}>
                      <span style={{ color: '#10b981' }}>A {resumen.porcentajeAdecuado}%</span>
                      <span style={{ color: '#d97706' }}>E {resumen.porcentajeElemental}%</span>
                      <span style={{ color: '#ef4444' }}>I {resumen.porcentajeInsuficiente}%</span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ── Tabla por estudiante ── */}
      <div>
        <div style={{ ...titulo, display: 'flex', justifyContent: 'space-between' }}>
          <span>Progresión por estudiante</span>
          <span style={{ fontWeight: 400, fontSize: 11, color: '#6b7280' }}>
            <span style={{ color: '#10b981' }}>↑ {conteo.sube}</span> ·{' '}
            <span>→ {conteo.igual}</span> ·{' '}
            <span style={{ color: '#ef4444' }}>↓ {conteo.baja}</span>
          </span>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ background: '#f3f4f6' }}>
              <th style={{ ...th, textAlign: 'left' }}>Estudiante</th>
              {resultados.map(({ ensayo }, i) => (
                <th key={ensayo.id} style={{ ...th, textAlign: 'center' }}>
                  <span style={{ color: colors[i] }}>●</span> {ensayo.nombre}
                </th>
              ))}
              <th style={{ ...th, textAlign: 'center' }}>Tendencia</th>
            </tr>
          </thead>
          <tbody>
            {estudiantes.map((est, idx) => (
              <tr key={`${est.nombre}-${idx}`} style={{ background: idx % 2 === 0 ? '#fff' : '#f9fafb' }}>
                <td style={td}>{est.nombre}</td>
                {est.pcts.map((pct, i) => (
                  <td key={i} style={{ ...td, textAlign: 'center', fontWeight: 600, color: pct === null ? '#9ca3af' : colorPct(pct) }}>
                    {pct === null ? '—' : `${pct}%`}
                  </td>
                ))}
                <td style={{ ...td, textAlign: 'center', fontWeight: 600, color: est.tendencia ? TENDENCIA[est.tendencia].color : '#9ca3af' }}>
                  {est.tendencia ? TENDENCIA[est.tendencia].label : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Pie ── */}
      <div style={{ marginTop: 32, borderTop: '1px solid #e5e7eb', paddingTop: 12, color: '#9ca3af', fontSize: 10, textAlign: 'center' }}>
        Generado por SIMCE App · {nombreColegio} · {new Date().toLocaleDateString('es-CL')}
      </div>
    </div>
  )
}
