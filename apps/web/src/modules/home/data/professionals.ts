import kineJus from "@/assets/kine-jus.jpeg";
import kineIva from "@/assets/kine-iva.jpeg";
import kineNico from "@/assets/kine-nico.jpeg";
import kineCarlo from "@/assets/kine-carlo.jpeg";
import kinePedro from "@/assets/kine-pedro.jpeg";

export interface Professional {
  id: string;
  name: string;
  role: string;
  bio: string;
  imageUrl: string;
  linkedInUrl: string;
}

export const PROFESSIONALS: Professional[] = [
  {
    id: "justina-guerrero",
    name: "Justina Guerrero",
    role: "Kinesióloga",
    bio: "Especialista en rehabilitación traumatológica y recuperación postoperatoria.",
    imageUrl: kineJus,
    linkedInUrl: "https://linkedin.com"
  },
  {
    id: "ivan-sgriletti",
    name: "Ivan Kharim Sgriletti",
    role: "Kinesiólogo",
    bio: "Experto en terapia manual y tratamiento de lesiones deportivas.",
    imageUrl: kineIva,
    linkedInUrl: "https://linkedin.com"
  },
  {
    id: "nicolas-diaz",
    name: "Nicolás Díaz",
    role: "Kinesiólogo",
    bio: "Enfoque en neurología y rehabilitación de pacientes con ACV.",
    imageUrl: kineNico,
    linkedInUrl: "https://linkedin.com"
  },
  {
    id: "carlo-castro",
    name: "Carlo Castro",
    role: "Kinesiólogo",
    bio: "Especializado en kinesiología respiratoria y rehabilitación pulmonar.",
    imageUrl: kineCarlo,
    linkedInUrl: "https://linkedin.com"
  },
  {
    id: "pedro-robinet",
    name: "Pedro Robinet",
    role: "Kinesiólogo",
    bio: "Dedicado a la salud de la mujer y rehabilitación pélvica.",
    imageUrl: kinePedro,
    linkedInUrl: "https://www.linkedin.com/in/robinetpedro/"
  }
];
