import type { Metrics } from './metrics'

// Player-card stats, each 0–99.
export interface Stats {
  LGT: number // sunlight share
  COM: number // Earth visibility share
  NGT: number // night survival: shorter longest-dark is better
  SUN: number // time before sunset (99 if it never sets)
  ERT: number // time before Earthset
  ELV: number // sun height above terrain while lit
}

export const STAT_LABELS: Record<keyof Stats, string> = {
  LGT: 'Sunlight',
  COM: 'Earth in view',
  NGT: 'Night survival',
  SUN: 'Time to sunset',
  ERT: 'Time to Earthset',
  ELV: 'Sun above terrain',
}

export const STAT_HELP: Record<keyof Stats, string> = {
  LGT: 'Mission average of how much of the solar disk is above the terrain (modeled sunlight, not electrical power).',
  COM: 'Share of the mission any part of Earth is above the terrain – line of sight for a direct link, not a radio link budget.',
  NGT: 'How short the longest dark stretch is. 99 = never dark; 0 = dark the whole mission.',
  SUN: 'How long after landing the Sun stays up. 0 = you land in darkness.',
  ERT: 'How long after landing Earth stays in view. 0 = Earth not in view at touchdown.',
  ELV: 'How far the Sun clears the terrain on average while lit. Low Sun = long shadows and weak flat panels.',
}

const WEIGHTS: Record<keyof Stats, number> = { LGT: 0.35, COM: 0.25, NGT: 0.2, SUN: 0.1, ERT: 0.05, ELV: 0.05 }

const cap = (x: number) => Math.round(Math.min(99, Math.max(0, x)))

function untilChange(atStart: boolean, change: number | null, window: number): number {
  if (!atStart) return 0
  return change === null ? 99 : (99 * change) / window
}

export function statsFor(m: Metrics): Stats {
  return {
    LGT: cap(m.lightPct),
    COM: cap(m.commPct),
    NGT: cap(99 * (1 - m.longestDarkHours / m.windowHours)),
    SUN: cap(untilChange(m.litAtLanding, m.sunChangeHours, m.windowHours)),
    ERT: cap(untilChange(m.earthAtLanding, m.earthChangeHours, m.windowHours)),
    // sin() so 30° already scores ~50: horizontal panels lose cos-loss fast near the horizon
    ELV: cap(99 * Math.sin((Math.min(90, m.meanSunClearanceLit) * Math.PI) / 180)),
  }
}

export function overall(s: Stats): number {
  return cap((Object.keys(WEIGHTS) as (keyof Stats)[]).reduce((sum, k) => sum + WEIGHTS[k] * s[k], 0))
}
