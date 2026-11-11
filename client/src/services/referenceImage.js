const inputTypes = ['image/jpeg', 'image/png', 'image/webp']
const maxInputBytes = 20 * 1024 * 1024
const maxUploadBytes = 192 * 1024
const longEdges = [1280, 960, 720, 540, 405]
const qualities = [0.8, 0.66, 0.52]

function encodeWebp(canvas, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob?.type === 'image/webp') resolve(blob)
      else reject(new Error('This browser could not create a WebP image.'))
    }, 'image/webp', quality)
  })
}

export async function optimizeReferenceImage(file) {
  if (!inputTypes.includes(file.type)) throw new Error('Choose a JPEG, PNG or WebP image.')
  if (file.size > maxInputBytes) throw new Error('Choose an image that is 20 MiB or smaller.')

  const url = URL.createObjectURL(file)
  const image = new Image()
  const canvas = document.createElement('canvas')

  try {
    image.src = url
    await image.decode().catch(() => { throw new Error('This image could not be opened.') })
    const { naturalWidth: width, naturalHeight: height } = image
    const context = canvas.getContext('2d')
    if (!context || !width || !height) throw new Error('This image could not be prepared.')

    let previousScale
    for (const edge of longEdges) {
      const scale = Math.min(1, edge / Math.max(width, height))
      if (scale === previousScale) continue
      previousScale = scale
      canvas.width = Math.max(1, Math.round(width * scale))
      canvas.height = Math.max(1, Math.round(height * scale))
      context.imageSmoothingQuality = 'high'
      context.drawImage(image, 0, 0, canvas.width, canvas.height)

      for (const quality of qualities) {
        const blob = await encodeWebp(canvas, quality)
        if (blob.size <= maxUploadBytes) return blob
      }
    }
    throw new Error('This image could not be compressed to 192 KiB. Choose a different image.')
  } finally {
    URL.revokeObjectURL(url)
    canvas.width = 0
    canvas.height = 0
  }
}
