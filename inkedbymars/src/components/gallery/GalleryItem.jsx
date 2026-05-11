import { Expand } from 'lucide-react'
import { Tag } from '../ui/Tag'
import { imageHoverHandlers } from '../../utils/animations'

export function GalleryItem({ post, onClick }) {
  return (
    <figure data-flip-id={post.id} data-category={post.category} className="gallery-item mb-4 block break-inside-avoid opacity-100">
      <button
        type="button"
        onClick={onClick}
        className="group block w-full overflow-hidden bg-surface text-left opacity-100 shadow-leather"
        {...imageHoverHandlers()}
      >
        <div className="relative overflow-hidden">
          <img
            src={post.src}
            srcSet={post.srcSet}
            alt={post.alt}
            width="600"
            height={post.src.includes('/900') ? '900' : '800'}
            loading="lazy"
            decoding="async"
            className="w-full object-cover blur-[4px] transition duration-500 group-hover:blur-0"
            onLoad={(event) => event.currentTarget.classList.remove('blur-[4px]')}
          />
          <div className="absolute inset-0 grid place-items-center bg-red/0 text-cream opacity-0 transition group-hover:bg-red/60 group-hover:opacity-100">
            <Expand size={30} />
          </div>
        </div>
        <figcaption className="p-4">
          <Tag>{post.style}</Tag>
          <p className="mt-3 font-body text-2xl italic leading-tight text-ink">{post.caption}</p>
        </figcaption>
      </button>
    </figure>
  )
}
