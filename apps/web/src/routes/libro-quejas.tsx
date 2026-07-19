import { useState, useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { motion } from 'motion/react';
import { MessageSquareText, Calendar, Clock, User2Icon, X } from 'lucide-react';
import { StarRating } from '../modules/libroQuejas/StarRating';
import { ComentarioForm } from '../modules/libroQuejas/ComentarioForm';
import { BackPreviousRouteButton } from '@/components/BackPreviousRouteButton';
import { EASE_OUT, fadeUp, staggerContainer } from '@/lib/motion';
import { API_BASE } from '@/lib/constants';
import { useClienteId } from '@/hooks/useClienteId';

export const Route = createFileRoute('/libro-quejas')({
    component: () => <LibroDeQuejas />,
});

interface HistorialClase {
    idClase: number;
    fecha: string;
    hora: string;
    tipo: string | null;
    profesorNombre: string;
    profesorApellido: string;
    calificacion: number | null;
    comentario: string | null;
}

export default function LibroDeQuejas() {
    const [historial, setHistorial] = useState<HistorialClase[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [claseSeleccionada, setClaseSeleccionada] = useState<HistorialClase | null>(null);
    const [mensajeExito, setMensajeExito] = useState<string | null>(null);

    const { clienteId: idCliente, isLoading: clienteLoading } = useClienteId();

    const cargarHistorial = () => {
        if (!idCliente) return;
        setIsLoading(true);
        const token = localStorage.getItem('miToken');

        fetch(`${API_BASE}/libro-quejas/cliente/${idCliente}/historial`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => {
                setHistorial(Array.isArray(data) ? data : []);
                setIsLoading(false);
            })
            .catch((err) => {
                console.error('Error al traer historial:', err);
                setIsLoading(false);
            });
    };

    useEffect(() => {
        if (idCliente) {
            cargarHistorial();
        } else if (!clienteLoading) {
            setIsLoading(false);
        }
    }, [idCliente, clienteLoading]);

    const formatDate = (dateString: string) => {
        const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
        const date = new Date(dateString + 'T00:00:00');
        const formatted = date.toLocaleDateString('es-AR', options);
        return formatted.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    };

    return (
        <div className="min-h-svh flex flex-col">
            <BackPreviousRouteButton />
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
                                    <MessageSquareText className="w-8 h-8" strokeWidth={2} />
                                </div>
                                <h1 className="font-heading text-4xl font-extrabold leading-[1.12] text-dark-accent sm:text-5xl">
                                    Libro de Quejas
                                </h1>
                            </div>
                            <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                                Contanos cómo fue tu experiencia en las clases a las que asististe.
                            </p>
                            {mensajeExito && (
                                <p className="mt-4 max-w-2xl rounded-2xl bg-main/10 px-4 py-3 text-sm font-medium text-main">
                                    {mensajeExito}
                                </p>
                            )}
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            <section className="bg-surface flex-1 px-4 py-10 sm:px-6 sm:py-12 lg:py-16">
                <div className="mx-auto w-full max-w-5xl">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="w-12 h-12 border-4 border-main/20 border-t-main rounded-full animate-spin" />
                            <p className="text-muted-foreground font-medium text-lg">Cargando tu historial...</p>
                        </div>
                    ) : historial.length === 0 ? (
                        <div className="bg-white rounded-3xl p-12 text-center shadow-md">
                            <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-main/5 text-main mb-6">
                                <MessageSquareText className="w-10 h-10" />
                            </div>
                            <h3 className="font-heading text-2xl font-bold text-dark-accent mb-3">No tenés clases pasadas</h3>
                            <p className="text-muted-foreground text-lg max-w-md mx-auto">
                                Cuando termines tu primera clase, vas a poder calificarla acá.
                            </p>
                        </div>
                    ) : (
                        <motion.div
                            variants={staggerContainer(0.08)}
                            initial="hidden"
                            animate="visible"
                            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6"
                        >
                            {historial.map((item) => (
                                <motion.div
                                    key={item.idClase}
                                    variants={fadeUp}
                                    whileHover={{ y: -6 }}
                                    transition={EASE_OUT}
                                    className="bg-white rounded-2xl shadow-md relative overflow-hidden flex flex-col transition-shadow hover:shadow-xl"
                                >
                                    <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-main/10 to-transparent rounded-bl-full -z-10" />
                                    <div className="p-5 flex-1">
                                        <h3 className="font-heading font-extrabold text-2xl text-main tracking-tight leading-tight mb-4">
                                            {item.tipo}
                                        </h3>
                                        <div className="flex flex-col gap-3">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-main/10 text-main shrink-0">
                                                    <Calendar className="w-4 h-4" strokeWidth={2.5} />
                                                </div>
                                                <span className="font-medium text-slate-700 text-[15px]">
                                                    {formatDate(item.fecha)}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-main/10 text-main shrink-0">
                                                    <Clock className="w-4 h-4" strokeWidth={2.5} />
                                                </div>
                                                <span className="font-medium text-slate-700 text-[15px]">
                                                    {item.hora.slice(0, 5)} hs
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-main/10 text-main shrink-0">
                                                    <User2Icon className="w-4 h-4" strokeWidth={2.5} />
                                                </div>
                                                <span className="font-medium text-slate-700 text-[15px]">
                                                    {item.profesorNombre} {item.profesorApellido}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 pt-0 mt-auto">
                                        {item.calificacion !== null ? (
                                            <button
                                                type="button"
                                                onClick={() => setClaseSeleccionada(item)}
                                                className="w-full text-left flex flex-col gap-1 rounded-xl p-2 -m-2 hover:bg-main/5 transition-colors"
                                            >
                                                <StarRating value={item.calificacion} readOnly size={16} />
                                                {item.comentario && (
                                                    <p className="text-xs text-slate-500 italic line-clamp-2">
                                                        "{item.comentario}"
                                                    </p>
                                                )}
                                                <span className="text-[11px] font-semibold text-main mt-1">
                                                    Editar comentario
                                                </span>
                                            </button>
                                        ) : (
                                            <button
                                                className="w-full rounded-xl text-xs font-semibold py-2 bg-main/10 text-main hover:bg-main/20 transition-colors"
                                                onClick={() => setClaseSeleccionada(item)}
                                            >
                                                Dejar comentario
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </div>
            </section>

            {claseSeleccionada && idCliente && (
                <div className="fixed inset-0 bg-dark-accent/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="relative w-full max-w-md">
                        <button
                            onClick={() => setClaseSeleccionada(null)}
                            className="absolute -top-3 -right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md text-slate-500 hover:text-slate-700"
                        >
                            <X className="w-4 h-4" />
                        </button>
                        <ComentarioForm
                            idCliente={idCliente}
                            idClase={claseSeleccionada.idClase}
                            claseNombre={claseSeleccionada.tipo ?? undefined}
                            claseFecha={formatDate(claseSeleccionada.fecha)}
                            comentarioExistente={claseSeleccionada.comentario ?? undefined}
                            calificacionExistente={claseSeleccionada.calificacion ?? undefined}
                            onSuccess={() => {
                                setMensajeExito('Gracias por su comentario');
                                cargarHistorial();
                                setTimeout(() => setClaseSeleccionada(null), 1800);
                            }}
                            onEliminado={() => {
                                setMensajeExito('Comentario eliminado');
                                cargarHistorial();
                                setClaseSeleccionada(null);
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}