import { useState, useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { motion } from 'motion/react';
import { Calendar, Clock, Activity, ArrowRightLeft, X } from 'lucide-react';
import { CambiarTurno } from '../modules/turnos/components/cambiarTurnoModal';
import { CancelarTurno } from '../modules/turnos/components/cancelarTurnoModal';
import { Button } from '@/components/ui/button';
import { EASE_OUT, fadeUp, staggerContainer } from '@/lib/motion';

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

    const idCliente = 11;

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
        const date = new Date(dateString + 'T00:00:00');
        const formatted = date.toLocaleDateString('es-AR', options);
        return formatted.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    return (
        <div className="min-h-svh flex flex-col">
            {/* Header section */}
            <section className="bg-white px-4 py-10 sm:px-6 sm:py-12 lg:py-16">
                <div className="mx-auto w-full max-w-5xl">
                    <motion.div
                        variants={staggerContainer(0.12)}
                        initial="hidden"
                        animate="visible"
                        className="text-center sm:text-left"
                    >
                        <motion.div variants={fadeUp} transition={EASE_OUT}>
                            <div className="flex flex-col sm:flex-row items-center gap-4 text-dark-accent mb-4">
                                <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-main/10 text-main shrink-0">
                                    <Calendar className="w-8 h-8" strokeWidth={2} />
                                </div>
                                <h1 className="font-heading text-4xl font-extrabold leading-[1.12] text-dark-accent sm:text-5xl">
                                    Mis Clases
                                </h1>
                            </div>
                            <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                                Gestioná tus próximos turnos y mantené tu rutina al día. Revisa, cambia o cancela tus clases programadas con facilidad.
                            </p>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* Content section */}
            <section className="bg-surface flex-1 px-4 py-10 sm:px-6 sm:py-12 lg:py-16">
                <div className="mx-auto w-full max-w-5xl">
                    <motion.div
                        variants={staggerContainer(0.12)}
                        initial="hidden"
                        animate="visible"
                    >
                        {/* Contenido */}
                        {isLoading ? (
                            <motion.div variants={fadeUp} className="flex flex-col items-center justify-center py-20 gap-4">
                                <div className="w-12 h-12 border-4 border-main/20 border-t-main rounded-full animate-spin" />
                                <p className="text-muted-foreground font-medium text-lg">Cargando tus clases...</p>
                            </motion.div>
                        ) : misClases.filter((item) => item.Clase !== null).length === 0 ? (
                            <motion.div variants={fadeUp} className="bg-white rounded-3xl p-12 text-center shadow-md">
                                <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-main/5 text-main mb-6">
                                    <Calendar className="w-10 h-10" />
                                </div>
                                <h3 className="font-heading text-2xl font-bold text-dark-accent mb-3">No tenés clases programadas</h3>
                                <p className="text-muted-foreground text-lg max-w-md mx-auto">
                                    Parece que aún no has agendado ninguna clase. ¡Da el primer paso hacia tu recuperación hoy mismo!
                                </p>
                            </motion.div>
                        ) : (
                            <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                {misClases
                                    .filter((item) => item.Clase !== null)
                                    .sort((a, b) => {
                                        const dateA = new Date(`${a.Clase.fecha}T${a.Clase.hora}`);
                                        const dateB = new Date(`${b.Clase.fecha}T${b.Clase.hora}`);
                                        return dateA.getTime() - dateB.getTime();
                                    })
                                    .map((item) => (
                                        <motion.div
                                            key={item.id_clase}
                                            whileHover={{ y: -6 }}
                                            transition={EASE_OUT}
                                            className="bg-white rounded-2xl shadow-md relative overflow-hidden flex flex-col transition-shadow hover:shadow-xl"
                                        >
                                            {/* Subtle background decoration */}
                                            <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-main/10 to-transparent rounded-bl-full -z-10" />

                                            <div className="p-5 flex-1">
                                                <h3 className="font-heading font-extrabold text-2xl text-main tracking-tight leading-tight mb-4">
                                                    {item.Clase.tipo}
                                                </h3>

                                                <div className="flex flex-col gap-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-main/10 text-main shrink-0">
                                                            <Calendar className="w-4 h-4" strokeWidth={2.5} />
                                                        </div>
                                                        <span className="font-medium text-slate-700 text-[15px]">
                                                            {formatDate(item.Clase.fecha)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-main/10 text-main shrink-0">
                                                            <Clock className="w-4 h-4" strokeWidth={2.5} />
                                                        </div>
                                                        <span className="font-medium text-slate-700 text-[15px]">
                                                            {item.Clase.hora.slice(0, 5)} hs
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="p-4 pt-0 mt-auto flex flex-row gap-2 bg-transparent">
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    className="flex-1 rounded-xl text-xs px-2 py-2 border-transparent shadow-none hover:shadow-none hover:bg-main/5"
                                                    onClick={() => abrirModal('CAMBIAR', item)}
                                                >
                                                    <ArrowRightLeft className="w-3.5 h-3.5 mr-1" />
                                                    Cambiar
                                                </Button>
                                                <Button
                                                    variant="inverse"
                                                    size="sm"
                                                    className="flex-1 rounded-xl text-xs px-2 py-2 text-red-600 border-red-100 hover:bg-red-50 hover:border-red-200 shadow-none hover:shadow-none"
                                                    onClick={() => abrirModal('CANCELAR', item)}
                                                >
                                                    <X className="w-3.5 h-3.5 mr-1" />
                                                    Cancelar
                                                </Button>
                                            </div>
                                        </motion.div>
                                    ))}
                            </motion.div>
                        )}
                    </motion.div>
                </div>
            </section>

            {/* MODALES */}
            {modalActivo === 'CAMBIAR' && claseSeleccionada && (
                <div className="fixed inset-0 bg-dark-accent/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
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
                <div className="fixed inset-0 bg-dark-accent/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
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

