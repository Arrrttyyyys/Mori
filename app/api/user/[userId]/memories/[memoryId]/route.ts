import { NextRequest, NextResponse } from 'next/server'
import { deleteMemory } from '@/lib/user-data-store'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { userId: string; memoryId: string } }
) {
  try {
    const userId = params.userId
    const memoryId = parseInt(params.memoryId, 10)
    if (!userId || isNaN(memoryId)) {
      return NextResponse.json({ error: 'userId and memoryId required' }, { status: 400 })
    }
    const deleted = deleteMemory(userId, memoryId)
    if (!deleted) {
      return NextResponse.json({ error: 'Memory not found' }, { status: 404 })
    }
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Delete memory error:', error)
    return NextResponse.json({ error: 'Failed to delete memory' }, { status: 500 })
  }
}
