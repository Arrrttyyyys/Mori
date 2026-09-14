import { NextRequest, NextResponse } from 'next/server'
import { authErrorResponse, requireRequestIdentity } from '@/lib/auth/server-auth'

const allowedTypes = /^(image\/(jpeg|png|gif|webp)|audio\/(mpeg|wav|mp4)|video\/(mp4|webm))$/
const allowedExtensions = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp3', 'wav', 'm4a', 'mp4', 'webm'])

export async function POST(request: NextRequest) {
  try {
    const identity = await requireRequestIdentity(request)
    if (identity.mode === 'demo') return NextResponse.json({ error: 'Demo media is read-only' }, { status: 403 })
    const form = await request.formData()
    const file = form.get('file')
    if (!(file instanceof File) || file.size < 1 || file.size > 50 * 1024 * 1024 || !allowedTypes.test(file.type)) return NextResponse.json({ error: 'Choose a supported file up to 50 MB' }, { status: 400 })
    const candidate = file.name.split('.').pop()?.toLowerCase() || ''
    const extension = allowedExtensions.has(candidate) ? candidate : 'bin'
    const path = `${identity.actorId}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${extension}`
    const { error } = await identity.client.storage.from('memories').upload(path, file, { contentType: file.type, upsert: false })
    if (error) throw error
    const signed = await identity.client.storage.from('memories').createSignedUrl(path, 3600)
    if (signed.error) {
      await identity.client.storage.from('memories').remove([path])
      throw signed.error
    }
    return NextResponse.json({ path, url: signed.data.signedUrl }, { status: 201 })
  } catch (error) {
    return authErrorResponse(error) ?? NextResponse.json({ error: 'Storage upload failed' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const identity = await requireRequestIdentity(request)
    if (identity.mode === 'demo') return NextResponse.json({ error: 'Demo media is read-only' }, { status: 403 })
    const body = await request.json().catch(() => ({}))
    if (typeof body.path !== 'string' || !body.path.startsWith(`${identity.actorId}/`)) return NextResponse.json({ error: 'Invalid storage path' }, { status: 400 })
    const { error } = await identity.client.storage.from('memories').remove([body.path])
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (error) {
    return authErrorResponse(error) ?? NextResponse.json({ error: 'Storage deletion failed' }, { status: 500 })
  }
}
