import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { CheckCircleIcon } from "lucide-react";

export const Route = createFileRoute("/success-abonado")({
    component: SuccessPage,
});

function SuccessPage() {
    useEffect(() => {
        const channel = new BroadcastChannel("kinescius-payment");
        channel.postMessage({ type: "payment-completed" });
        channel.close();
    }, []);

    return (
        <section className="form-card flex flex-col items-center gap-6 py-12 text-center">
            <CheckCircleIcon className="size-16 text-main" strokeWidth={1.5} />
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-semibold">¡Pago de mensualidad exitoso!</h1>
                <p className="text-muted-foreground">
                    Tu pago fue exitoso, así que ya estás registrado en el sistema y puedes iniciar sesión con la contraseña que se envió a tu mail.
                </p>
            </div>
            <Link
                to="/iniciarSesion"
                search={{ redirect: undefined }}
                className="button button-primary"
            >
                Iniciar sesión
            </Link>
        </section>
    );
}
