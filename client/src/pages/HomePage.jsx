import { Hero } from "../components/home/Hero";
import { FeaturedWork } from "../components/home/FeaturedWork";
import { AboutSection } from "../components/home/AboutSection";
import { FAQ } from "../components/home/FAQ";

export default function HomePage() {
  return (
    <>
      <Hero />
      <FeaturedWork />
      <AboutSection />
      <FAQ />
    </>
  );
}
