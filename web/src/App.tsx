import { useEffect, useMemo, useState } from 'react'
import { CustomSiteForm } from './components/CustomSiteForm'
import { Intro } from './components/Intro'
import { LatitudeLab } from './components/LatitudeLab'
import { LaunchCalendar } from './components/LaunchCalendar'
import { MatchView } from './components/MatchView'
import { PlayerCard } from './components/PlayerCard'
import { ShareButton } from './components/ShareButton'
import { SiteDetail } from './components/SiteDetail'
import { TacticsBoard } from './components/TacticsBoard'
import { createCustomSite } from './lib/custom-site'
import { loadSiteData, loadSites, REGION_LABELS, regionOf, type Region } from './lib/data'
import { dataRange } from './lib/metrics'
import { bestPick, evaluate, nearestGoShift, rank } from './lib/tactics'
import type { Site, SiteData } from './lib/types'
import { buildUrlState, customIndex, parseUrlState } from './lib/url'
import { useNearbySpot } from './lib/useNearbySpot'
import { useNeighborhood } from './lib/useNeighborhood'
import { DEFAULT_THRESHOLDS, type Thresholds } from './lib/verdict'

// <input type="datetime-local"> values are treated as UTC.
const toInput = (d: Date) => d.toISOString().slice(0, 16)
const fromInput = (v: string) => new Date(`${v}:00Z`)

const DEFAULT_LANDING = '2027-03-15T12:00'
const DEFAULT_DAYS = 14

// Found in the real data: Mons Mouton (VIPER's target) is GO on 13 Nov 2027, NO-GO after a
// two-week slip; the tactics offer both a 5-day wait and a switch to Nobile Rim 2.
const DEMO = {
  site: 'viper_mons_mouton_target',
  original: '2027-11-13T12:00',
  landing: '2027-11-27T12:00',
}

// A shared link restores the scenario, including custom points.
const initialUrl = parseUrlState(window.location.search)
const initialCustom = initialUrl.custom.flatMap((c) => {
  try {
    return [createCustomSite(c)]
  } catch {
    return []
  }
})
const fromRef = (ref: string | undefined) => {
  const i = customIndex(ref)
  return i === null ? ref ?? null : initialCustom[i]?.id ?? null
}

export default function App() {
  const [sites, setSites] = useState<Site[]>(initialCustom)
  const [catalogReady, setCatalogReady] = useState(false)
  const [region, setRegion] = useState<Region>(initialUrl.region ?? 'south-pole')
  const [data, setData] = useState<SiteData[]>([])
  const [landing, setLanding] = useState(initialUrl.date ?? DEFAULT_LANDING)
  const [original, setOriginal] = useState(initialUrl.orig ?? '')
  const [days, setDays] = useState(initialUrl.days ?? DEFAULT_DAYS)
  const [t, setT] = useState<Thresholds>({
    goLight: initialUrl.light ?? DEFAULT_THRESHOLDS.goLight,
    goComm: initialUrl.comm ?? DEFAULT_THRESHOLDS.goComm,
  })
  const [plannedId, setPlannedId] = useState<string | null>(fromRef(initialUrl.site))
  const [selectedId, setSelectedId] = useState<string | null>(fromRef(initialUrl.sel))
  const [matchIds, setMatchIds] = useState<string[]>([])
  const [explain, setExplain] = useState(initialUrl.explain ?? false)

  useEffect(() => {
    loadSites()
      .then((catalog) => setSites((current) => [...catalog, ...current.filter((s) => s.category === 'custom')]))
      .catch(() => undefined) // the page still works with custom points only
      .finally(() => setCatalogReady(true))
  }, [])

  const regionSites = useMemo(() => sites.filter((s) => regionOf(s) === region), [sites, region])

  useEffect(() => {
    // Until the catalog is in, a planned site from a shared link would look "not in region" and be reset.
    if (!catalogReady) return
    let live = true
    Promise.allSettled(regionSites.map(loadSiteData)).then((res) => {
      if (!live) return
      setData(res.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : [])))
    })
    setPlannedId((id) => regionSites.some((s) => s.id === id) ? id : regionSites[0]?.id ?? null)
    setSelectedId((id) => regionSites.some((s) => s.id === id) ? id : null)
    setMatchIds([])
    return () => { live = false }
  }, [regionSites, catalogReady])

  const landingDate = fromInput(landing)
  const ranked = useMemo(
    () => rank(data.flatMap((d) => evaluate(d, landingDate, days, t) ?? [])),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, landing, days, t],
  )
  const byId = (id: string | null) => ranked.find((s) => s.data.site.id === id) ?? null
  const pick = bestPick(ranked)
  const planned = byId(plannedId)
  const shiftDays = useMemo(
    () => (planned && planned.verdict !== 'GO' ? nearestGoShift(planned.data, landingDate, days, t) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [planned?.data, planned?.verdict, landing, days, t],
  )
  const nearby = useNeighborhood(planned?.data.site.id)
  const spot = useNearbySpot(planned, nearby, landingDate, days, t)
  const plannedBefore = useMemo(
    () => (planned && original ? evaluate(planned.data, fromInput(original), days, t) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [planned?.data, original, days, t],
  )
  const selected = byId(selectedId) ?? ranked[0] ?? null
  const matchList = matchIds.flatMap((id) => byId(id) ?? [])

  // Keep the address bar in sync with the scenario, so "Share" is just the current URL.
  useEffect(() => {
    if (!catalogReady) return
    const customs = sites.filter((s) => s.category === 'custom')
    const ref = (id: string | null) => {
      const i = customs.findIndex((s) => s.id === id)
      return i >= 0 ? `custom-${i}` : id ?? undefined
    }
    const query = buildUrlState({
      region,
      date: landing,
      orig: original || undefined,
      site: ref(plannedId),
      sel: ref(selectedId),
      days: days === DEFAULT_DAYS ? undefined : days,
      light: t.goLight === DEFAULT_THRESHOLDS.goLight ? undefined : t.goLight,
      comm: t.goComm === DEFAULT_THRESHOLDS.goComm ? undefined : t.goComm,
      explain,
      custom: customs.map((s) => ({ lat: String(s.lat), lon: String(s.lon), name: s.name.startsWith('Custom (') ? '' : s.name })),
    })
    window.history.replaceState(null, '', `${window.location.pathname}?${query}`)
  }, [catalogReady, sites, region, landing, original, plannedId, selectedId, days, t, explain])

  function loadDemo() {
    setRegion('south-pole')
    setPlannedId(DEMO.site)
    setSelectedId(null)
    setOriginal(DEMO.original)
    setLanding(DEMO.landing)
    setDays(DEFAULT_DAYS)
    setT(DEFAULT_THRESHOLDS)
    document.getElementById('tactics')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const [minDate, maxDate] = data[0] ? dataRange(data[0]) : [null, null]
  const maxLanding = maxDate ? new Date(maxDate.getTime() - days * 86400000) : null
  const mockEphem = data.some((d) => d.ephem.mock)
  const mockTerrain = data.some((d) => d.mask?.mock)
  // User-entered points have no sources by design; only catalog sites must be sourced.
  const unverifiedSites = sites.some((s) => s.category !== 'custom' && !s.source?.length)

  const toggleMatch = (id: string) =>
    setMatchIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id].slice(-4)))

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>Lunar Landing Site Navigator</h1>
          <p>Launch slipped? Pick the new date and see which landing sites still work.</p>
        </div>
        <div className="header-actions">
          <ShareButton />
          <button className={`explain-toggle${explain ? ' on' : ''}`} onClick={() => setExplain(!explain)} aria-pressed={explain}>
            Explain the math
          </button>
        </div>
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

      <Intro onDemo={loadDemo} />

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
          <label htmlFor="original">Original date (optional, UTC)</label>
          <input
            id="original" type="datetime-local" value={original}
            min={minDate ? toInput(minDate) : undefined}
            max={maxLanding ? toInput(maxLanding) : undefined}
            onChange={(e) => setOriginal(e.target.value)}
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
          <label htmlFor="comm">GO needs Earth in view ≥ <span className="value">{t.goComm}%</span></label>
          <input id="comm" type="range" min={25} max={100} step={5} value={t.goComm} onChange={(e) => setT({ ...t, goComm: +e.target.value })} />
        </div>
      </section>

      {/* Collapsed by default so the results start on the first screen. */}
      <details className="custom-site-details">
        <summary>Try any lunar coordinates (custom site)</summary>
        <CustomSiteForm onAdd={(site) => {
          setSites((current) => [...current, site])
          setRegion(regionOf(site))
          setPlannedId(site.id)
          setSelectedId(site.id)
        }} />
      </details>

      {ranked.length === 0 && data.length > 0 && (
        <p className="section-title">No data for this date range. Pick a date between {minDate && toInput(minDate)} and {maxLanding && toInput(maxLanding)}.</p>
      )}

      <h2 className="section-title" id="tactics">Tactics</h2>
      <p className="section-note">
        GO = the mission averages meet your thresholds. It does not promise continuous sunlight, a working radio link
        or a safe landing.
      </p>
      <TacticsBoard
        ranked={ranked} planned={planned} shiftDays={shiftDays} landing={landingDate} t={t}
        before={plannedBefore} original={original ? fromInput(original) : null} nearby={nearby} spot={spot}
        onTryDate={(d) => setLanding(toInput(d))}
        onSelect={setSelectedId}
      />

      {data.every(({ site }) => regionOf(site) === region) && (
        <LaunchCalendar
          data={data} ranked={ranked} landing={landingDate} days={days} t={t}
          onPick={(date, siteId) => {
            setLanding(toInput(date))
            setPlannedId(siteId)
            setSelectedId(siteId)
          }}
        />
      )}

      <h2 className="section-title">Squad ranking · {REGION_LABELS[region]}</h2>
      <p className="section-note">
        Card stats are scores from 0 to 99, higher is better: <b>LGT</b> sunlight · <b>COM</b> Earth in view ·{' '}
        <b>NGT</b> night survival · <b>SUN</b> time to sunset · <b>ERT</b> time to Earthset · <b>ELV</b> Sun above
        terrain. <b>OVR</b> is their weighted total. Hover a stat for details.
      </p>
      <div className="cards">
        {ranked.map((s, i) => (
          <PlayerCard
            key={s.data.site.id} s={s} rank={i + 1}
            best={s === pick && s.verdict !== 'NO-GO'}
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
        Data: JPL Horizons (Sun/Earth positions), LRO LOLA (terrain). Built for NASA Space Apps 2026 with help from SI tools (see docs/SI_USAGE.md).
      </footer>
    </div>
  )
}
