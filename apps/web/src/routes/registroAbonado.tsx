import React, { useState, useEffect } from "react";
import { createFileRoute, /*useNavigate*/ } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { btnBase, btnPrimary, fieldStackClass, formCardClass } from "@/lib/ks-page-styles";
import { AuthPageLayout } from "@/modules/auth/components/AuthPageLayout";
import { AuthFormField } from "@/modules/auth/components/AuthFormField";
import { AuthFeedback } from "@/modules/auth/components/AuthFeedback";
//import { API_BASE } from "@/lib/constants";
import { createMensualidadPreference } from "@/api/payments";

type FormData = {
  nombre: string;
  apellido: string;
  email: string;
  dni: string;
  rol: number;
  telefono: string;
};

const RegistroAbonado = () => {
  const [estaLogueado, setEstaLogueado] = useState(false);
  //const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("miToken");
    if (token) {
      setEstaLogueado(true);
    }
  });

  const [formData, setFormData] = useState<FormData>({
    nombre: "",
    apellido: "",
    email: "",
    dni: "",
    rol: 3,
    telefono: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!formData.nombre || !formData.apellido || !formData.email || !formData.dni) {
      setError("Debe completar nombre, apellido, email y DNI.");
      return;
    }

    setIsProcessing(true); //Esto bloquea el botón para la carga y pone texto informando (al final del HTML)
    try {
      const { initPoint } = await createMensualidadPreference({ ...formData });

      setMessage("Se abrió la ventana de Mercado Pago. Completá el pago para finalizar tu registro.");
      window.open(initPoint, "_blank", "noopener")
    } catch (err) {
      console.error("Error:", err);
      setError(err instanceof Error ? err.message : "No se pudo conectar con el servidor.");
    } finally {
      setIsProcessing(false); //Se desbloquea el botón
    }
  };

  return (
    <AuthPageLayout
      title="Registro de cliente abonado"
      subtitle='Por favor complete sus datos para registrarse. Al presionar "Registrarme como abonado" se le redirigirá al pago de su mensualidad'
    >
      {!estaLogueado ? (
        <section className={formCardClass}>
          <form onSubmit={handleRegister}>
            <div className={fieldStackClass}>
              <AuthFormField
                label="Nombre:"
                name="nombre"
                type="text"
                value={formData.nombre}
                onChange={handleChange}
                required
              />
              <AuthFormField
                label="Apellido:"
                name="apellido"
                type="text"
                value={formData.apellido}
                onChange={handleChange}
                required
              />
              <AuthFormField
                label="Email:"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
              <AuthFormField
                label="DNI:"
                name="dni"
                type="text"
                value={formData.dni}
                onChange={handleChange}
                required
              />
              <AuthFormField
                label="Teléfono (es opcional):"
                name="telefono"
                type="tel"
                value={formData.telefono}
                onChange={handleChange}
              />
            </div>
            <div className="mt-4">
              <button
                type="submit"
                disabled={isProcessing}
                className={cn(btnBase, btnPrimary)}
              >
                {isProcessing ? "Procesando..." : "Registrarme como abonado"}
              </button>
            </div>
          </form>
        </section>
      ) : (
        <section className={formCardClass}>
          <h2 className="m-0 mb-2 font-outfit text-[22px] font-bold tracking-[-0.5px] text-ks-text-dark">
            Ya estás validado!
          </h2>
          <p className="m-0 text-[15px] leading-relaxed text-ks-gray-text">
            Debes cerrar sesión si quieres registrar otro usuario
          </p>
        </section>
      )}

      <AuthFeedback message={message} error={error} />
    </AuthPageLayout>
  );
};

export const Route = createFileRoute("/registroAbonado")({
  component: RegistroAbonado
});
