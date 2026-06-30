import type { KinesciusClass } from "@/lib/class-interface";
import { API_BASE } from "@/lib/constants";
import { useEffect, useState } from "react";

export function useClassFetcher() {
    const [classes, setClasses] = useState<KinesciusClass[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
    const loadClasses = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE}/clases`);
        if (!response.ok) throw new Error(`Error al cargar clases: ${response.status}`);
        const data = (await response.json()) as KinesciusClass[];
        setClasses(data);
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