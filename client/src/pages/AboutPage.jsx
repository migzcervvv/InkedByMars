import { ManifestoSection } from "../components/about/ManifestoSection";
import { PortraitBio } from "../components/about/PortraitBio";
import { Specializations } from "../components/about/Specializations";
import { CreativeProcess } from "../components/about/CreativeProcess";
import { Milestones } from "../components/about/Milestones";
import { InfluencesSection } from "../components/about/InfluencesSection";
import { ClientPhilosophy } from "../components/about/ClientPhilosophy";

export default function AboutPage() {
  return (
    <article className="bg-surface overflow-x-hidden">
      <ManifestoSection />
      <PortraitBio />
      <Specializations />
      <CreativeProcess />
      <Milestones />
      <InfluencesSection />
      <ClientPhilosophy />
    </article>
  );
}
