import axios from 'axios'
import { mockGallery } from '../data/mockGallery'

const apiBaseUrl = import.meta.env?.VITE_API_BASE_URL

export async function fetchGalleryPosts() {
  if (!apiBaseUrl) return mockGallery

  try {
    const { data } = await axios.get(`${apiBaseUrl}/api/gallery`)
    return Array.isArray(data?.posts) ? data.posts : mockGallery
  } catch {
    return mockGallery
  }
}
