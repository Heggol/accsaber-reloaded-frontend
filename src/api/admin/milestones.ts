import type { Schema } from '@/components/admin/MilestoneQueryBuilder.vue'
import type {
  ActivateMilestonesRequest,
  AdminMilestoneListParams,
  CreateMilestoneRequest,
  CreateMilestoneSetRequest,
  CreatePrerequisiteRequest,
  LinkMilestoneMapRequest,
  UpdateMilestoneRequest,
  UpdatePrerequisiteRequest,
} from '@/types/api/admin'
import type { MilestoneResponse, MilestoneSetResponse, PrerequisiteLinkResponse } from '@/types/api/milestones'
import type { Page } from '@/types/pagination'
import { del, get, patch, post, put } from '../client'
import { buildQuery } from '../utils'

export function getAdminMilestones(params?: AdminMilestoneListParams): Promise<Page<MilestoneResponse>> {
  return get<Page<MilestoneResponse>>(`/admin/milestones${buildQuery(params)}`)
}

export function createMilestone(req: CreateMilestoneRequest): Promise<MilestoneResponse> {
  return post<MilestoneResponse>('/admin/milestones', req)
}

export function updateMilestone(id: string, req: UpdateMilestoneRequest): Promise<MilestoneResponse> {
  return put<MilestoneResponse>(`/admin/milestones/${id}`, req)
}

export function deactivateMilestone(id: string): Promise<void> {
  return patch<void>(`/admin/milestones/${id}/deactivate`)
}

export function createMilestoneSet(req: CreateMilestoneSetRequest): Promise<MilestoneSetResponse> {
  return post<MilestoneSetResponse>('/admin/milestones/sets', req)
}

export function getMilestoneSchema(): Promise<Schema> {
  return get<Schema>('/admin/milestones/schema')
}

export function activateMilestone(id: string): Promise<MilestoneResponse> {
  return post<MilestoneResponse>(`/admin/milestones/activate/${id}`)
}

export function activateMilestones(ids: string[]): Promise<MilestoneResponse[]> {
  const body: ActivateMilestonesRequest = { milestoneIds: ids }
  return post<MilestoneResponse[]>('/admin/milestones/activate', body)
}

export function backfillMilestone(id: string): Promise<void> {
  return post<void>(`/admin/milestones/${id}/backfill`)
}

export function refreshMilestoneStats(): Promise<void> {
  return post<void>('/admin/milestones/refresh-stats')
}

export function linkMilestoneMaps(id: string, req: LinkMilestoneMapRequest): Promise<void> {
  return post<void>(`/admin/milestones/${id}/map-links`, req)
}

export function unlinkMilestoneMaps(id: string): Promise<void> {
  return del<void>(`/admin/milestones/${id}/map-links`)
}

export function createPrerequisite(req: CreatePrerequisiteRequest): Promise<PrerequisiteLinkResponse> {
  return post<PrerequisiteLinkResponse>('/admin/milestones/prerequisites', req)
}

export function updatePrerequisite(linkId: string, req: UpdatePrerequisiteRequest): Promise<PrerequisiteLinkResponse> {
  return put<PrerequisiteLinkResponse>(`/admin/milestones/prerequisites/${linkId}`, req)
}

export function deletePrerequisite(linkId: string): Promise<void> {
  return del<void>(`/admin/milestones/prerequisites/${linkId}`)
}

export function getAdminPrerequisites(milestoneId: string): Promise<PrerequisiteLinkResponse[]> {
  return get<PrerequisiteLinkResponse[]>(`/admin/milestones/${milestoneId}/prerequisites`)
}
