import 'server-only'

import type { NextRequest } from 'next/server'
import { anonymousSubjectHash, clientKeyHash } from '@/lib/operations/monitoring'
import { createAdminServerClient } from '@/lib/supabase/server'

export type AuthAction = 'login' | 'signup' | 'confirm' | 'recovery_request' | 'password_update'

const policies: Record<AuthAction, { seconds: number; clientLimit: number; subjectLimit: number }> = {
  login: { seconds: 15 * 60, clientLimit: 20, subjectLimit: 10 },
  signup: { seconds: 60 * 60, clientLimit: 5, subjectLimit: 3 },
  confirm: { seconds: 15 * 60, clientLimit: 20, subjectLimit: 20 },
  recovery_request: { seconds: 60 * 60, clientLimit: 5, subjectLimit: 3 },
  password_update: { seconds: 60 * 60, clientLimit: 10, subjectLimit: 5 },
}

export async function consumeAuthQuota(request: NextRequest, action: AuthAction, subject?: string) {
  const policy = policies[action]
  const keys = [
    { key: clientKeyHash(request), scope: 'client', limit: policy.clientLimit },
    ...(subject ? [{ key: anonymousSubjectHash(subject.trim().toLowerCase()), scope: 'subject', limit: policy.subjectLimit }] : []),
  ]
  let retryAfter = 1
  for (const item of keys) {
    const { data, error } = await createAdminServerClient().rpc('consume_mori_auth_quota', {
      p_subject_key: item.key,
      p_action: `${action}:${item.scope}`,
      p_window_seconds: policy.seconds,
      p_window_limit: item.limit,
    })
    if (error) throw error
    const result = data as { allowed?: boolean; retry_after?: number }
    retryAfter = Math.max(retryAfter, Number(result.retry_after ?? 1))
    if (!result.allowed) return { allowed: false, retryAfter }
  }
  return { allowed: true, retryAfter: 0 }
}
