export const MEMORIES_BUCKET = 'memories'

/**
 * Upload an image file to Supabase Storage under the user's folder.
 * Returns a short-lived signed URL and durable storage path.
 */
export async function uploadMemoryPhoto(
  userId: string,
  file: File
): Promise<{ url: string; path: string } | null> {
  if (file.size > 50 * 1024 * 1024 || !/^(image\/(jpeg|png|gif|webp)|audio\/(mpeg|wav|mp4)|video\/(mp4|webm))$/.test(file.type)) return null
  const form = new FormData()
  form.set('file', file)
  const response = await fetch('/api/storage/memories', { method: 'POST', body: form, credentials: 'same-origin' })
  if (!response.ok) return null
  return response.json()
}

/**
 * Delete an object from the memories bucket by its public URL.
 * Use when removing a memory so the file is removed from Storage too.
 */
export async function deleteMemoryPhotoByPath(path: string): Promise<boolean> {
  const response = await fetch('/api/storage/memories', {
    method: 'DELETE',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ path }),
  })
  return response.ok
}
