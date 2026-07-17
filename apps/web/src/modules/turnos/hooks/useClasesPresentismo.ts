import type { KinesciusClass } from "@/lib/class-interface";
import { API_BASE } from "@/lib/constants";
import { useEffect, useState } from "react";

export function useClasesPresentismo() {
  const [classes, setClasses] = useState<KinesciusClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadClasses = async () => {
      setLoading(true);
      setError(null);
      try {
        const [pasadasRes, futurasRes] = await Promise.all([
          fetch(`${API_BASE}/clases?pasadas=true`),
          fetch(`${API_BASE}/clases`),
        ]);

        if (!pasadasRes.ok) throw new Error(`Error al cargar clases pasadas: ${pasadasRes.status}`);
        if (!futurasRes.ok) throw new Error(`Error al cargar clases futuras: ${futurasRes.status}`);

        const pasadas = (await pasadasRes.json()) as KinesciusClass[];
        const futuras = (await futurasRes.json()) as KinesciusClass[];

        setClasses([...pasadas, ...futuras]);
      } catch (fetchError) {
        setError(
          fetchError instanceof Error ? fetchError.message : "Error al intentar cargar clases"
        );
      } finally {
        setLoading(false);
      }
    };
    void loadClasses();
  }, []);

  return { classes, loading, error };
}