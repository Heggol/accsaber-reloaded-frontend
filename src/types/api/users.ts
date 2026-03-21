import type { MilestoneTier, MilestoneType } from '../enums'
import type { PaginationParams } from '../pagination'

export interface UserResponse {
  id: string
  name: string
  avatarUrl: string
  country: string
  createdAt: string
}

export interface ScoreResponse {
  id: string
  userId: string
  userName: string
  avatarUrl: string
  country: string
  mapDifficultyId: string
  mapId: string
  songName: string
  songAuthor: string
  mapAuthor: string
  coverUrl: string
  difficulty: string
  categoryId: string
  score: number
  scoreNoMods: number
  accuracy: number
  rank: number
  countryRank: number
  rankWhenSet: number
  ap: number
  weightedAp: number
  blScoreId: number | null
  maxCombo: number
  badCuts: number
  misses: number
  wallHits: number
  bombHits: number
  pauses: number
  streak115: number
  playCount: number
  hmd: string
  timeSet: string
  reweightDerivative: boolean
  xpGained: number
  modifierIds: string[]
  createdAt: string
}

export interface LeaderboardResponse {
  ranking: number
  countryRanking: number
  userId: string
  userName: string
  country: string
  avatarUrl: string
  ap: number
  averageAcc: number
  averageAp: number
  rankedPlays: number
  topPlayId: string
}

export interface UserCategoryStatisticsResponse {
  id: string
  userId: string
  categoryId: string
  ranking: number
  countryRanking: number
  ap: number
  averageAcc: number
  averageAp: number
  rankedPlays: number
  scoreXp: number
  topPlayId: string
  createdAt: string
}

export interface LevelResponse {
  level: number
  title: string
  totalXp: number
  xpForCurrentLevel: number
  xpForNextLevel: number
  progressPercent: number
}

export interface UserMilestoneProgressResponse {
  milestoneId: string
  title: string
  description: string
  type: MilestoneType
  tier: MilestoneTier
  xp: number
  targetValue: number
  progress: number
  completed: boolean
  completedAt: string | null
  completionPercentage: number
  setId: string
  categoryId: string | null
}

export interface StatsDiffResponse {
  categoryId: string
  apDiff: number
  scoreXpDiff: number
  milestoneXpDiff: number
  milestoneSetBonusXpDiff: number
  averageAccDiff: number
  averageApDiff: number
  rankingDiff: number
  countryRankingDiff: number
  rankedPlaysDiff: number
  from: string
  to: string
}

export interface UserScoresParams extends PaginationParams {
  categoryId?: string
  search?: string
}

export interface HistoricStatisticsParams {
  category: string
  amount: number
  unit: 'h' | 'd' | 'mo'
}

export interface HistoricScoresParams {
  mapDifficultyId: string
  amount?: number
  unit?: 'h' | 'd' | 'w' | 'mo'
}
