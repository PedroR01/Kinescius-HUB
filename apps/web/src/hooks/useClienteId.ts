import { useState, useEffect } from 'react';
import { API_BASE } from '@/lib/constants';

export function useClienteId() {
    const [clienteId, setClienteId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('miToken');

        if (token) {
            fetch(`${API_BASE}/shifts/cliente-id`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
                .then(res => {
                    if (!res.ok) throw new Error("Token inválido o expirado");
                    return res.json();
                })
                .then(data => {
                    setClienteId(data.id_cliente);
                    setIsLoading(false);
                })
                .catch(err => {
                    console.error("Error al obtener ID del cliente:", err);
                    setError("Error al identificar la cuenta. Por favor, iniciá sesión.");
                    setIsLoading(false);
                });
        } else {
            setError("No se encontró sesión activa. Por favor, iniciá sesión.");
            setIsLoading(false);
        }
    }, []);

    return { clienteId, isLoading, error };
}
