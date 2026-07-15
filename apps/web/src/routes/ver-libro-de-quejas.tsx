import { useEffect, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { MessageSquareText, Calendar, Clock, User2Icon, Star, CalendarClock } from 'lucide-react';

import { API_BASE } from '@/lib/constants';
import { BackPreviousRouteButton } from '@/components/BackPreviousRouteButton';


export const Route = createFileRoute('/ver-libro-de-quejas')({
    component: () => <VerLibroDeQuejas />,
});


interface Comentario {
    idComentario: number;
    comentario: string;
    calificacion: number;
    fechaComentario: string;

    clienteNombre: string;
    clienteApellido: string;

    idClase: number;
    fechaClase: string;
    horaClase: string;
    tipoClase: string;

    profesorNombre: string;
    profesorApellido: string;
}


const formatearFecha = (fechaISO: string) => {
    const fecha = new Date(fechaISO);

    return fecha.toLocaleString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};



export default function VerLibroDeQuejas() {

    const [comentarios, setComentarios] = useState<Comentario[]>([]);
    const [loading, setLoading] = useState(true);



    const cargarComentarios = async () => {

        const token = localStorage.getItem('miToken');
console.log("TOKEN:", token);

        try {

            const res = await fetch(
                `${API_BASE}/libro-quejas/admin/comentarios`,
                {
                    headers:{
                        Authorization:`Bearer ${token}`,
                    },
                }
            );


            if(!res.ok){
                throw new Error('No se pudieron cargar los comentarios');
            }


            const data = await res.json();

            setComentarios(
                Array.isArray(data) ? data : []
            );


        } catch(error){

            console.error(
                'Error cargando libro de quejas:',
                error
            );

        } finally {

            setLoading(false);

        }
    };



    useEffect(()=>{

        cargarComentarios();

    },[]);



    return (

        <div className="min-h-svh flex flex-col">

            <BackPreviousRouteButton />


            <section className="bg-white px-4 py-10">

                <div className="mx-auto max-w-5xl">

                    <div className="flex items-center gap-4 mb-8">

                        <div className="h-14 w-14 rounded-2xl bg-main/10 flex items-center justify-center text-main">
                            <MessageSquareText />
                        </div>


                        <h1 className="text-4xl font-extrabold text-dark-accent">
                            Libro de Quejas
                        </h1>

                    </div>



                    {loading ? (

                        <p className="text-center">
                            Cargando comentarios...
                        </p>


                    ) : comentarios.length === 0 ? (

                        <div className="bg-white rounded-2xl shadow p-8 text-center">
                            No hay comentarios registrados.
                        </div>


                    ) : (

                        <div className="grid gap-5">

                            {comentarios.map((item)=>(

                                <div
                                    key={item.idComentario}
                                    className="bg-white rounded-2xl shadow-md p-6"
                                >


                                    <div className="flex justify-between mb-4">

                                        <div>
                                            <h2 className="font-bold text-xl">
                                                {item.clienteNombre} {item.clienteApellido}
                                            </h2>

                                            <p className="text-sm text-slate-500">
                                                Cliente
                                            </p>
                                        </div>


                                        <div className="flex items-center gap-1 text-yellow-500">

                                            {Array.from(
                                                {length:item.calificacion}
                                            ).map((_,i)=>(
                                                <Star
                                                    key={i}
                                                    size={18}
                                                    fill="currentColor"
                                                />
                                            ))}

                                        </div>

                                    </div>




                                    <p className="italic text-slate-700 mb-5">
                                        "{item.comentario}"
                                    </p>



                                    <div className="grid sm:grid-cols-2 gap-3 text-sm">


                                        <p>
                                            <Calendar className="inline mr-2 w-4"/>
                                            Clase: {item.fechaClase}
                                        </p>


                                        <p>
                                            <Clock className="inline mr-2 w-4"/>
                                            {item.horaClase}
                                        </p>


                                        <p>
                                            Clase:
                                            <b className="ml-1">
                                                {item.tipoClase}
                                            </b>
                                        </p>


                                        <p>
                                            <User2Icon className="inline mr-2 w-4"/>
                                            {item.profesorNombre} {item.profesorApellido}
                                        </p>


                                        <p className="sm:col-span-2 text-slate-500">
                                            <CalendarClock className="inline mr-2 w-4"/>
                                            Comentario escrito el {formatearFecha(item.fechaComentario)}
                                        </p>


                                    </div>


                                </div>

                            ))}


                        </div>

                    )}


                </div>

            </section>


        </div>

    );

}