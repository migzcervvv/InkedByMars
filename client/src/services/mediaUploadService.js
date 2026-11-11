import { http } from '../api/http'
import { optimizeReferenceImage } from './referenceImage'

export async function processImage(file) {
  const optimized = await optimizeReferenceImage(file)
  const form = new FormData()
  form.append('file', optimized, 'reference.webp')
  const result = await http.post('/uploads', form, {
    headers: { 'Content-Type': undefined, 'X-File-Size': String(optimized.size) },
    timeout: 120000,
  })
  return { name: file.name, key: result.key, dataUrl: result.url }
}
