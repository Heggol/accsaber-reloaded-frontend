import type { BatchStatus, MapDifficultyStatus, StaffRole, StaffUserStatus, VoteType } from '../enums'

export interface CreateStaffUserRequest {
  username: string
  email: string
  password: string
  role: StaffRole
}

export interface UpdateStaffRoleRequest {
  role: StaffRole
}

export interface UpdateStaffStatusRequest {
  status: StaffUserStatus
}

export interface UpdateStaffActiveRequest {
  active: boolean
}

export interface LinkUserRequest {
  userId: string
}

export interface ForceChangePasswordRequest {
  newPassword: string
}

export interface OAuthLinkRequest {
  provider: string
  providerId: string
}

export interface StaffUserResponse {
  id: string
  username: string
  email: string
  role: StaffRole
  status: StaffUserStatus
  active: boolean
  userId: string | null
  oauthLinks: StaffOAuthLinkResponse[]
  createdAt: string
}

export interface StaffOAuthLinkResponse {
  id: string
  provider: string
  providerId: string
  createdAt: string
}

export interface ImportMapFromLeaderboardIdsRequest {
  ssLeaderboardId?: number
  blLeaderboardId?: number
}

export interface UpdateMapStatusRequest {
  status: MapDifficultyStatus
}

export interface UpdateMapComplexityRequest {
  complexity: number
}

export interface CreateBatchRequest {
  name: string
  description?: string
}

export interface UpdateBatchStatusRequest {
  status: BatchStatus
}

export interface CastVoteRequest {
  mapDifficultyId: string
  vote: boolean
  type: VoteType
  suggestedComplexity?: number
  criteriaVote?: boolean
  reason?: string
}

export interface ApproveReweightRequest {
  complexity: number
}

export interface BulkReweightRequest {
  difficulties: { id: string; complexity: number }[]
}

export interface ApproveUnrankRequest {
  mapDifficultyId: string
}

export interface BulkUnrankRequest {
  mapDifficultyIds: string[]
}
export interface DuplicateCandidateResponse {
  primaryUserId: string
  primaryUserName: string
  secondaryUserId: string
  secondaryUserName: string
  country: string
  identicalScores: number
  primaryTotalScores: number
  secondaryTotalScores: number
}

export interface DuplicateLinkResponse {
  id: string
  primaryUserId: string
  primaryUserName: string
  secondaryUserId: string
  secondaryUserName: string
  merged: boolean
  mergedAt: string | null
  reason: string | null
  createdAt: string
}

export interface CreateDuplicateLinkRequest {
  primaryUserId: string
  secondaryUserId: string
  reason?: string
}

export interface MergeDuplicateRequest {
  primaryUserId: string
  secondaryUserId: string
  reason?: string
}
export interface CreateCurveRequest {
  name: string
  type: 'FORMULA' | 'POINT_LOOKUP'
  formula?: string
  xParameterName?: string
  xParameterValue?: number
  yParameterName?: string
  yParameterValue?: number
  zParameterName?: string
  zParameterValue?: number
  scale?: number
  shift?: number
}

export type UpdateCurveRequest = Partial<CreateCurveRequest>

export interface CreateMilestoneRequest {
  setId: string
  categoryId?: string
  title: string
  description: string
  type: string
  tier: string
  xp: number
  querySpec: Record<string, unknown>
  targetValue: number
  comparison: string
  blExclusive?: boolean
  mapDifficultyIds?: string[]
}

export interface LinkMilestoneMapRequest {
  mapDifficultyIds: string[]
}

export interface UpdateMilestoneRequest {
  title?: string
  description?: string
}

export interface CreateMilestoneSetRequest {
  title: string
  description: string
  setBonusXp: number
}

export interface CreatePrerequisiteRequest {
  milestoneId: string
  prerequisiteMilestoneId: string
  blocker: boolean
}

export interface UpdatePrerequisiteRequest {
  blocker: boolean
}

export type { ActivateMilestonesRequest, AdminMilestoneListParams } from './milestones'

export interface CreateCampaignRequest {
  name: string
  description: string
  difficulty: string
  verified?: boolean
}

export interface UpdateCampaignRequest {
  name?: string
  description?: string
  difficulty?: string
  verified?: boolean
}

export interface AddCampaignMapRequest {
  mapDifficultyId: string
  accuracyRequirement: number
  xp: number
  prerequisiteMapIds?: string[]
}
