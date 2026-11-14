import type { Metrics } from './metrics'

export interface Thresholds {
  goLight: number // % sunlight needed for GO
  goComm: number // % Earth visibility needed for GO
}

export const DEFAULT_THRESHOLDS: Thresholds = { goLight: 70, goComm: 50 }

// RISKY band sits below GO: 30 points for light, 25 for comms (defaults give 40% / 25%).
const RISKY_LIGHT_MARGIN = 30
const RISKY_COMM_MARGIN = 25

export type Verdict = 'GO' | 'RISKY' | 'NO-GO'

export function verdictFor(m: Metrics, t: Thresholds): Verdict {
  if (m.lightPct >= t.goLight && m.commPct >= t.goComm) return 'GO'
  if (m.lightPct < t.goLight - RISKY_LIGHT_MARGIN || m.commPct < t.goComm - RISKY_COMM_MARGIN) return 'NO-GO'
  return 'RISKY'
}

export interface Reason {
  text: string
  good: boolean
}

export function formatHours(h: number): string {
  if (h < 48) return `${Math.round(h)} h`
  return `${(h / 24).toFixed(1)} days`
}

/** Plain-language "why" behind a verdict. */
export function reasonsFor(m: Metrics, t: Thresholds): Reason[] {
  const r: Reason[] = [
    {
      text: `Sunlight ${Math.round(m.lightPct)}% of the mission (GO needs ${t.goLight}%)`,
      good: m.lightPct >= t.goLight,
    },
    {
      text: `Earth in view ${Math.round(m.commPct)}% of the time (GO needs ${t.goComm}%)`,
      good: m.commPct >= t.goComm,
    },
  ]
  if (!m.litAtLanding) {
    r.push({
      text: m.sunChangeHours === null
        ? 'Lands in darkness and the Sun never rises during the mission'
        : `Lands in darkness – first sunlight after ${formatHours(m.sunChangeHours)}`,
      good: false,
    })
  } else if (m.sunChangeHours !== null) {
    r.push({ text: `Sun sets ${formatHours(m.sunChangeHours)} after landing`, good: m.sunChangeHours > m.windowHours / 2 })
  } else {
    r.push({ text: 'Sun stays up for the whole mission', good: true })
  }
  if (m.longestDarkHours > 0) {
    r.push({
      text: `Longest darkness: ${formatHours(m.longestDarkHours)} – batteries must survive it`,
      good: m.longestDarkHours <= 48,
    })
  }
  if (!m.earthAtLanding) {
    r.push({
      text: m.earthChangeHours === null
        ? 'Earth never in view during the mission – a relay satellite would be needed'
        : `Earth not in view at landing – it rises after ${formatHours(m.earthChangeHours)}`,
      good: false,
    })
  } else if (m.earthChangeHours !== null) {
    r.push({ text: `Earth sets ${formatHours(m.earthChangeHours)} after landing`, good: m.earthChangeHours > 24 })
  }
  return r
}
