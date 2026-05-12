import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useInstagramFeed } from '../../hooks/useInstagramFeed'
import { useGSAP } from '../../hooks/useGSAP'
import { Tag } from '../ui/Tag'
import { imageHoverHandlers } from '../../utils/animations'

gsap.registerPlugin(ScrollTrigger)

export function FeaturedWork() {
  const sectionRef = useRef(null)
  const stripRef = useRef(null)
  const { posts } = useInstagramFeed()
  const featured = posts.filter((post) => post.featured)

  useGSAP(
    () => {
      const strip = stripRef.current
      if (!strip) return
      const amount = strip.scrollWidth - window.innerWidth + 80
      if (amount <= 0) return
      gsap.to(strip, {
        x: -amount,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: () => `+=${amount}`,
          pin: true,
          scrub: 0.8,
          invalidateOnRefresh: true,
        },
      })
    },
    [],
  )

  return (
    <section ref={sectionRef} id="work" className="overflow-hidden bg-bg py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-10 flex items-center gap-5">
          <h2 className="section-title whitespace-nowrap">Selected Work</h2>
          <span className="h-px flex-1 bg-ink/30" />
        </div>
      </div>
      <div ref={stripRef} className="flex w-max gap-4 px-6">
        {featured.map((post) => (
          <figure key={post.id} className="group relative h-[320px] w-[78vw] max-w-[430px] overflow-hidden bg-leather shadow-red" {...imageHoverHandlers()}>
            <img
              src={post.src}
              srcSet={post.srcSet}
              alt={post.alt}
              width="600"
              height="800"
              loading="lazy"
              decoding="async"
              className="size-full object-cover"
            />
            <figcaption className="absolute inset-0 flex translate-y-5 flex-col justify-end bg-ink/0 p-5 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:bg-ink/55 group-hover:opacity-100">
              <Tag className="w-fit border-red bg-red text-cream">{post.style}</Tag>
              <p className="mt-3 font-display text-3xl italic text-cream">{post.title}</p>
            </figcaption>
          </figure>
        ))}
        <Link to="/gallery" className="flex h-[320px] w-[260px] items-center justify-center border border-ink/25 p-8 font-mono text-xs uppercase tracking-[0.18em] text-ink transition hover:border-red hover:text-red">
          See Full Gallery <ArrowRight className="ml-2" size={16} />
        </Link>
      </div>
    </section>
  )
}
