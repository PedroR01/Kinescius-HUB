import React, { useState, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { btnBase, btnPrimary, fieldStackClass, formCardClass } from "@/lib/ks-page-styles";
import { AuthPageLayout } from "@/modules/auth/components/AuthPageLayout";
import { AuthFormField } from "@/modules/auth/components/AuthFormField";
import { AuthFeedback } from "@/modules/auth/components/AuthFeedback";

type FormData = {
  nombre: string;
  apellido: string;
  email: string;
  dni: string;
  telefono: string;
};

const Registro = () => {
  const [estaLogueado, setEstaLogueado] = useState(false);

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
    telefono: ""
  });

  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async () => {
    setError("");
    setMessage("");

    if (!formData.nombre || !formData.apellido || !formData.email || !formData.dni) {
      setError("Debe completar nombre, apellido, email y DNI.");
      return;
    }

    setIsProcessing(true); //Esto bloquea el botón para la carga y pone texto informando (al final del HTML)
    try {
      //Envio los datos al controlador en formato JSON
      const response = await fetch("http://localhost:3000/auth/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const data = await response.json(); //Recibimos la respuesta del back

      if (response.ok) {
        //Si recibo status 201 Significa que se registró el usuario
        setMessage("Registro exitoso. Redirigiendo...");

        //TimeOut va a ser el tiempo en milisegundos que se espera para navegar al inicio de sesión
        setTimeout(() => {
          navigate({ to: "/iniciarSesion" });
        }, 5000);
      } else {
        // Si el backend devuelve BadRequestException por algun error como un dato duplicado, seteamos de error el msje recibido
        setError(data.message);
      }
    } catch (err) {
      // Si el backend está apagado o no hay internet
      console.error("Error de conexion:", err);
      setError("No se pudo conectar con el servidor.");
    } finally {
      setIsProcessing(false); //Se desbloquea el botón
    }
  };

  return (
    <AuthPageLayout
      title="Registro de cliente"
      subtitle='Por favor complete sus datos para registrarse. Al presionar "Registrarme" se le enviará su contraseña por mail'
    >
      {!estaLogueado ? (
        <section className={formCardClass}>
          <form onSubmit={(e) => e.preventDefault()}>
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
                type="button"
                onClick={handleRegister}
                disabled={isProcessing}
                className={cn(btnBase, btnPrimary)}
              >
                {isProcessing ? "Procesando..." : "Registrarme"}
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

export const Route = createFileRoute("/registro")({
  component: Registro
});
