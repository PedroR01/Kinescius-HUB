import { SectionHeader } from "./SectionHeader";
import { ProfessionalGrid } from "./ProfessionalGrid";

export function TeamSection() {
  return (
    <section id="profesionales" className="bg-surface px-4 py-14 sm:px-6 sm:py-20">
      <div className="mx-auto w-full max-w-6xl">
        <SectionHeader
          eyebrow="Conoce a nuestro equipo"
          title="Nuestros Profesionales"
          subtitle="Expertos en movimiento, comprometidos con tu recuperación."
        />
        <ProfessionalGrid />
      </div>
    </section>
  );
}
