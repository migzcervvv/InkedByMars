import { PortraitBio } from "../about/PortraitBio";
import { Specializations } from "../about/Specializations";
import { ClientPhilosophy } from "../about/ClientPhilosophy";

export function AboutSection() {
  return (
    <article className="bg-surface overflow-x-hidden">
      <PortraitBio />
      <Specializations />
      <ClientPhilosophy />
    </article>
  );
}
