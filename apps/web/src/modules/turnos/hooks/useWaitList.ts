import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { ClassSlot } from "@/lib/class-interface";
import { API_BASE } from "@/lib/constants";

export function useWaitList(clienteId: number | null) {
  const [waitList, setWaitList] = useState<string[]>([]);

  const handleAddWaitList = useCallback(
    async (slot: ClassSlot) => {
      if (!clienteId) {
        toast.error("No se pudo identificar tu cuenta. Por favor, iniciá sesión.");
        return;
      }

      const waitKey = `${slot.date} ${slot.time}hs ${slot.className}`;
      try {
        const response = await fetch(`${API_BASE}/listaEspera/clase/${slot.source.id}/join`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clienteId }),
        });
        if (!response.ok) throw new Error(`Error: ${response.status}`);

        setWaitList((list) => (list.includes(waitKey) ? list : [...list, waitKey]));
        toast.success(
          `Fuiste añadido a la lista de espera para ${slot.className} el ${slot.date} a las ${slot.time}hs.`
        );
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Error al unirse a lista de espera");
      }
    },
    [clienteId]
  );

  return { waitList, handleAddWaitList };
}
