import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { CheckCircleIcon } from "lucide-react";

export const Route = createFileRoute("/success")({
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
        <h1 className="text-2xl font-semibold">¡Pago confirmado!</h1>
        <p className="text-muted-foreground">
          Tu inscripción fue procesada correctamente. Ya podés ver tus clases reservadas.
        </p>
      </div>
      <Link
        to="/PagarClase"
        className="button button-primary"
      >
        Volver a clases
      </Link>
    </section>
  );
}
