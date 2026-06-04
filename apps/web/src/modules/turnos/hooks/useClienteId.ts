import { useEffect, useState } from "react";
import { API_BASE } from "@/lib/constants";

export function useClienteId() {
  const [clienteId, setClienteId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("miToken");
    const userId = localStorage.getItem("userId");
    if (!token || !userId) {
      setIsLoading(false);
      setError("No se pudo identificar tu cuenta. Por favor, iniciá sesión.");
      return;
    }

    setClienteId(Number(userId));
    setIsLoading(false);
  }, []);

  return { clienteId, error, isLoading };
}
