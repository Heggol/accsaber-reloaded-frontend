import type { MilestoneType } from './enums'

export interface Tab {
  key: string
  label: string
  accentColor?: string
}

export type CategoryCode = string

export interface CategoryInfo {
  code: CategoryCode
  name: string
  accent: string
  tint: string
  tintLight: string
}

export interface TableColumn {
  key: string
  label: string
  sortable?: boolean
  align?: 'left' | 'center' | 'right'
  width?: string
  mono?: boolean
}

export type SortDirection = 'asc' | 'desc'

export interface SortState {
  key: string
  direction: SortDirection
}

export interface PlayerDisplay {
  userId: string
  name: string
  country: string
  avatarUrl: string
  rank: number
  countryRank?: number
  ap: number
  avgAccuracy?: number
  rankedPlays?: number
}

export interface MapDisplay {
  id: string
  difficultyId: string
  songName: string
  artistName: string
  mapperName: string
  coverUrl: string
  complexity: number
  categoryCode: CategoryCode
  difficulty: string
  difficultyLabel: string
  totalScores?: number
  rankedAt?: string
  batchName?: string
}

export interface ScoreDisplay {
  mapId?: string
  mapDifficultyId: string
  mapName: string
  artistName?: string
  difficulty: string
  categoryCode: CategoryCode
  coverUrl?: string
  leaderboardRank: number
  score: number
  scoreNoMods?: number
  accuracy: number
  ap: number
  weightedAp: number
  modifiers: string[]
  date: string
  misses?: number
  badCuts?: number
  maxCombo?: number
  wallHits?: number
  bombHits?: number
  pauses?: number
  streak115?: number
  playCount?: number
  hmd?: string
  xpGained?: number
  rankWhenSet?: number
  blScoreId?: number
  userName?: string
  mapAuthor?: string
}

export interface DifficultyScoreDisplay {
  id: string
  rank: number
  countryRank: number
  userId: string
  userName: string
  avatarUrl: string
  country: string
  accuracy: number
  score: number
  scoreNoMods: number
  ap: number
  weightedAp: number
  modifiers: string[]
  date: string
  blScoreId?: number
  misses: number
  badCuts: number
  maxCombo: number
  wallHits: number
  bombHits: number
  pauses: number
  streak115: number
  playCount: number
  hmd: string
  xpGained: number
  rankWhenSet: number
}

export type MilestoneTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND'

export interface MilestoneDisplay {
  id: string
  title: string
  description: string
  type: MilestoneType
  tier: MilestoneTier
  xp: number
  targetValue: number
  userProgress?: number
  completionPercent: number
  isCompleted?: boolean
  categoryCode?: CategoryCode
}

export interface CampaignDisplay {
  id: string
  name: string
  creator: string
  difficulty: string
  mapCount: number
  description: string
  isVerified: boolean
  completedMaps?: number
}

export interface LevelDisplay {
  level: number
  currentXp: number
  requiredXp: number
}

export interface TimeSeriesPoint {
  timestamp: number
  value: number
}

export type TimeRange = '24h' | '7d' | '14d' | '30d' | '90d' | '1y' | 'all'

export type MetricType = 'ap' | 'avgAccuracy' | 'rankedPlays' | 'rank'

export interface ScoreFeedEntry {
  key: string
  userId: string
  userName: string
  avatarUrl: string
  country: string
  mapId: string
  mapDifficultyId: string
  mapName: string
  artistName: string
  mapAuthor: string
  coverUrl: string
  difficulty: string
  categoryCode: CategoryCode
  rank: number
  score: number
  accuracy: number
  ap: number
  weightedAp: number
  modifiers: string[]
  misses: number
  badCuts: number
  wallHits: number
  bombHits: number
  streak115: number
  timeSet: string
  blScoreId?: number
}

export type ConnectionStatus = 'connected' | 'reconnecting' | 'disconnected'
