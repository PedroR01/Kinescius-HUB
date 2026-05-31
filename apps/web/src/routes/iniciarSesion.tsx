import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  btnBase,
  btnPrimary,
  btnSecondary,
  fieldStackClass,
  formCardClass
} from "@/lib/ks-page-styles";
import { AuthPageLayout } from "@/modules/auth/components/AuthPageLayout";
import { AuthFormField } from "@/modules/auth/components/AuthFormField";
import { AuthFeedback } from "@/modules/auth/components/AuthFeedback";

type FormData = {
  email: string;
  passwd: string;
};

const IniciarSesion = () => {
  const navigate = useNavigate();
  const [estaLogueado, setEstaLogueado] = useState(false);
  useEffect(() => {
    const token = localStorage.getItem("miToken");
    if (token) {
      setEstaLogueado(true);
    }
  });

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    email: "",
    passwd: ""
  });
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleInicio = async () => {
    setError("");
    setMessage("");

    if (!formData.email) {
      setError("Debe ingresar su email!");
      return;
    }
    if (!formData.passwd) {
      setError("Debe ingresar su contraseña!");
      return;
    }

    // --- 2. PETICIÓN AL BACKEND (Seguridad) ---
    setIsProcessing(true);
    try {
      const response = await fetch("http://localhost:3000/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: formData.email,
          passwd: formData.passwd
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Guardamos el token que nos devuelve Supabase/NestJS
        localStorage.setItem("miToken", data.token);
        localStorage.setItem("rol", data.rol); //Guardo el rol del usuario (admin o usuario)
        console.log("El rol ingresado es ", data.rol);

        setMessage("Inicio de sesión exitoso!");
        setTimeout(() => {
          navigate({ to: "/home" });
        }, 1000);
      } else {
        //Si el backend dice que las credenciales son inválidas
        setError(data.message || "El email o contraseña ingresados son inválidos");
      }
    } catch (err) {
      console.error("Error de red:", err);
      setError("No se pudo conectar con el servidor.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRecuperacion = async () => {
    setError("");
    setMessage("");

    if (!formData.email) {
      setError(
        'Por favor, ingresá tu email para recuperar la contraseña y vuelve a presionar "Olvidé mi contraseña"'
      );
      return;
    }

    setIsProcessing(true); //que se muestre procesando en el botón
    try {
      const response = await fetch("http://localhost:3000/auth/recuperar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email })
      });

      const data = await response.json();
      if (response.ok) {
        //Seteo el mensaje de éxito que nos manda NestJS, o uno por defecto
        setMessage(data.mensaje || "Vas a recibir una nueva contraseña pronto en tu email.");
        setTimeout(() => {
          navigate({ to: "/" }); //espera un segundo para redirigir al inicio de Kinescius
        }, 1000);
      } else {
        //Y si el backend frena la petición seteo también mensaje
        setError(data.message || "Hubo un error al intentar recuperar la contraseña.");
      }
    } catch (err) {
      console.error("Error de red:", err);
      setError("No se pudo conectar con el servidor.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AuthPageLayout
      title="Inicio de sesión"
      subtitle="Por favor complete sus datos para iniciar sesión"
    >
      {!estaLogueado ? (
        <section className={formCardClass}>
          <form onSubmit={(e) => e.preventDefault()}>
            <div className={fieldStackClass}>
              <AuthFormField
                label="Email:"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
              <AuthFormField
                label="Contraseña:"
                name="passwd"
                type="password"
                value={formData.passwd}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleInicio}
                disabled={isProcessing}
                className={cn(btnBase, btnPrimary)}
              >
                {isProcessing ? "Verificando..." : "Iniciar Sesión"}
              </button>
              <button
                type="button"
                onClick={handleRecuperacion}
                disabled={isProcessing}
                className={cn(btnBase, btnSecondary)}
              >
                {isProcessing ? "Procesando..." : "Olvidé mi contraseña!"}
              </button>
            </div>
            <div className="mt-8 flex flex-col gap-2">
              <p className="text-center text-sm text-ks-gray-text">¿No tenés una cuenta?</p>
              <Link to="/registro">
                <button
                  type="button"
                  disabled={isProcessing}
                  className={cn(btnBase, btnSecondary, "w-full")}
                >
                  Registrate
                </button>
              </Link>
            </div>
          </form>
        </section>
      ) : (
        <section className={formCardClass}>
          <h2 className="m-0 mb-2 font-outfit text-[22px] font-bold tracking-[-0.5px] text-ks-text-dark">
            Tu sesión ya está iniciada!
          </h2>
          <p className="m-0 text-[15px] leading-relaxed text-ks-gray-text">
            Debes cerrar sesión en la página principal si quieres iniciar sesión de nuevo o con otra
            cuenta
          </p>
        </section>
      )}

      <AuthFeedback message={message} error={error} />
    </AuthPageLayout>
  );
};

export const Route = createFileRoute("/iniciarSesion")({
  component: IniciarSesion
});
