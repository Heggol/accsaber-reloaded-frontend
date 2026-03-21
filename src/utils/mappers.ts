import type { MapDifficultyResponse } from '@/types/api/maps'
import type { MilestoneCompletionResponse } from '@/types/api/milestones'
import type { LeaderboardResponse, ScoreResponse, UserMilestoneProgressResponse } from '@/types/api/users'
import type { CategoryCode, DifficultyScoreDisplay, MapDisplay, MilestoneDisplay, PlayerDisplay, ScoreDisplay } from '@/types/display'

export function formatDifficulty(diff: string): string {
  switch (diff) {
    case 'EASY': return 'Easy'
    case 'NORMAL': return 'Normal'
    case 'HARD': return 'Hard'
    case 'EXPERT': return 'Expert'
    case 'EXPERT_PLUS': return 'Expert+'
    default: return diff
  }
}

export function toPlayerDisplay(entry: LeaderboardResponse): PlayerDisplay {
  return {
    userId: entry.userId,
    name: entry.userName,
    country: entry.country,
    avatarUrl: entry.avatarUrl,
    rank: entry.ranking,
    countryRank: entry.countryRanking,
    ap: entry.ap,
    avgAccuracy: entry.averageAcc,
    rankedPlays: entry.rankedPlays,
  }
}

export function toScoreDisplay(
  score: ScoreResponse,
  modifierNames: string[],
  categoryCode?: CategoryCode,
): ScoreDisplay {
  return {
    mapId: score.mapId,
    mapDifficultyId: score.mapDifficultyId,
    mapName: score.songName ?? 'Unknown Map',
    artistName: score.songAuthor,
    difficulty: formatDifficulty(score.difficulty),
    categoryCode: categoryCode ?? 'overall',
    coverUrl: score.coverUrl,
    leaderboardRank: score.rank,
    score: score.score,
    scoreNoMods: score.scoreNoMods,
    accuracy: score.accuracy,
    ap: score.ap,
    weightedAp: score.weightedAp,
    modifiers: modifierNames,
    date: score.timeSet,
    misses: score.misses ?? undefined,
    badCuts: score.badCuts ?? undefined,
    maxCombo: score.maxCombo ?? undefined,
    wallHits: score.wallHits ?? undefined,
    bombHits: score.bombHits ?? undefined,
    pauses: score.pauses ?? undefined,
    streak115: score.streak115 ?? undefined,
    playCount: score.playCount ?? undefined,
    hmd: score.hmd ?? undefined,
    xpGained: score.xpGained ?? undefined,
    rankWhenSet: score.rankWhenSet ?? undefined,
    blScoreId: score.blScoreId ?? undefined,
    mapAuthor: score.mapAuthor,
  }
}

export function toMapDisplay(
  diff: MapDifficultyResponse,
  getCategoryCode: (id: string) => CategoryCode | undefined,
): MapDisplay {
  return {
    id: diff.mapId,
    difficultyId: diff.id,
    songName: diff.songName,
    artistName: diff.songAuthor,
    mapperName: diff.mapAuthor,
    coverUrl: diff.coverUrl,
    complexity: diff.complexity,
    categoryCode: getCategoryCode(diff.categoryId) ?? 'overall',
    difficulty: diff.difficulty,
    difficultyLabel: formatDifficulty(diff.difficulty),
    totalScores: diff.statistics?.totalScores,
    rankedAt: diff.rankedAt ?? undefined,
  }
}

export function toDifficultyScoreDisplay(
  score: ScoreResponse,
  modifierNames: string[],
): DifficultyScoreDisplay {
  return {
    id: score.id,
    rank: score.rank,
    countryRank: score.countryRank,
    userId: score.userId,
    userName: score.userName,
    avatarUrl: score.avatarUrl,
    country: score.country,
    accuracy: score.accuracy,
    score: score.score,
    scoreNoMods: score.scoreNoMods,
    ap: score.ap,
    weightedAp: score.weightedAp,
    modifiers: modifierNames,
    date: score.timeSet,
    blScoreId: score.blScoreId ?? undefined,
    misses: score.misses,
    badCuts: score.badCuts,
    maxCombo: score.maxCombo,
    wallHits: score.wallHits,
    bombHits: score.bombHits,
    pauses: score.pauses,
    streak115: score.streak115,
    playCount: score.playCount,
    hmd: score.hmd,
    xpGained: score.xpGained,
    rankWhenSet: score.rankWhenSet,
  }
}

export function toMilestoneDisplay(
  m: UserMilestoneProgressResponse,
  categoryCode?: CategoryCode,
): MilestoneDisplay {
  return {
    id: m.milestoneId,
    title: m.title,
    description: m.description,
    type: m.type,
    tier: m.tier,
    xp: m.xp,
    targetValue: m.targetValue,
    userProgress: m.progress,
    completionPercent: m.completionPercentage,
    isCompleted: m.completed,
    categoryCode,
  }
}

export function toMilestoneCompletion(
  m: UserMilestoneProgressResponse,
): MilestoneCompletionResponse {
  return {
    milestoneId: m.milestoneId,
    title: m.title,
    description: m.description,
    type: m.type,
    tier: m.tier,
    xp: m.xp,
    targetValue: m.targetValue,
    comparison: 'GTE',
    setId: m.setId,
    categoryId: m.categoryId,
    blExclusive: false,
    completions: 0,
    totalPlayers: 0,
    completionPercentage: m.completionPercentage,
    userCompleted: m.completed,
    userCompletedAt: m.completedAt ?? undefined,
  }
}
