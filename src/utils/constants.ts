import type { MetricType, TimeRange } from '@/types/display';

export const TIME_RANGE_PARAMS: Record<TimeRange, { amount: number; unit: 'h' | 'd' | 'w' | 'mo' }> = {
  '24h': { amount: 24, unit: 'h' },
  '7d': { amount: 7, unit: 'd' },
  '14d': { amount: 14, unit: 'd' },
  '30d': { amount: 30, unit: 'd' },
  '90d': { amount: 90, unit: 'd' },
  '1y': { amount: 12, unit: 'mo' },
  'all': { amount: 120, unit: 'mo' },
}

export const DIFFICULTY_ORDER = ['EASY', 'NORMAL', 'HARD', 'EXPERT', 'EXPERT_PLUS'] as const

export const ROLE_ORDER: Record<string, number> = {
  ADMIN: 0,
  DEVELOPER: 1,
  MODERATOR: 2,
  HEAD_RANKING: 3,
  RANKING: 4,
}

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin',
  DEVELOPER: 'Developer',
  MODERATOR: 'Moderator',
  HEAD_RANKING: 'Head Ranking',
  RANKING: 'Ranking',
}


export const SCORE_DETAIL_METRICS: { key: MetricType; label: string }[] = [
  { key: 'accuracy' as MetricType, label: 'Accuracy' },
  { key: 'ap' as MetricType, label: 'AP' },
  { key: 'xpCumulative', label: 'XP (Cumulative)' },
  { key: 'xpPerAttempt', label: 'XP (Per Attempt)' },
]

export const MAP_STATS_METRICS: { key: MetricType; label: string }[] = [
  { key: 'ap', label: 'Max AP' },
  { key: 'avgAccuracy', label: 'Avg Accuracy' },
  { key: 'rankedPlays', label: 'Total Scores' },
]

export const TIER_COLORS: Record<string, string> = {
  BRONZE: 'var(--tier-bronze)',
  SILVER: 'var(--tier-silver)',
  GOLD: 'var(--tier-gold)',
  PLATINUM: 'var(--tier-platinum)',
  DIAMOND: 'var(--tier-diamond)',
}

export const TIER_ORDER: Record<string, number> = {
  BRONZE: 0, bronze: 0,
  SILVER: 1, silver: 1,
  GOLD: 2, gold: 2,
  PLATINUM: 3, platinum: 3,
  DIAMOND: 4, diamond: 4,
}

export const TIER_SCALES: Record<string, number> = {
  BRONZE: 0.8,
  SILVER: 0.9,
  GOLD: 1.0,
  PLATINUM: 1.15,
  DIAMOND: 1.3,
}

export function tierColor(tier: string): string {
  return TIER_COLORS[tier.toUpperCase()] ?? 'var(--text-tertiary)'
}

export function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

export function formatPercent(value: number, decimals = 1): string {
  if (value >= 100) return '100'
  if (value <= 0) return '0'
  const formatted = value.toFixed(decimals)
  if (formatted === (100).toFixed(decimals)) {
    return (100 - Math.pow(10, -decimals)).toFixed(decimals)
  }
  if (formatted === (0).toFixed(decimals)) {
    for (let d = decimals + 1; d <= 10; d++) {
      const attempt = value.toFixed(d)
      if (parseFloat(attempt) > 0) return attempt
    }
  }
  return formatted
}

export function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297
  return x - Math.floor(x)
}
