import { NextRequest, NextResponse } from 'next/server'
import { getMemories, addMemory } from '@/lib/user-data-store'

export async function GET(
  _request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }
    const memories = getMemories(userId)
    return NextResponse.json({ memories })
  } catch (error) {
    console.error('Get memories error:', error)
    return NextResponse.json({ error: 'Failed to get memories' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const userId = params.userId
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }
    const body = await request.json()
    const { image, title, date } = body
    if (!title || !date) {
      return NextResponse.json({ error: 'title and date required' }, { status: 400 })
    }
    const memory = addMemory(userId, {
      image: image ?? '',
      title: String(title).trim(),
      date: String(date).trim(),
    })
    return NextResponse.json({ memory })
  } catch (error) {
    console.error('Add memory error:', error)
    return NextResponse.json({ error: 'Failed to add memory' }, { status: 500 })
  }
}
