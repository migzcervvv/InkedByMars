import { ManifestoSection } from "../about/ManifestoSection";
import { PortraitBio } from "../about/PortraitBio";
import { Specializations } from "../about/Specializations";
import { InfluencesSection } from "../about/InfluencesSection";
import { ClientPhilosophy } from "../about/ClientPhilosophy";

export function AboutSection() {
  return (
    <article className="bg-surface overflow-x-hidden">
      <ManifestoSection />
      <PortraitBio />
      <Specializations />
      <InfluencesSection />
      <ClientPhilosophy />
    </article>
  );
}
