import { useState, useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { motion } from 'motion/react';
import { Calendar, Clock, ArrowRightLeft, X, User2Icon } from 'lucide-react';
import { CambiarTurno } from '../modules/turnos/components/cambiarTurnoModal';
import { CancelarTurno } from '../modules/turnos/components/cancelarTurnoModal';
import { Button } from '@/components/ui/button';
import { BackPreviousRouteButton } from '@/components/BackPreviousRouteButton';
import { EASE_OUT, fadeUp, staggerContainer } from '@/lib/motion';
import { API_BASE } from '@/lib/constants';
import { useClienteId } from '@/hooks/useClienteId';
import type { KinesciusClass } from '@/lib/class-interface';

export const Route = createFileRoute('/mis-clases')({
    component: () => <GestionClases />,
});

interface MisInscripciones {
    id_clase: number;
    id_cliente: number;
    monto_a_favor?: boolean;
    fuera_de_cuota?: boolean;
    estado_historial?: string;
    Clase: KinesciusClass;
}

export default function GestionClases() {
    const [misClases, setMisClases] = useState<MisInscripciones[]>([]);
    const [historialClases, setHistorialClases] = useState<MisInscripciones[]>([]);
    const [activeTab, setActiveTab] = useState<'PROXIMAS' | 'HISTORIAL'>('PROXIMAS');
    const [modalActivo, setModalActivo] = useState<'CAMBIAR' | 'CANCELAR' | null>(null);
    const [claseSeleccionada, setClaseSeleccionada] = useState<MisInscripciones | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [mensajeExito, setMensajeExito] = useState<string | null>(null);

    const { clienteId: idCliente, rol, isLoading: clienteLoading } = useClienteId();
    const esAbonado = rol === 3;

    const cargarClases = () => {
        if (!idCliente) return;
        setIsLoading(true);
        
        Promise.all([
            fetch(`${API_BASE}/shifts/mis-clases/${idCliente}`).then((res) => res.json()),
            fetch(`${API_BASE}/shifts/historial/${idCliente}`).then((res) => res.json())
        ])
        .then(([dataProximas, dataHistorial]) => {
            setMisClases(Array.isArray(dataProximas) ? dataProximas : []);
            setHistorialClases(Array.isArray(dataHistorial) ? dataHistorial : []);
            setIsLoading(false);
        })
        .catch((err) => {
            console.error("Error al traer clases:", err);
            setIsLoading(false);
        });
    };

    useEffect(() => {
        if (idCliente) {
            cargarClases();
        } else if (!clienteLoading) {
            setIsLoading(false);
        }
    }, [idCliente, clienteLoading]);

    const abrirModal = (tipo: 'CAMBIAR' | 'CANCELAR', clase: MisInscripciones) => {
        setClaseSeleccionada(clase);
        setModalActivo(tipo);
    };

    const cerrarModal = () => {
        setModalActivo(null);
        setClaseSeleccionada(null);
    };

    const handleExito = (message?: string) => {
        if (message) {
            setMensajeExito(message);
        }
        cerrarModal();
        cargarClases();
    };

    const formatDate = (dateString: string) => {
        const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
        const date = new Date(dateString + 'T00:00:00');
        const formatted = date.toLocaleDateString('es-AR', options);
        return formatted.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    const getEstadoBadge = (estado?: string) => {
        switch (estado) {
            case 'Completada':
                return <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">Completada</span>;
            case 'Turno cancelado':
            case 'Clase cancelada':
                return <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">{estado}</span>;
            default:
                return <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded-full">{estado || 'Activa'}</span>;
        }
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
                                    <Calendar className="w-8 h-8" strokeWidth={2} />
                                </div>
                                <h1 className="font-heading text-4xl font-extrabold leading-[1.12] text-dark-accent sm:text-5xl">
                                    Mis Clases
                                </h1>
                            </div>
                            <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                                Gestioná tus próximos turnos y mantené tu rutina al día. Revisa, cambia o cancela tus clases programadas con facilidad.
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
                    <motion.div
                        variants={staggerContainer(0.12)}
                        initial="hidden"
                        animate="visible"
                    >
                        <div className="flex gap-4 mb-8 border-b border-slate-200">
                            <button
                                className={`pb-4 px-2 font-semibold text-lg border-b-2 transition-colors ${
                                    activeTab === 'PROXIMAS' 
                                    ? 'border-main text-main' 
                                    : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                                onClick={() => setActiveTab('PROXIMAS')}
                            >
                                Próximas Clases
                            </button>
                            <button
                                className={`pb-4 px-2 font-semibold text-lg border-b-2 transition-colors ${
                                    activeTab === 'HISTORIAL' 
                                    ? 'border-main text-main' 
                                    : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                                onClick={() => setActiveTab('HISTORIAL')}
                            >
                                Ver historial
                            </button>
                        </div>

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
                        ) : activeTab === 'HISTORIAL' && historialClases.filter((item) => item.Clase !== null).length === 0 ? (
                            <motion.div variants={fadeUp} className="bg-white rounded-3xl p-12 text-center shadow-md">
                                <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-slate-500 mb-6">
                                    <Clock className="w-10 h-10" />
                                </div>
                                <h3 className="font-heading text-2xl font-bold text-dark-accent mb-3">No hay historial</h3>
                                <p className="text-muted-foreground text-lg max-w-md mx-auto">
                                    Aún no tenés clases pasadas ni canceladas en tu registro.
                                </p>
                            </motion.div>
                        ) : (
                            <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                {(activeTab === 'PROXIMAS' ? misClases : historialClases)
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
                                            <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-main/10 to-transparent rounded-bl-full -z-10" />
                                            <div className="p-5 flex-1">
                                                <div className="flex justify-between items-start mb-4">
                                                    <h3 className="font-heading font-extrabold text-2xl text-main tracking-tight leading-tight">
                                                        {item.Clase.tipo}
                                                    </h3>
                                                    {activeTab === 'HISTORIAL' && (
                                                        <div>{getEstadoBadge(item.estado_historial)}</div>
                                                    )}
                                                </div>
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
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-main/10 text-main shrink-0">
                                                            <User2Icon className="w-4 h-4" strokeWidth={2.5} />
                                                        </div>
                                                        <span className="font-medium text-slate-700 text-[15px]">
                                                            {item.Clase.profesor}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            {activeTab === 'PROXIMAS' && (
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
                                            )}
                                        </motion.div>
                                    ))}
                            </motion.div>
                        )}
                    </motion.div>
                </div>
            </section>

            {modalActivo === 'CAMBIAR' && claseSeleccionada && (
                <div className="fixed inset-0 bg-dark-accent/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
                    <CambiarTurno
                        clienteId={claseSeleccionada.id_cliente}
                        claseActualId={claseSeleccionada.id_clase}
                        actividad={claseSeleccionada.Clase.tipo}
                        fechaActual={claseSeleccionada.Clase.fecha}
                        horaActual={claseSeleccionada.Clase.hora}
                        horasOcupadasMismoDia={misClases
                            .filter(c => c.Clase?.fecha === claseSeleccionada.Clase.fecha && c.id_clase !== claseSeleccionada.id_clase)
                            .map(c => c.Clase.hora.slice(0, 5))}
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
                        pagoConMontoAFavor={Boolean(claseSeleccionada.monto_a_favor)}
                        esAbonado={esAbonado}
                        esClaseFueraDeCuota={Boolean(claseSeleccionada.fuera_de_cuota)}
                        onClose={cerrarModal}
                        onCancelSuccess={handleExito}
                    />
                </div>
            )}
        </div>
    );
}