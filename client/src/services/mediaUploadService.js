import { http } from '../api/http'
export async function processImage(file) {
  if (!['image/jpeg','image/png','image/webp'].includes(file.type)) throw new Error('Choose a JPEG, PNG or WebP image.')
  if (file.size > 20 * 1024 * 1024) throw new Error('Each image must be 20 MB or smaller.')
  const form = new FormData(); form.append('file', file, file.name)
  const result = await http.post('/uploads', form, { headers: { 'Content-Type': undefined, 'X-File-Size': String(file.size) }, timeout: 120000 })
  return { name: file.name, key: result.key, dataUrl: result.url }
}
export const processImages = files => Promise.all(files.map(processImage))
