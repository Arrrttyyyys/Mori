/**
 * Per-user data store for Memory Library and Family Space.
 * In production, replace with database (e.g. PostgreSQL, SQLite).
 */

export interface StoredMemory {
  id: number
  image: string // data URL or URL
  title: string
  date: string
  people?: string[]
  place?: string
  year?: string
  memoryHint?: string
  tags?: string[]
  caregiverPriority?: number
  consentStatus?: 'allowed' | 'review' | 'blocked'
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
      topic: 'Books and family stories',
      summary: 'A previous demo conversation explored favorite childhood books and reading aloud with family.',
    },
  ],
  reflections: [
    {
      id: 1,
      text: 'Family photographs and stories about reading have supported warm, sustained conversation in this fictional demo profile.',
    },
  ],
}

const demoGlobalStore = globalThis as typeof globalThis & { moriUserData?: Map<string, UserData> }
const store = demoGlobalStore.moriUserData ??= new Map<string, UserData>()

const demoMemories: StoredMemory[] = [
  {
    id: 101,
    image: '/images/P1.png',
    title: 'Sunday photo albums',
    date: 'A familiar family afternoon',
    people: ['a family member'],
    place: 'the living room',
    memoryHint: 'Looking through family photographs together',
    tags: ['family', 'photographs', 'living room', 'comforting'],
    caregiverPriority: 0.92,
    consentStatus: 'allowed',
  },
  {
    id: 102,
    image: '/images/FF.png',
    title: 'Everyone together',
    date: 'A family gathering',
    people: ['family and friends'],
    place: 'a sunny family room',
    memoryHint: 'A relaxed gathering with several generations',
    tags: ['family', 'gathering', 'home', 'comforting'],
    caregiverPriority: 0.78,
    consentStatus: 'allowed',
  },
]

function getUserData(userId: string): UserData {
  let data = store.get(userId)
  if (!data) {
    data = {
      memories: demoMemories.map((memory) => ({ ...memory, people: [...(memory.people ?? [])], tags: [...(memory.tags ?? [])] })),
      family_space: {
        session_summaries: defaultFamilySpace.session_summaries.map((item) => ({ ...item })),
        reflections: defaultFamilySpace.reflections.map((item) => ({ ...item })),
      },
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

export function addSessionSummary(
  userId: string,
  summary: Omit<SessionSummaryItem, 'id' | 'date'>
): SessionSummaryItem {
  const data = getUserData(userId)
  const item: SessionSummaryItem = {
    id: Date.now(),
    date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    ...summary,
  }
  data.family_space.session_summaries.unshift(item)
  return item
}

export function addReflection(userId: string, text: string): ReflectionItem {
  const data = getUserData(userId)
  const item = { id: Date.now() + 1, text }
  data.family_space.reflections.unshift(item)
  return item
}

export function resetUserData(userId: string): void {
  store.delete(userId)
}
