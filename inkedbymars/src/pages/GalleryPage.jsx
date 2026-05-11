import { GalleryGrid } from '../components/gallery/GalleryGrid'
import { Loader } from '../components/ui/Loader'
import { useInstagramFeed } from '../hooks/useInstagramFeed'

export default function GalleryPage() {
  const { posts, loading } = useInstagramFeed()

  return (
    <section className="min-h-screen bg-bg px-6 pb-24 pt-32 lg:pb-32">
      <div className="mx-auto max-w-7xl">
        <p className="eyebrow">Archive</p>
        <h1 className="page-title">Gallery</h1>
        <p className="mb-10 max-w-2xl font-body text-3xl italic leading-tight text-ash">
          A living wall of fine line, blackwork, color, and quiet little rituals.
        </p>
        {loading ? <Loader label="Loading work" /> : <GalleryGrid posts={posts} />}
      </div>
    </section>
  )
}
