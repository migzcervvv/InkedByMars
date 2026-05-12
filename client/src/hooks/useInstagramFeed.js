import { useEffect, useState } from 'react'
import { mockGallery } from '../data/mockGallery'
import { fetchGalleryPosts } from '../services/galleryService'
import { withGalleryCategory } from '../utils/categorizePost'

export function useInstagramFeed() {
  const [posts, setPosts] = useState(() => mockGallery.map(withGalleryCategory))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true
    fetchGalleryPosts()
      .then((data) => {
        if (mounted) setPosts(data.map(withGalleryCategory))
      })
      .catch((err) => {
        if (mounted) setError(err)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  return { posts, loading, error }
}
