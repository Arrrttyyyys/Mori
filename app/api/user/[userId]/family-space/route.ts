import { NextRequest, NextResponse } from 'next/server'
import { getFamilySpace, setFamilySpace } from '@/lib/user-data-store'

export async function GET(
  _request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }
    const family_space = getFamilySpace(userId)
    return NextResponse.json({ family_space })
  } catch (error) {
    console.error('Get family space error:', error)
    return NextResponse.json({ error: 'Failed to get family space' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const userId = params.userId
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }
    const body = await request.json()
    const session_summaries = body.session_summaries ?? []
    const reflections = body.reflections ?? []
    setFamilySpace(userId, { session_summaries, reflections })
    const family_space = getFamilySpace(userId)
    return NextResponse.json({ family_space })
  } catch (error) {
    console.error('Set family space error:', error)
    return NextResponse.json({ error: 'Failed to set family space' }, { status: 500 })
  }
}
