import { ShieldCheck, ThumbsUp, UserCheck, type LucideIcon } from "lucide-react";

export interface HeroFeature {
  icon: LucideIcon;
  title: string;
}

export const HERO_FEATURES: HeroFeature[] = [
  { icon: UserCheck, title: "Atención Personalizada" },
  { icon: ShieldCheck, title: "Profesionales Certificados" },
  { icon: ThumbsUp, title: "Enfoque Integral y Humano" }
];
