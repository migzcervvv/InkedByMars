import { Hero } from "../components/home/Hero";
import { AboutSection } from "../components/home/AboutSection";
import { FAQ } from "../components/home/FAQ";
import CallToAction from "../components/home/CallToAction";

export default function HomePage() {
  return (
    <>
      <Hero />
      <AboutSection />
      <CallToAction />
      <FAQ />
    </>
  );
}
