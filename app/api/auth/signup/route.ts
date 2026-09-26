import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { setAuthCookies } from '@/lib/auth/cookies'
import { isAccountRelationship } from '@/lib/auth/account-role'
import { createAdminServerClient } from '@/lib/supabase/server'

const TERMS_VERSION = '2026-09-25'
const PRIVACY_VERSION = '2026-09-25'

export async function POST(request: NextRequest) {
  if (request.headers.get('origin') !== request.nextUrl.origin) return NextResponse.json({ error: 'Request origin could not be verified' }, { status: 403 })
  const body = await request.json().catch(() => ({}))
  if (typeof body.email !== 'string' || typeof body.password !== 'string' || typeof body.name !== 'string' || !body.name.trim() || !isAccountRelationship(body.relationship)) return NextResponse.json({ error: 'Name, email, password, and your relationship to Mori are required' }, { status: 400 })
  if (body.acceptTerms !== true || body.acceptPrivacy !== true) return NextResponse.json({ error: 'Accept the Terms and Privacy Policy to create an account' }, { status: 400 })
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return NextResponse.json({ error: 'Authentication is not configured' }, { status: 503 })
  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data, error } = await supabase.auth.signUp({
    email: body.email.trim(),
    password: body.password,
    options: {
      data: {
        name: body.name.trim(),
        relationship_to_mori: body.relationship,
        terms_version: TERMS_VERSION,
        privacy_version: PRIVACY_VERSION,
        policies_accepted_at: new Date().toISOString(),
      },
      emailRedirectTo: `${request.nextUrl.origin}/auth/confirm`,
    },
  })
  if (error || !data.user) return NextResponse.json({ error: error?.message || 'Account creation failed' }, { status: 400 })
  const { error: acceptanceError } = await createAdminServerClient().from('legal_acceptances').insert({ user_id: data.user.id, terms_version: TERMS_VERSION, privacy_version: PRIVACY_VERSION })
  if (acceptanceError) {
    await createAdminServerClient().auth.admin.deleteUser(data.user.id).catch(() => undefined)
    return NextResponse.json({ error: 'We could not record policy acceptance. Please try again.' }, { status: 500 })
  }
  const response = NextResponse.json({ user: data.user, requiresEmailConfirmation: !data.session })
  if (data.session) setAuthCookies(response, data.session)
  return response
}
