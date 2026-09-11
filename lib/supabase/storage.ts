import { getSupabaseBrowserClient } from '@/lib/supabase/client'

export const MEMORIES_BUCKET = 'memories'

/**
 * Upload an image file to Supabase Storage under the user's folder.
 * Returns a short-lived signed URL and durable storage path.
 */
export async function uploadMemoryPhoto(
  userId: string,
  file: File
): Promise<{ url: string; path: string } | null> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) return null

  if (file.size > 50 * 1024 * 1024 || !/^(image\/(jpeg|png|gif|webp)|audio\/(mpeg|wav|mp4)|video\/(mp4|webm))$/.test(file.type)) return null
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const safeExt = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp3', 'wav', 'm4a', 'mp4', 'webm'].includes(ext) ? ext : 'jpg'
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const path = `${user.id}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${safeExt}`

  const { error } = await supabase.storage.from(MEMORIES_BUCKET).upload(path, file, {
    contentType: file.type || `image/${safeExt}`,
    upsert: false,
  })

  if (error) {
    console.error('Supabase storage upload error:', error)
    return null
  }

  const { data, error: signedUrlError } = await supabase.storage.from(MEMORIES_BUCKET).createSignedUrl(path, 3600)
  if (signedUrlError) {
    await supabase.storage.from(MEMORIES_BUCKET).remove([path])
    return null
  }
  return { url: data.signedUrl, path }
}

/**
 * Delete an object from the memories bucket by its public URL.
 * Use when removing a memory so the file is removed from Storage too.
 */
export async function deleteMemoryPhotoByPath(path: string): Promise<boolean> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) return false

  const { error } = await supabase.storage.from(MEMORIES_BUCKET).remove([path])
  if (error) {
    console.error('Supabase storage delete error:', error)
    return false
  }
  return true
}
