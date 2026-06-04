import { createFileRoute, useNavigate } from '@tanstack/react-router';
import React, { useState, useEffect } from 'react';
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
  passwdActual: string;
  passwdNueva: string;
  passwdConfirmacion: string; 
};

const CambiarPasswd = () => {
  const navigate = useNavigate(); 

  const [estaLogueado, setEstaLogueado] = useState(false);
     useEffect(() => {
      const token = localStorage.getItem('miToken');
      if (token) {
        setEstaLogueado(true);
      }
    })

  const [formData, setFormData] = useState<FormData>({
    passwdActual: '',
    passwdNueva: '',
    passwdConfirmacion: ''
  });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  //esta función toma el dato ingresado y lo registra
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  //envío de los datos al backend
  const handleCambioPasswd = async () => {
    setError('');
    setMessage('');

    //-----Validaciones previas: que ingrese todo, y que las passwd sean iguales
    if (!formData.passwdActual || !formData.passwdNueva || !formData.passwdConfirmacion) {
      setError('Debe completar todos los campos.');
      return;
    }
    if (formData.passwdNueva !== formData.passwdConfirmacion) {
      setError('Las contraseñas nuevas no coinciden.');
      return;
    }
    if (formData.passwdNueva.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setIsProcessing(true);
    try {
      // Agarro el token de la sesión actual
      const token = localStorage.getItem('miToken');

      const response = await fetch('http://localhost:3000/auth/cambiar-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          passwdActual: formData.passwdActual,
          passwdNueva: formData.passwdNueva 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('¡Contraseña actualizada con éxito!');
        //Si hay éxito, borramos los campos 
        setFormData({ passwdActual: '', passwdNueva: '', passwdConfirmacion: '' });
      } else {
        setError(data.message || 'Hubo un error al cambiar la contraseña.');
      }
    } catch (err) {
      console.error('Error de red:', err);
      setError('No se pudo conectar con el servidor.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AuthPageLayout
      title="Cambio de contraseña"
      subtitle="Por favor ingrese su contraseña actual, y la nueva contraseña para actualizarla."
    >
      {estaLogueado ? (
        <section className={formCardClass}>
          <form onSubmit={e => e.preventDefault()}>
            <div className={fieldStackClass}>
              <AuthFormField
                label="Contraseña actual:"
                name="passwdActual"
                type="password"
                value={formData.passwdActual}
                onChange={handleChange}
                required
              />
              <AuthFormField
                label="Contraseña nueva:"
                name="passwdNueva"
                type="password"
                value={formData.passwdNueva}
                onChange={handleChange}
                required
              />
              <AuthFormField
                label="Vuelva a ingresar su nueva contraseña:"
                name="passwdConfirmacion"
                type="password"
                value={formData.passwdConfirmacion}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="mt-4 flex flex-col gap-3">
              <button 
                type="button" 
                onClick={handleCambioPasswd} 
                disabled={isProcessing}
                className={cn(btnBase, btnPrimary, "w-full")}
              >
                {isProcessing ? 'Procesando...' : 'Cambiar contraseña'}
              </button>
            </div>

            <div className="mt-8 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => navigate({to: "/"})}
                className={cn(btnBase, btnSecondary, "w-full")}
              >
                Volver a la página principal
              </button>
            </div>
          </form>
        </section>
      ) : (
        <section className={formCardClass}>
          <h2 className="m-0 mb-2 font-outfit text-[22px] font-bold tracking-[-0.5px] text-ks-text-dark">
            No iniciaste sesión!
          </h2>
          <p className="m-0 mb-6 text-[15px] leading-relaxed text-ks-gray-text">
            Vuelve a la página principal e inicia sesión para cambiar tu contraseña.
          </p>
          <button
            type="button"
            onClick={() => navigate({to: "/"})}
            className={cn(btnBase, btnSecondary, "w-full")}
          >
            Volver a la página principal
          </button>
        </section>
      )}

      <AuthFeedback message={message} error={error} />
    </AuthPageLayout>
  );
}

export const Route = createFileRoute('/cambiarPasswd')({
  component: CambiarPasswd,
});