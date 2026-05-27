import { createFileRoute, useNavigate } from '@tanstack/react-router';
import React, { useState } from 'react';

type FormData = {
  passwdActual: string;
  passwdNueva: string;
  passwdConfirmacion: string; 
};


const CambiarPasswd = () => {
  const navigate = useNavigate(); 

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
    <div>
      <button onClick={() => navigate({to: "/"})}>Volver a la página principal</button>
      <h1>Cambio de contraseña</h1>
      <p>Por favor ingrese su contraseña actual, y la nueva contraseña en los dos campos que la solicitan.</p>

      <form onSubmit={e => e.preventDefault()}>
         
        <label>Contraseña actual:</label>
        <input type="password" name="passwdActual" value={formData.passwdActual} onChange={handleChange} required />
        <br />

        <label>Contraseña nueva:</label>
        <input type="password" name="passwdNueva" value={formData.passwdNueva} onChange={handleChange} required />
        <br />

        <label>Vuelva a ingresar su nueva contraseña:</label>
        <input type="password" name="passwdConfirmacion" value={formData.passwdConfirmacion} onChange={handleChange} required />
        <br />

        <div style={{ marginTop: '1rem' }}>
          <button type="button" onClick={handleCambioPasswd} disabled={isProcessing}>
            {isProcessing ? 'Procesando...' : 'Cambiar contraseña'}
          </button>
        </div>
      </form>

      {message && <p style={{ color: 'green', marginTop: '1rem' }}>{message}</p>}
      {error && <p style={{ color: 'red', marginTop: '1rem' }}>{error}</p>}
    </div>
  );
}

export const Route = createFileRoute('/cambiarPasswd')({
  component: CambiarPasswd,
});