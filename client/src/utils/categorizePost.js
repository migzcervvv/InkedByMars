export const galleryCategories = [
  { label: 'ALL', value: 'all' },
  { label: 'Freehand', value: 'freehand' },
  { label: 'Custom', value: 'custom' },
  { label: 'Flash', value: 'flash' },
  { label: 'Others', value: 'others' },
]

export function categorizePost(caption) {
  const text = (caption || '').toLowerCase()
  if (/freehand|free hand/.test(text)) return 'freehand'
  if (/custom|customized|custom tattoo|customised/.test(text)) return 'custom'
  if (/flash|flash design|flash tattoo|flash sale/.test(text)) return 'flash'
  return 'others'
}

export function withGalleryCategory(post) {
  return {
    ...post,
    category: post.category || categorizePost(post.caption || post.description),
  }
}
