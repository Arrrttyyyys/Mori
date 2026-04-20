/**
 * Per-user data store for Memory Library and Family Space.
 * In production, replace with database (e.g. PostgreSQL, SQLite).
 */

export interface StoredMemory {
  id: number
  image: string // data URL or URL
  title: string
  date: string
}

export interface SessionSummaryItem {
  id: number
  date: string
  topic: string
  summary: string
}

export interface ReflectionItem {
  id: number
  text: string
}

export interface FamilySpaceData {
  session_summaries: SessionSummaryItem[]
  reflections: ReflectionItem[]
}

interface UserData {
  memories: StoredMemory[]
  family_space: FamilySpaceData
}

const defaultFamilySpace: FamilySpaceData = {
  session_summaries: [
    {
      id: 1,
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      topic: 'Summer vacations at the lake house',
      summary: 'Shared memories of summer vacations at the lake house, including details about grandfather\'s fishing trips.',
    },
  ],
  reflections: [
    {
      id: 1,
      text: 'Often speaks fondly of nature and outdoor activities. Seems especially connected to memories involving water.',
    },
  ],
}

const store = new Map<string, UserData>()

function getUserData(userId: string): UserData {
  let data = store.get(userId)
  if (!data) {
    data = {
      memories: [],
      family_space: defaultFamilySpace,
    }
    store.set(userId, data)
  }
  return data
}

// --- Memories ---
export function getMemories(userId: string): StoredMemory[] {
  return [...getUserData(userId).memories]
}

export function addMemory(userId: string, memory: Omit<StoredMemory, 'id'>): StoredMemory {
  const data = getUserData(userId)
  const id = Date.now()
  const newMemory: StoredMemory = { ...memory, id }
  data.memories.unshift(newMemory)
  return newMemory
}

export function deleteMemory(userId: string, memoryId: number): boolean {
  const data = getUserData(userId)
  const idx = data.memories.findIndex((m) => m.id === memoryId)
  if (idx === -1) return false
  data.memories.splice(idx, 1)
  return true
}

// --- Family Space ---
export function getFamilySpace(userId: string): FamilySpaceData {
  const data = getUserData(userId)
  return {
    session_summaries: [...data.family_space.session_summaries],
    reflections: [...data.family_space.reflections],
  }
}

export function setFamilySpace(userId: string, familySpace: FamilySpaceData): void {
  const data = getUserData(userId)
  data.family_space = {
    session_summaries: familySpace.session_summaries ?? [],
    reflections: familySpace.reflections ?? [],
  }
}
