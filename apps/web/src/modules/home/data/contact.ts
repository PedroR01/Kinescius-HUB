export const CONTACT_INFO = {
  phone: "+56 9 1234 5678",
  email: "hola@kinescius.cl",
  address: "Av. Tu Salud 123, Oficina 101, Santiago, Chile"
} as const;

export const SOCIAL_LINKS = [
  { label: "Instagram", href: "https://instagram.com", network: "instagram" as const },
  { label: "Facebook", href: "https://facebook.com", network: "facebook" as const },
  { label: "LinkedIn", href: "https://linkedin.com", network: "linkedin" as const }
] as const;
