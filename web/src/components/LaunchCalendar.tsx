import { useEffect, useMemo, useRef } from 'react'
import { buildCalendar } from '../lib/calendar'
import type { Scenario } from '../lib/tactics'
import type { SiteData } from '../lib/types'
import type { Thresholds } from '../lib/verdict'
import './LaunchCalendar.css'

const FROM_OFFSET = -14
const TO_OFFSET = 45
const DAY_MS = 86400000
const weeklyDate = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC',
})

interface LaunchCalendarProps {
  data: SiteData[]
  ranked: Scenario[]
  landing: Date
  days: number
  t: Thresholds
  onPick: (date: Date, siteId: string) => void
}

export function LaunchCalendar({ data, ranked, landing, days, t, onPick }: LaunchCalendarProps) {
  const landingMs = landing.getTime()
  const { goLight, goComm } = t
  const rows = useMemo(
    () => buildCalendar(data, new Date(landingMs), days, { goLight, goComm }, FROM_OFFSET, TO_OFFSET),
    [data, landingMs, days, goLight, goComm],
  )
  const sortedRows = useMemo(() => {
    const order = new Map(ranked.map((scenario, index) => [scenario.data.site.id, index]))
    return rows.map((row, index) => ({ row, order: order.get(row.site.id) ?? ranked.length + index }))
      .sort((a, b) => a.order - b.order)
      .map(({ row }) => row)
  }, [rows, ranked])
  // Keep the selected date in view: on a phone the calendar would otherwise open 14 days earlier.
  const scrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const box = scrollRef.current
    const current = box?.querySelector<HTMLElement>('th.launch-calendar-current')
    if (box && current) box.scrollLeft = current.offsetLeft - box.clientWidth / 2
  }, [landingMs, rows.length])
  const dates = useMemo(
    () => Array.from({ length: TO_OFFSET - FROM_OFFSET + 1 }, (_, index) => new Date(landingMs + (FROM_OFFSET + index) * DAY_MS)),
    [landingMs],
  )

  return (
    <section className="launch-calendar" aria-labelledby="launch-calendar-title">
      <h2 id="launch-calendar-title" className="launch-calendar-title">Launch window calendar</h2>
      <p id="launch-calendar-help" className="launch-calendar-help">
        Each cell tests a {days}-day mission starting at {landing.toISOString().slice(11, 16)} UTC; pick a day to make that site your planned landing.
      </p>
      <div className="launch-calendar-legend" aria-label="Calendar legend">
        <span><i className="launch-calendar-GO" aria-hidden="true" />GO</span>
        <span><i className="launch-calendar-RISKY" aria-hidden="true" />RISKY</span>
        <span><i className="launch-calendar-NO-GO" aria-hidden="true" />NO-GO</span>
        <span><i className="launch-calendar-unavailable" aria-hidden="true" />No data</span>
        <span><i className="launch-calendar-current-key" aria-hidden="true" />Selected date</span>
      </div>
      {sortedRows.length === 0 ? (
        <p className="launch-calendar-empty">No site data available for this region.</p>
      ) : (
        <div ref={scrollRef} className="launch-calendar-scroll" role="region" aria-label="Launch windows by site and UTC date" aria-describedby="launch-calendar-help" tabIndex={0}>
          <table className="launch-calendar-table">
            <thead>
              <tr>
                <th scope="col" className="launch-calendar-site">Site / UTC date</th>
                {dates.map((date, index) => {
                  const selected = date.getTime() === landingMs
                  const dateLabel = `${date.toISOString().slice(0, 16).replace('T', ' ')} UTC`
                  return (
                    <th key={date.getTime()} scope="col" className={`launch-calendar-date${selected ? ' launch-calendar-current' : ''}`} aria-current={selected ? 'date' : undefined} title={dateLabel}>
                      <span className="launch-calendar-sr-only">{dateLabel}</span>
                      {index % 7 === 0 && <span className="launch-calendar-week" aria-hidden="true">{weeklyDate.format(date)}</span>}
                      {selected && <span className="launch-calendar-selected-label" aria-hidden="true">↓ Selected</span>}
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {sortedRows.map(({ site, cells }) => (
                <tr key={site.id}>
                  <th scope="row" className="launch-calendar-site"><span title={site.name}>{site.name}</span></th>
                  {cells.map((cell, index) => {
                    const date = dates[index]
                    const selected = date.getTime() === landingMs
                    const dateLabel = `${date.toISOString().slice(0, 16).replace('T', ' ')} UTC`
                    const description = cell
                      ? `${site.name}, ${dateLabel}: ${cell.verdict}; sunlight ${cell.lightPct.toFixed(1)}%; Earth link ${cell.commPct.toFixed(1)}%`
                      : `${site.name}, ${dateLabel}: no data for the full ${days}-day mission`
                    const label = `${description}${selected ? '; selected landing date' : ''}`
                    return (
                      <td key={date.getTime()} className={selected ? 'launch-calendar-current' : undefined}>
                        <button
                          type="button"
                          className={`launch-calendar-cell launch-calendar-${cell?.verdict ?? 'unavailable'}`}
                          disabled={!cell}
                          title={label}
                          aria-label={label}
                          onClick={() => cell && onPick(cell.date, site.id)}
                        >
                          <span aria-hidden="true">{cell ? cell.verdict === 'GO' ? '✓' : cell.verdict === 'RISKY' ? '!' : '×' : '–'}</span>
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
