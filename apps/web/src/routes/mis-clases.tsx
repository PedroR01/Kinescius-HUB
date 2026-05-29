import React, { useState, useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';

// Asegurate de ajustar estas rutas a donde realmente tenés guardados tus modales
import { CambiarTurno } from '../modules/turnos/components/cambiarTurnoModal';
import { CancelarTurno } from '../modules/turnos/components/cancelarTurnoModal';
import { Calendar, Clock, Activity, ArrowRightLeft, X } from 'lucide-react';

export const Route = createFileRoute('/mis-clases')({
    component: () => <GestionClases />,
});

interface ClaseDto {
    id: number;
    fecha: string;
    hora: string;
    tipo: string;
}

interface MisClasesResponseDto {
    id_clase: number;
    id_cliente: number;
    Clase: ClaseDto;
}

export default function GestionClases() {
    const [misClases, setMisClases] = useState<MisClasesResponseDto[]>([]);
    const [modalActivo, setModalActivo] = useState<'CAMBIAR' | 'CANCELAR' | null>(null);
    const [claseSeleccionada, setClaseSeleccionada] = useState<MisClasesResponseDto | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const idCliente = 1;

    const cargarClases = () => {
        setIsLoading(true);
        fetch(`http://localhost:3000/shifts/mis-clases/${idCliente}`)
            .then((res) => res.json())
            .then((data) => {
                setMisClases(data);
                setIsLoading(false);
            })
            .catch((err) => {
                console.error("Error al traer clases:", err);
                setIsLoading(false);
            });
    };

    useEffect(() => {
        cargarClases();
    }, []);

    const abrirModal = (tipo: 'CAMBIAR' | 'CANCELAR', clase: MisClasesResponseDto) => {
        setClaseSeleccionada(clase);
        setModalActivo(tipo);
    };

    const cerrarModal = () => {
        setModalActivo(null);
        setClaseSeleccionada(null);
    };

    const handleExito = () => {
        cerrarModal();
        cargarClases();
    };

    const formatDate = (dateString: string) => {
        const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' };
        const date = new Date(dateString + 'T00:00:00'); // Ensure local timezone parsing doesn't shift day
        // "Domingo, 31 De Mayo" format
        const formatted = date.toLocaleDateString('es-AR', options);
        // Capitalize first letter of words to match the screenshot
        return formatted.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    return (
        <div className="min-h-screen bg-white font-sans py-12 px-4 flex flex-col items-center">

            <div className="w-full max-w-4xl">
                {/* Header (Centrado dentro del contenedor principal) */}
                <div className="mb-8 border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3 text-[#0a2e27] mb-2">
                        <Calendar className="w-10 h-10 text-[#0D6B5D]" strokeWidth={2.5} />
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight">
                            Mis Clases
                        </h1>
                    </div>
                    <p className="text-[#64748b] font-medium text-lg">
                        Gestioná tus próximos turnos y mantené tu rutina al día.
                    </p>
                </div>

                {/* Contenido */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-10 h-10 border-4 border-[#0D6B5D]/20 border-t-[#0D6B5D] rounded-full animate-spin" />
                        <p className="text-slate-500 font-medium">Cargando...</p>
                    </div>
                ) : misClases.filter((item) => item.Clase !== null).length === 0 ? (
                    <div className="bg-slate-50 rounded-2xl p-10 text-center border border-slate-100">
                        <p className="text-slate-500 font-medium text-lg">No tenés clases programadas.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {misClases
                            .filter((item) => item.Clase !== null)
                            .sort((a, b) => {
                                const dateA = new Date(`${a.Clase.fecha}T${a.Clase.hora}`);
                                const dateB = new Date(`${b.Clase.fecha}T${b.Clase.hora}`);
                                return dateA.getTime() - dateB.getTime();
                            })
                            .map((item) => (
                                <div
                                    key={item.id_clase}
                                    className="bg-white rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col"
                                >
                                    {/* Subtle background decoration to match the image */}
                                    <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-[#e6f4f1] to-transparent rounded-bl-[100px] -z-10 opacity-70" />

                                    <div className="p-5 flex-1">
                                        <div className="flex items-center gap-1.5 text-[#0D6B5D] text-xs font-bold uppercase tracking-wider mb-2">
                                            <Activity className="w-3.5 h-3.5" />
                                            Próxima Clase
                                        </div>
                                        <h3 className="font-black text-[22px] text-[#12282c] tracking-tight leading-tight mb-4">
                                            {item.Clase.tipo}
                                        </h3>

                                        <div className="flex flex-col gap-2.5">
                                            <div className="flex items-center gap-3">
                                                <Calendar className="w-5 h-5 text-[#0D6B5D]" strokeWidth={2} />
                                                <span className="font-medium text-[#334155]">
                                                    {formatDate(item.Clase.fecha)}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Clock className="w-5 h-5 text-[#0D6B5D]" strokeWidth={2} />
                                                <span className="font-medium text-[#334155]">
                                                    {item.Clase.hora.slice(0, 5)} hs
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions / Botones */}
                                    <div className="flex border-t border-slate-100 mt-auto bg-white">
                                        <button
                                            onClick={() => abrirModal('CAMBIAR', item)}
                                            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-slate-50 text-[#1e293b] text-sm font-semibold hover:bg-slate-100 transition-colors border-r border-slate-100 rounded-bl-2xl"
                                        >
                                            <ArrowRightLeft className="w-4 h-4" />
                                            Cambiar
                                        </button>
                                        <button
                                            onClick={() => abrirModal('CANCELAR', item)}
                                            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100 transition-colors rounded-br-2xl"
                                        >
                                            <X className="w-4 h-4" />
                                            Cancelar
                                        </button>
                                    </div>
                                </div>
                            ))}
                    </div>
                )}
            </div>

            {/* MODALES */}
            {modalActivo === 'CAMBIAR' && claseSeleccionada && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
                    <CambiarTurno
                        clienteId={claseSeleccionada.id_cliente}
                        claseActualId={claseSeleccionada.id_clase}
                        actividad={claseSeleccionada.Clase.tipo}
                        fechaActual={claseSeleccionada.Clase.fecha}
                        horaActual={claseSeleccionada.Clase.hora}
                        onClose={cerrarModal}
                        onChangeSuccess={handleExito}
                    />
                </div>
            )}

            {modalActivo === 'CANCELAR' && claseSeleccionada && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
                    <CancelarTurno
                        clienteId={claseSeleccionada.id_cliente}
                        claseId={claseSeleccionada.id_clase}
                        actividad={claseSeleccionada.Clase.tipo}
                        fechaClase={claseSeleccionada.Clase.fecha}
                        horaClase={claseSeleccionada.Clase.hora}
                        onClose={cerrarModal}
                        onCancelSuccess={handleExito}
                    />
                </div>
            )}

        </div>
    );
}
