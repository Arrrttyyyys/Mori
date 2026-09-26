import { NextRequest, NextResponse } from 'next/server'
import { authErrorResponse, requireRequestIdentity } from '@/lib/auth/server-auth'
import { createAdminServerClient } from '@/lib/supabase/server'
import { MAX_ACCOUNT_FILES, MAX_ACCOUNT_STORAGE_BYTES, secureUpload } from '@/lib/uploads/security'

export async function POST(request: NextRequest) {
  try {
    const identity = await requireRequestIdentity(request)
    if (identity.mode === 'demo') return NextResponse.json({ error: 'Demo media is read-only' }, { status: 403 })
    const form = await request.formData()
    const file = form.get('file')
    if (!(file instanceof File)) return NextResponse.json({ error: 'Choose a supported file' }, { status: 400 })
    const admin = createAdminServerClient()
    const { data: quota, error: quotaError } = await admin.rpc('consume_mori_upload_quota', { p_owner_id: identity.actorId, p_window_limit: 20 })
    if (quotaError) throw quotaError
    const quotaResult = quota as { allowed?: boolean; retry_after?: number }
    if (!quotaResult.allowed) return NextResponse.json({ error: 'Too many uploads. Please wait a minute and try again.' }, { status: 429, headers: { 'Retry-After': String(quotaResult.retry_after ?? 60) } })
    const { data: existing, error: listError } = await identity.client.storage.from('memories').list(identity.actorId, { limit: MAX_ACCOUNT_FILES + 1 })
    if (listError) throw listError
    const usedBytes = (existing ?? []).reduce((total, item) => total + Number(item.metadata?.size ?? 0), 0)
    if ((existing?.length ?? 0) >= MAX_ACCOUNT_FILES || usedBytes + file.size > MAX_ACCOUNT_STORAGE_BYTES) return NextResponse.json({ error: 'Your media storage limit has been reached' }, { status: 413 })
    let safe
    try { safe = await secureUpload(file) } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'File validation failed' }, { status: 400 }) }
    const path = `${identity.actorId}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${safe.extension}`
    const { error } = await identity.client.storage.from('memories').upload(path, safe.bytes, { contentType: safe.contentType, upsert: false, cacheControl: '31536000' })
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
