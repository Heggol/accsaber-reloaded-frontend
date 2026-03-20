import { get } from './client'

export interface LevelThreshold {
  level: number
  title: string
  createdAt: string
  updatedAt: string
}

export function getLevelThresholds(): Promise<LevelThreshold[]> {
  return get<LevelThreshold[]>('/levels')
}
