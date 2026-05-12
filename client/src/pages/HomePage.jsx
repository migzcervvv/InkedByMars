import { Hero } from '../components/home/Hero'
import { FeaturedWork } from '../components/home/FeaturedWork'
import { AboutSection } from '../components/home/AboutSection'
import { Testimonials } from '../components/home/Testimonials'

export default function HomePage() {
  return (
    <>
      <Hero />
      <FeaturedWork />
      <AboutSection />
      <Testimonials />
    </>
  )
}
