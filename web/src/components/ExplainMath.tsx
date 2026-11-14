import {
  flatPanelPct, hillAngle, maxSunElevation, nominalEarthElevation, SUN_DEG_PER_DAY, sunriseHours, sunriseRateDegPerDay,
  verticalPanelPct,
} from '../lib/explain'
import type { Scenario } from '../lib/tactics'
import { formatHours } from '../lib/verdict'

const f1 = (x: number) => x.toFixed(1)

/** "Coach notes": the math behind this site's numbers, with this site's values plugged in. */
export function ExplainMath({ s }: { s: Scenario }) {
  const { site, ephem, mask } = s.data
  const m = s.metrics
  const win = (arr: number[]) => arr.slice(m.startIdx, m.startIdx + m.sunFrac.length)
  const sunPeak = Math.max(...win(ephem.sun.el))
  const earthEls = win(ephem.earth.el)
  const earthMin = Math.min(...earthEls)
  const earthMax = Math.max(...earthEls)
  const absLat = Math.abs(site.lat)
  const theoryMax = maxSunElevation(site.lat)
  const terrainMax = mask ? Math.max(...mask.mask_el_deg) : 0
  // geometric elevation above the level horizon – what a panel actually sees (not the clearance above terrain)
  const sunEl = Math.max(0, m.meanSunElevationLit)
  const polar = absLat > 75

  return (
    <div className="coach">
      <h3>🎓 Coach notes – the math behind {site.name}</h3>

      <div className="note">
        <h4>1 · How high can the Sun get here?</h4>
        <code>max Sun height ≈ 90° − |latitude| + 1.5° = 90° − {f1(absLat)}° + 1.5° = {f1(theoryMax)}°</code>
        <p>
          During this mission it peaks at <b>{f1(sunPeak)}°</b>.{' '}
          {polar
            ? 'The Moon’s axis is tilted only 1.5°, so near the pole the Sun never climbs – it circles the horizon like a lighthouse beam.'
            : 'Close to the equator the Sun climbs high overhead, just like noon in the tropics on Earth.'}
        </p>
      </div>

      <div className="note">
        <h4>2 · Why a hill can steal the Sun</h4>
        <code>hill angle = atan(height ÷ distance) − distance ÷ (2 · R_moon)</code>
        <p>
          Example: a 1 km hill 30 km away rises {f1(hillAngle(1, 30))}° above the horizon
          (the second term is the Moon’s curvature, R_moon = 1737 km). The Sun’s disk is only 0.53° wide.
          {mask && <> Highest terrain around this site: <b>{f1(terrainMax)}°</b> vs. Sun peak <b>{f1(sunPeak)}°</b>.</>}
          {mask && terrainMax >= sunPeak && ' The terrain is taller than the Sun ever gets – some directions are in shadow all the time.'}
        </p>
      </div>

      <div className="note">
        <h4>3 · Sun height → panel geometry</h4>
        <code>flat panel ∝ sin(elevation) · vertical panel facing the Sun ∝ cos(elevation)</code>
        <p>
          Average Sun elevation here while lit, above the level horizon: <b>{f1(sunEl)}°</b>. The ideal geometric factor
          is <b>{Math.round(flatPanelPct(sunEl))}%</b> for a flat panel and <b>{Math.round(verticalPanelPct(sunEl))}%</b> for
          a vertical one turned toward the Sun – before losses, dust or temperature, so not the mission's electrical power.
          {polar && ' That is why polar landers stand their solar panels upright.'}
        </p>
      </div>

      <div className="note">
        <h4>4 · Why Earth comes and goes</h4>
        <code>Earth height ≈ asin(cos(lat) · cos(lon)) = {f1(nominalEarthElevation(site.lat, site.lon))}°</code>
        <p>
          The Moon always shows Earth the same face, so Earth hangs almost still in the sky. But the Moon wobbles
          (libration) by up to ±7°, so Earth rocks up and down: during this mission between <b>{f1(earthMin)}°</b> and{' '}
          <b>{f1(earthMax)}°</b>. When it dips below the terrain, the line of sight for a direct-to-Earth link is lost – here
          some part of Earth is in view {Math.round(m.commPct)}% of the time (geometry only, not a radio link budget).
        </p>
      </div>

      <div className="note">
        <h4>5 · How we score sunlight</h4>
        <code>Light % = Σ (visible part of the Sun’s disk, 0…1) ÷ number of hours = {Math.round(m.lightPct)}%</code>
        <p>
          A lunar day lasts 29.5 Earth days, so the Sun's hour angle moves only {f1(SUN_DEG_PER_DAY)}° per day. While
          rising, it climbs that rate × cos(latitude) = <b>{sunriseRateDegPerDay(site.lat).toFixed(2)}° per day</b> here, so
          the whole 0.53° disk needs about <b>{formatHours(sunriseHours(site.lat))}</b> to clear a flat horizon
          (about 1 hour at the equator; terrain changes it). One slow sunset can mean two weeks of night.
        </p>
      </div>
    </div>
  )
}
