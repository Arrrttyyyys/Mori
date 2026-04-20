import { getSupabaseBrowserClient } from '@/lib/supabase/client'

export const MEMORIES_BUCKET = 'memories'

/**
 * Upload an image file to Supabase Storage under the user's folder.
 * Returns the public URL for the stored object, or null if upload fails or Supabase is not configured.
 */
export async function uploadMemoryPhoto(
  userId: string,
  file: File
): Promise<{ url: string; path: string } | null> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) return null

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const safeExt = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext) ? ext : 'jpg'
  const path = `${userId}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${safeExt}`

  const { error } = await supabase.storage.from(MEMORIES_BUCKET).upload(path, file, {
    contentType: file.type || `image/${safeExt}`,
    upsert: false,
  })

  if (error) {
    console.error('Supabase storage upload error:', error)
    return null
  }

  const { data } = supabase.storage.from(MEMORIES_BUCKET).getPublicUrl(path)
  return { url: data.publicUrl, path }
}

/**
 * Delete an object from the memories bucket by its public URL.
 * Use when removing a memory so the file is removed from Storage too.
 */
export async function deleteMemoryPhotoByUrl(imageUrl: string): Promise<boolean> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) return false

  const path = getStoragePathFromPublicUrl(imageUrl)
  if (!path) return false

  const { error } = await supabase.storage.from(MEMORIES_BUCKET).remove([path])
  if (error) {
    console.error('Supabase storage delete error:', error)
    return false
  }
  return true
}

/**
 * Extract storage path from a Supabase public URL.
 * e.g. https://xxx.supabase.co/storage/v1/object/public/memories/userId/file.jpg -> userId/file.jpg
 */
function getStoragePathFromPublicUrl(url: string): string | null {
  try {
    const match = url.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/)
    return match ? match[1] : null
  } catch {
    return null
  }
}
