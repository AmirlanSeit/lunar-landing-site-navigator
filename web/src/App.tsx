import { useEffect, useMemo, useState } from 'react'
import { CustomSiteForm } from './components/CustomSiteForm'
import { LatitudeLab } from './components/LatitudeLab'
import { MatchView } from './components/MatchView'
import { PlayerCard } from './components/PlayerCard'
import { SiteDetail } from './components/SiteDetail'
import { TacticsBoard } from './components/TacticsBoard'
import { loadSiteData, loadSites, REGION_LABELS, regionOf, type Region } from './lib/data'
import { dataRange } from './lib/metrics'
import { evaluate, nearestGoShift, rank } from './lib/tactics'
import type { Site, SiteData } from './lib/types'
import { DEFAULT_THRESHOLDS, type Thresholds } from './lib/verdict'

// <input type="datetime-local"> values are treated as UTC.
const toInput = (d: Date) => d.toISOString().slice(0, 16)
const fromInput = (v: string) => new Date(`${v}:00Z`)

export default function App() {
  const [sites, setSites] = useState<Site[]>([])
  const [region, setRegion] = useState<Region>('south-pole')
  const [data, setData] = useState<SiteData[]>([])
  const [landing, setLanding] = useState('2027-03-15T12:00')
  const [days, setDays] = useState(14)
  const [t, setT] = useState<Thresholds>(DEFAULT_THRESHOLDS)
  const [plannedId, setPlannedId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [matchIds, setMatchIds] = useState<string[]>([])
  const [explain, setExplain] = useState(false)

  useEffect(() => {
    loadSites().then((catalog) => setSites((current) => [...catalog, ...current.filter((s) => s.category === 'custom')]))
  }, [])

  const regionSites = useMemo(() => sites.filter((s) => regionOf(s) === region), [sites, region])

  useEffect(() => {
    let live = true
    Promise.allSettled(regionSites.map(loadSiteData)).then((res) => {
      if (!live) return
      setData(res.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : [])))
    })
    setPlannedId((id) => regionSites.some((s) => s.id === id) ? id : regionSites[0]?.id ?? null)
    setSelectedId((id) => regionSites.some((s) => s.id === id) ? id : null)
    setMatchIds([])
    return () => { live = false }
  }, [regionSites])

  const landingDate = fromInput(landing)
  const ranked = useMemo(
    () => rank(data.flatMap((d) => evaluate(d, landingDate, days, t) ?? [])),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, landing, days, t],
  )
  const byId = (id: string | null) => ranked.find((s) => s.data.site.id === id) ?? null
  const planned = byId(plannedId)
  const shiftDays = useMemo(
    () => (planned && planned.verdict !== 'GO' ? nearestGoShift(planned.data, landingDate, days, t) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [planned?.data, planned?.verdict, landing, days, t],
  )
  const selected = byId(selectedId) ?? ranked[0] ?? null
  const matchList = matchIds.flatMap((id) => byId(id) ?? [])

  const [minDate, maxDate] = data[0] ? dataRange(data[0]) : [null, null]
  const maxLanding = maxDate ? new Date(maxDate.getTime() - days * 86400000) : null
  const mockEphem = data.some((d) => d.ephem.mock)
  const mockTerrain = data.some((d) => d.mask?.mock)
  const unverifiedSites = sites.some((s) => !s.source?.length)

  const toggleMatch = (id: string) =>
    setMatchIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id].slice(-4)))

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>Lunar Landing Site Navigator</h1>
          <p>Launch slipped? Pick the new date – we rank the sites.</p>
        </div>
        <button className={`explain-toggle${explain ? ' on' : ''}`} onClick={() => setExplain(!explain)} aria-pressed={explain}>
          🎓 {explain ? 'Explain mode: ON' : 'Explain the math'}
        </button>
      </header>
      {(mockEphem || mockTerrain || unverifiedSites) && (
        <div className="mock-banner">
          Development build:{' '}
          {[
            mockEphem && 'placeholder Sun/Earth positions',
            mockTerrain && 'placeholder terrain (real LOLA horizons coming)',
            unverifiedSites && 'unverified site coordinates',
          ]
            .filter(Boolean)
            .join(', ')}
          . Do not use for planning.
        </div>
      )}

      <section className="controls">
        <div className="control">
          <label htmlFor="landing">New landing date (UTC)</label>
          <input
            id="landing" type="datetime-local" value={landing}
            min={minDate ? toInput(minDate) : undefined}
            max={maxLanding ? toInput(maxLanding) : undefined}
            onChange={(e) => e.target.value && setLanding(e.target.value)}
          />
        </div>
        <div className="control">
          <label htmlFor="region">Region</label>
          <select id="region" value={region} onChange={(e) => setRegion(e.target.value as Region)}>
            {(Object.keys(REGION_LABELS) as Region[]).map((r) => <option key={r} value={r}>{REGION_LABELS[r]}</option>)}
          </select>
        </div>
        <div className="control">
          <label htmlFor="planned">Originally planned site</label>
          <select id="planned" value={plannedId ?? ''} onChange={(e) => setPlannedId(e.target.value)}>
            {regionSites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="control">
          <label htmlFor="days">Mission length: <span className="value">{days} days</span></label>
          <input id="days" type="range" min={1} max={60} value={days} onChange={(e) => setDays(+e.target.value)} />
        </div>
        <div className="control">
          <label htmlFor="light">GO needs sunlight ≥ <span className="value">{t.goLight}%</span></label>
          <input id="light" type="range" min={30} max={100} step={5} value={t.goLight} onChange={(e) => setT({ ...t, goLight: +e.target.value })} />
        </div>
        <div className="control">
          <label htmlFor="comm">GO needs Earth link ≥ <span className="value">{t.goComm}%</span></label>
          <input id="comm" type="range" min={25} max={100} step={5} value={t.goComm} onChange={(e) => setT({ ...t, goComm: +e.target.value })} />
        </div>
      </section>

      <CustomSiteForm onAdd={(site) => {
        setSites((current) => [...current, site])
        setRegion(regionOf(site))
        setPlannedId(site.id)
        setSelectedId(site.id)
      }} />

      {ranked.length === 0 && data.length > 0 && (
        <p className="section-title">No data for this date range – pick a date between {minDate && toInput(minDate)} and {maxLanding && toInput(maxLanding)}.</p>
      )}

      <h2 className="section-title">Tactics</h2>
      <TacticsBoard
        ranked={ranked} planned={planned} shiftDays={shiftDays} landing={landingDate} t={t}
        onTryDate={(d) => setLanding(toInput(d))}
        onSelect={setSelectedId}
      />

      <h2 className="section-title">Squad ranking · {REGION_LABELS[region]}</h2>
      <div className="cards">
        {ranked.map((s, i) => (
          <PlayerCard
            key={s.data.site.id} s={s} rank={i + 1}
            best={i === 0 && s.verdict !== 'NO-GO'}
            planned={s.data.site.id === plannedId}
            selected={s === selected}
            inMatch={matchIds.includes(s.data.site.id)}
            onSelect={() => setSelectedId(s.data.site.id)}
            onToggleMatch={() => toggleMatch(s.data.site.id)}
          />
        ))}
      </div>

      {matchList.length >= 2 && (
        <>
          <h2 className="section-title">Match</h2>
          <MatchView list={matchList} />
        </>
      )}

      {selected && (
        <>
          <h2 className="section-title">Why</h2>
          <SiteDetail s={selected} t={t} explain={explain} />
        </>
      )}

      {explain && selected && (
        <>
          <h2 className="section-title">Learn</h2>
          <LatitudeLab siteLat={selected.data.site.lat} siteName={selected.data.site.name} />
        </>
      )}

      <footer className="footer">
        Data: JPL Horizons (Sun/Earth positions), LRO LOLA (terrain). Built for NASA Space Apps 2026 with help from SI tools – see docs/SI_USAGE.md.
      </footer>
    </div>
  )
}
