import type { MilestoneTier } from '../display'
import type { MilestoneComparison, MilestoneStatus, MilestoneType } from '../enums'
import type { PaginationParams } from '../pagination'

export interface MilestoneResponse {
  id: string
  setId: string
  categoryId: string | null
  title: string
  description: string
  type: MilestoneType
  tier: MilestoneTier
  xp: number
  querySpec: Record<string, unknown>
  targetValue: number
  comparison: MilestoneComparison
  status: MilestoneStatus
  completionPercentage: number
  blExclusive: boolean
  completions: number
  totalPlayers: number
  createdAt: string
}

export interface MilestoneSetResponse {
  id: string
  title: string
  description: string
  setBonusXp: number
  createdAt: string
  userCompletionPercentage?: number
}

export interface MilestoneCompletionResponse {
  milestoneId: string
  title: string
  description: string
  type: MilestoneType
  tier: MilestoneTier
  xp: number
  targetValue: number
  comparison: MilestoneComparison
  setId: string
  categoryId: string | null
  blExclusive: boolean
  completions: number
  totalPlayers: number
  completionPercentage: number
  userProgress?: number
  userCompleted?: boolean
  userCompletedAt?: string
  achievedWithScoreId?: string
  score?: number
  maxScore?: number
  coverUrl?: string
  difficulty?: string
  songName?: string
  songAuthor?: string
  mapAuthor?: string
}

export interface MilestoneListParams extends PaginationParams {
  setId?: string
  categoryId?: string
  type?: MilestoneType
}

export interface AdminMilestoneListParams extends MilestoneListParams {
  status?: MilestoneStatus
}

export interface PrerequisiteLinkResponse {
  id: string
  milestoneId: string
  prerequisiteMilestoneId: string
  prerequisiteTitle: string
  prerequisiteTier: string
  blocker: boolean
  createdAt: string
}

export interface ActivateMilestonesRequest {
  milestoneIds: string[]
}
