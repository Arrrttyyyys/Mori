const MAX_FUNCTION_UPLOAD_BYTES = 4 * 1024 * 1024
const MAX_IMAGE_DIMENSION = 2048

function canvasBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('The browser could not prepare this image')), 'image/webp', quality),
  )
}

export async function prepareFileForUpload(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) {
    if (file.size > MAX_FUNCTION_UPLOAD_BYTES) throw new Error('Audio and video files must be under 4 MB on the hosted demo.')
    return file
  }
  const bitmap = await createImageBitmap(file)
  try {
    const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(bitmap.width * scale))
    canvas.height = Math.max(1, Math.round(bitmap.height * scale))
    const context = canvas.getContext('2d')
    if (!context) throw new Error('The browser could not prepare this image')
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    let blob = await canvasBlob(canvas, 0.82)
    if (blob.size > MAX_FUNCTION_UPLOAD_BYTES) blob = await canvasBlob(canvas, 0.65)
    if (blob.size > MAX_FUNCTION_UPLOAD_BYTES) throw new Error('This image is still too large after compression. Choose a smaller image.')
    const base = file.name.replace(/\.[^.]+$/, '').slice(0, 120) || 'memory-photo'
    return new File([blob], `${base}.webp`, { type: 'image/webp', lastModified: Date.now() })
  } finally {
    bitmap.close()
  }
}

export { MAX_FUNCTION_UPLOAD_BYTES }
