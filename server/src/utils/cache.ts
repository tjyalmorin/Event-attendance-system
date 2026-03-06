import redis from '../config/redis.js'

// ── TTL Constants (seconds) ───────────────────────────────────────────────────
export const TTL = {
  SHORT:  parseInt(process.env.REDIS_TTL_SHORT  || '30'),   // 30s  — live event data
  MEDIUM: parseInt(process.env.REDIS_TTL_MEDIUM || '300'),  // 5min — event details
  LONG:   parseInt(process.env.REDIS_TTL_LONG   || '3600'), // 1hr  — branches/teams
}

// ── Cache Key Namespace ───────────────────────────────────────────────────────
export const CK = {
  BRANCHES_ALL:           'branches:all',
  EVENTS_LIST_ADMIN:      'events:list:admin',
  EVENTS_LIST_STAFF:      (userId: string)   => `events:list:staff:${userId}`,
  EVENT_DETAIL:           (eventId: number)  => `events:detail:${eventId}`,
  PARTICIPANTS_EVENT:     (eventId: number)  => `participants:event:${eventId}`,
  EVENT_STAFF:            (eventId: number)  => `events:staff:${eventId}`,
}

// ── Is Redis Available? ───────────────────────────────────────────────────────
const isRedisReady = (): boolean => redis.status === 'ready'

// ── Get ───────────────────────────────────────────────────────────────────────
export const cacheGet = async <T>(key: string): Promise<T | null> => {
  if (!isRedisReady()) return null
  try {
    const raw = await redis.get(key)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch (err: any) {
    console.warn(`⚠️  Cache GET failed [${key}]:`, err.message)
    return null
  }
}

// ── Set ───────────────────────────────────────────────────────────────────────
export const cacheSet = async (key: string, value: unknown, ttl: number): Promise<void> => {
  if (!isRedisReady()) return
  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttl)
  } catch (err: any) {
    console.warn(`⚠️  Cache SET failed [${key}]:`, err.message)
  }
}

// ── Delete Single ─────────────────────────────────────────────────────────────
export const cacheDel = async (...keys: string[]): Promise<void> => {
  if (!isRedisReady() || keys.length === 0) return
  try {
    await redis.del(...keys)
  } catch (err: any) {
    console.warn(`⚠️  Cache DEL failed [${keys.join(', ')}]:`, err.message)
  }
}

// ── Delete by Pattern ─────────────────────────────────────────────────────────
// Use sparingly — SCAN is safe but still costs round-trips
export const cacheDelPattern = async (pattern: string): Promise<void> => {
  if (!isRedisReady()) return
  try {
    const keys = await redis.keys(pattern)
    if (keys.length > 0) await redis.del(...keys)
  } catch (err: any) {
    console.warn(`⚠️  Cache DEL pattern failed [${pattern}]:`, err.message)
  }
}

// ── Invalidate all event-related keys ────────────────────────────────────────
export const invalidateEventCache = async (event_id?: number): Promise<void> => {
  const ops: Promise<void>[] = [
    cacheDel(CK.EVENTS_LIST_ADMIN),
    cacheDelPattern('events:list:staff:*'),
  ]
  if (event_id) {
    ops.push(cacheDel(CK.EVENT_DETAIL(event_id)))
    ops.push(cacheDel(CK.EVENT_STAFF(event_id)))
  }
  await Promise.all(ops)
}

// ── Invalidate participant cache for an event ─────────────────────────────────
export const invalidateParticipantCache = async (event_id: number): Promise<void> => {
  await cacheDel(CK.PARTICIPANTS_EVENT(event_id))
}