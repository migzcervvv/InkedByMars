import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { usePageMeta } from '../../hooks/usePageMeta'
import { bookingQuestions, studio, workCategories } from '../../config/studio'
import { useStudioMotion } from './useStudioMotion'

export default function HomePage() {
  const scope = useRef(null)
  const [categoryId, setCategoryId] = useState('freehand')
  const category = workCategories.find(item => item.id === categoryId)
  usePageMeta('Custom tattoos in Las Piñas', 'Custom, freehand, minimalistic and flash tattoos by Mars. A private tattoo studio in BF Resort, Las Piñas. Explore the work and request an appointment.')
  useStudioMotion(scope)

  return <div ref={scope} className="studio-home">
    <section className="hero">
      <div className="frame hero-inner">
        <div className="hero-copy">
          <h1 className="hero-title"><span data-hero-line>Inked</span><span data-hero-line>by Mars</span></h1>
          <p data-hero-line>Custom tattoos in Las Piñas.<br />A little of you, drawn by me.</p>
          <div data-hero-line><Button to="/booking">Request a session <ArrowUpRight size={18} /></Button></div>
        </div>
        <figure className="hero-art" data-stencil>
          <div className="hero-image-window"><img data-parallax src="/sample.jpg" alt="Mars’s signed flash sheet of illustrated faces, flowers, ribbons and a dagger" width="1080" height="1080" fetchpriority="high" /></div>
          <figcaption>From the sketchbook to your skin.</figcaption>
        </figure>
        <Link to="/works" className="hero-seal" aria-label="Explore Mars’s work" data-seal><img src={studio.logo} alt="Mars red wax seal with gold lettering" width="1440" height="810" /></Link>
      </div>
    </section>

    <section className="section-space frame selected-work" id="work">
      <div className="section-heading"><h2 data-reveal>Made to be worn.</h2><Link className="text-link" to="/works" data-reveal>Explore the works</Link></div>
      <div className="work-pair">
        <figure data-reveal><Link to="/works" className="artwork-link"><img src="/freehand.jpg" alt="Freehand red spider lilies across the arm" width="1080" height="1350" loading="lazy" data-stencil /></Link><figcaption><span>Freehand florals</span><span>Drawn with the body</span></figcaption></figure>
        <figure data-reveal><Link to="/works" className="artwork-link"><img src="/custom.jpg" alt="Custom dagger and chain following the length of an arm" width="1080" height="1350" loading="lazy" data-stencil /></Link><figcaption><span>A custom piece</span><span>Line, shape, placement</span></figcaption></figure>
      </div>
    </section>

    <section className="artist-section" id="about"><div className="frame artist-grid">
      <div className="artist-copy"><h2 data-reveal>Hi, I’m Mars.</h2><p className="statement" data-reveal>I draw tattoos for the person who wears them.</p><p data-reveal>I’m a tattoo artist working in BF Resort, Las Piñas. My work moves between custom pieces, freehand drawings, minimalistic marks, and illustrated flash.</p><p data-reveal>Bring a reference, a story, or an idea you haven’t quite put into words. We’ll start there and find a design and placement that feel like you.</p><a href={studio.instagram} target="_blank" rel="noreferrer" className="text-link" data-reveal>Find me on Instagram</a></div>
      <figure className="artist-collection" data-reveal><img src="/artist.jpg" alt="Collection of tattoos and a photograph of Mars in the center" width="1080" height="1080" loading="lazy" data-stencil /><figcaption>A few pieces from my world.</figcaption></figure>
    </div></section>

    <section className="section-space frame style-section" aria-labelledby="style-title">
      <div className="section-heading"><h2 id="style-title" data-reveal>Where do we start?</h2><p data-reveal>A drawing of your own.<br />Or something from mine.</p></div>
      <div className="style-layout"><div className="style-picker" data-reveal><div className="style-choices" role="group" aria-label="Explore tattoo styles">{workCategories.map(item => <button key={item.id} type="button" aria-pressed={category.id === item.id} onClick={() => setCategoryId(item.id)}>{item.name}</button>)}</div><div className="style-detail" aria-live="polite"><p>{category.description}</p><Button to={`/booking?style=${category.id}`}>Request a session</Button></div></div><figure data-reveal><img key={category.id} className="style-preview" src={category.image} alt={category.alt} width="1080" height="1350" loading="lazy" /><figcaption>{category.name} by Mars</figcaption></figure></div>
    </section>

    <section className="process-section"><div className="frame"><h2 data-reveal>Your idea, in ink.</h2><div className="process-list">
      <div data-reveal><h3>Bring the idea.</h3><p>Choose a date and tell me about your piece. Add your placement, size, and any references.</p></div>
      <div data-reveal><h3>Make it yours.</h3><p>I’ll review your request and get in touch to talk through the design and appointment.</p></div>
      <div data-reveal><h3>Wear the drawing.</h3><p>Once your session is confirmed, we’ll meet at the studio and bring your piece to life.</p></div>
    </div></div></section>

    <section className="section-space frame questions-section"><div><h2 data-reveal>Before the ink.</h2><p data-reveal>A few things to know before requesting a session.</p></div><div className="question-list">{bookingQuestions.map(item => <div key={item.question} data-reveal><h3>{item.question}</h3><p>{item.answer}</p></div>)}</div></section>

    <section className="contact-section" id="contact"><div className="frame contact-grid"><div><h2 data-reveal>See you in<br />Las Piñas.</h2><p data-reveal>Private sessions in {studio.location}.<br />By appointment.</p><Button to="/booking" data-reveal>Request a session</Button></div><div className="contact-details" data-reveal><a href={`mailto:${studio.email}`}>{studio.email}</a><a href={studio.instagram} target="_blank" rel="noreferrer">{studio.instagramHandle}</a><a href={studio.flashInstagram} target="_blank" rel="noreferrer">{studio.flashHandle}</a><a href={studio.map} target="_blank" rel="noreferrer">Find the studio</a></div></div></section>
  </div>
}
