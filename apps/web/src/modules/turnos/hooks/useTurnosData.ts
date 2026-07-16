import { useCallback, useEffect, useState } from "react";
import { fetchMontoAFavor } from "@/api/payments";
import type { ClientEnrollment } from "@/lib/class-interface";
import { API_BASE } from "@/lib/constants";
import { useClassFetcher } from "./useClassFetcher";

export function useTurnosData(clienteId: number | null) {
  const [enrolledClassIds, setEnrolledClassIds] = useState<Set<number>>(() => new Set());
  const [montoAFavor, setMontoAFavor] = useState(0);
  const [clasesAFavor, setClasesAFavor] = useState(0);
  const [esAbonado, setEsAbonado] = useState(false);
  const [penalizadoHasta, setPenalizadoHasta] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => {
    setRefreshKey((key) => key + 1);
  }, []);

  const { classes, loading, error } = useClassFetcher();

  useEffect(() => {
    if (!clienteId) return;
    void fetchMontoAFavor(clienteId).then((res) => {
      setMontoAFavor(res.monto_a_favor);
      setClasesAFavor(res.clases_a_favor);
      setEsAbonado(res.es_abonado ?? false);
      setPenalizadoHasta(res.penalizado_hasta ?? null);
    });
  }, [clienteId, refreshKey]);

  useEffect(() => {
    if (!clienteId) {
      setEnrolledClassIds(new Set());
      return;
    }
    const loadEnrollments = async () => {
      try {
        const response = await fetch(`${API_BASE}/shifts/mis-clases/${clienteId}`);
        if (!response.ok) return;
        const data = (await response.json()) as ClientEnrollment[];
        setEnrolledClassIds(new Set(data.map((item) => item.id_clase)));
      } catch {
        setEnrolledClassIds(new Set());
      }
    };
    void loadEnrollments();
  }, [clienteId, refreshKey]);

  return {
    classes,
    loading,
    error,
    enrolledClassIds,
    montoAFavor,
    clasesAFavor,
    esAbonado,
    penalizadoHasta,
    setMontoAFavor,
    refresh,
  };
}