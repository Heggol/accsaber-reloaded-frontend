import type { CampaignProgressResponse } from '@/types/api/campaigns'
import type {
  HistoricScoresParams,
  HistoricStatisticsParams,
  LevelResponse,
  ScoreResponse,
  StatsDiffResponse,
  UserCategoryStatisticsResponse,
  UserMilestoneProgressResponse,
  UserResponse,
  UserScoresParams,
} from '@/types/api/users'
import type { Page, PaginationParams } from '@/types/pagination'
import { get } from './client'
import { buildQuery } from './utils'

export function getUser(steamId: string): Promise<UserResponse> {
  return get<UserResponse>(`/users/${steamId}`)
}

export function linkUser(url: string): Promise<UserResponse> {
  return get<UserResponse>(`/users/link${buildQuery({ url })}`)
}

export function getUserScores(
  steamId: string,
  params?: UserScoresParams,
): Promise<Page<ScoreResponse>> {
  return get<Page<ScoreResponse>>(`/users/${steamId}/scores${buildQuery(params)}`)
}

export function getUserLevel(steamId: string): Promise<LevelResponse> {
  return get<LevelResponse>(`/users/${steamId}/level`)
}

export function getUserMilestones(
  steamId: string,
  params?: PaginationParams,
): Promise<Page<UserMilestoneProgressResponse>> {
  return get<Page<UserMilestoneProgressResponse>>(
    `/users/${steamId}/milestones${buildQuery(params)}`,
  )
}

export function getUserCampaignProgress(
  steamId: string,
  campaignId: string,
): Promise<CampaignProgressResponse> {
  return get<CampaignProgressResponse>(`/users/${steamId}/campaigns/${campaignId}/progress`)
}

export function getUserOverallStatistics(
  steamId: string,
): Promise<UserCategoryStatisticsResponse> {
  return get<UserCategoryStatisticsResponse>(`/users/${steamId}/statistics`)
}

export function getUserCategoryStatistics(
  steamId: string,
  category?: string,
): Promise<UserCategoryStatisticsResponse[]> {
  if (category) {
    return get<UserCategoryStatisticsResponse[]>(
      `/users/${steamId}/statistics${buildQuery({ category })}`,
    )
  }
  return get<UserCategoryStatisticsResponse[]>(`/users/${steamId}/statistics/all`)
}

export function getUserHistoricStatistics(
  steamId: string,
  params: HistoricStatisticsParams,
): Promise<UserCategoryStatisticsResponse[]> {
  return get<UserCategoryStatisticsResponse[]>(
    `/users/${steamId}/statistics/historic${buildQuery(params)}`,
  )
}

export function getUserStatsDiff(
  steamId: string,
  category?: string,
): Promise<StatsDiffResponse | null> {
  return get<StatsDiffResponse | undefined>(
    `/users/${steamId}/stats-diff${buildQuery({ category })}`,
  )
    .then((res) => res ?? null)
    .catch(() => null)
}

export function getUserScoresHistoric(
  steamId: string,
  params: HistoricScoresParams,
): Promise<ScoreResponse[]> {
  return get<ScoreResponse[]>(`/users/${steamId}/scores/historic${buildQuery(params)}`)
}
