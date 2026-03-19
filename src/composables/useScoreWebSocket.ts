import type { ScoreResponse } from '@/types/api/users'
import type { ConnectionStatus, ScoreFeedEntry } from '@/types/display'
import { formatDifficulty } from '@/utils/mappers'
import { useCategoryStore } from '@/stores/categories'
import { useModifierStore } from '@/stores/modifiers'
import { onUnmounted, ref, type Ref } from 'vue'

const MAX_ENTRIES = 50
const INITIAL_RETRY_MS = 1000
const MAX_RETRY_MS = 30000

function buildWsUrl(): string {
  const wsBase: string = import.meta.env.VITE_WS_BASE ?? ''
  if (wsBase) return wsBase

  const apiBase: string = import.meta.env.VITE_API_BASE ?? ''
  try {
    const parsed = new URL(apiBase)
    const wsProtocol = parsed.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${wsProtocol}//${parsed.host}/ws/scores`
  } catch {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${wsProtocol}//${window.location.host}/ws/scores`
  }
}

interface UseScoreWebSocketReturn {
  scores: Ref<ScoreFeedEntry[]>
  status: Ref<ConnectionStatus>
  connect: () => void
  disconnect: () => void
}

export function useScoreWebSocket(): UseScoreWebSocketReturn {
  const scores = ref<ScoreFeedEntry[]>([])
  const status = ref<ConnectionStatus>('disconnected')

  const categoryStore = useCategoryStore()
  const modifierStore = useModifierStore()

  let ws: WebSocket | null = null
  let retryMs = INITIAL_RETRY_MS
  let retryTimeout: ReturnType<typeof setTimeout> | null = null
  let entryCounter = 0
  let disposed = false

  function toFeedEntry(raw: ScoreResponse): ScoreFeedEntry {
    const categoryCode = categoryStore.getCategoryCode(raw.categoryId) ?? 'overall'
    const modifiers = modifierStore.resolveModifierCodes(raw.modifierIds ?? [])

    return {
      key: `${raw.id}-${entryCounter++}`,
      userId: raw.userId,
      userName: raw.userName,
      avatarUrl: raw.avatarUrl,
      country: raw.country,
      mapId: raw.mapId,
      mapDifficultyId: raw.mapDifficultyId,
      mapName: raw.songName ?? 'Unknown',
      artistName: raw.songAuthor ?? '',
      mapAuthor: raw.mapAuthor ?? '',
      coverUrl: raw.coverUrl ?? '',
      difficulty: formatDifficulty(raw.difficulty as 'EASY' | 'NORMAL' | 'HARD' | 'EXPERT' | 'EXPERT_PLUS'),
      categoryCode,
      rank: raw.rank,
      score: raw.score,
      accuracy: raw.accuracy,
      ap: raw.ap,
      weightedAp: raw.weightedAp,
      modifiers,
      misses: raw.misses ?? 0,
      badCuts: raw.badCuts ?? 0,
      wallHits: raw.wallHits ?? 0,
      bombHits: raw.bombHits ?? 0,
      streak115: raw.streak115 ?? 0,
      timeSet: raw.timeSet ?? raw.createdAt,
      blScoreId: raw.blScoreId ?? undefined,
    }
  }

  function onMessage(event: MessageEvent) {
    try {
      const data = JSON.parse(event.data) as ScoreResponse
      const entry = toFeedEntry(data)
      scores.value = [entry, ...scores.value].slice(0, MAX_ENTRIES)
    } catch {
    }
  }

  function scheduleReconnect() {
    if (disposed || retryTimeout) return
    status.value = 'reconnecting'
    retryTimeout = setTimeout(() => {
      retryTimeout = null
      if (!disposed) connect()
    }, retryMs)
    retryMs = Math.min(retryMs * 2, MAX_RETRY_MS)
  }

  function connect() {
    if (ws) return
    disposed = false
    try {
      ws = new WebSocket(buildWsUrl())

      ws.addEventListener('open', () => {
        if (disposed) { ws?.close(); return }
        status.value = 'connected'
        retryMs = INITIAL_RETRY_MS
      })

      ws.addEventListener('message', onMessage)

      ws.addEventListener('close', () => {
        ws = null
        if (!disposed) scheduleReconnect()
      })

      ws.addEventListener('error', () => {
        ws?.close()
      })
    } catch {
      ws = null
      if (!disposed) scheduleReconnect()
    }
  }

  function disconnect() {
    disposed = true
    if (retryTimeout) {
      clearTimeout(retryTimeout)
      retryTimeout = null
    }
    if (ws) {
      ws.close()
      ws = null
    }
    status.value = 'disconnected'
  }

  onUnmounted(disconnect)

  return { scores, status, connect, disconnect }
}
