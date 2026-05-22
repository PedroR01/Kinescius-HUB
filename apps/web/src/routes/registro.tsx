import React, { useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';

type FormData = { 
  nombre: string;
  apellido: string; 
  email: string;
  dni: string;
  telefono: string;
};

const Registro = () => {
  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    apellido: '',
    email: '',
    dni: '',
    telefono: ''
  });

  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async () => {
    setError('');
    setMessage('');

    if (!formData.nombre || !formData.apellido || !formData.email || !formData.dni) {
      setError('Debe completar nombre, apellido, email y DNI.');
      return;
    }

    setIsProcessing(true); //Esto bloquea el botón para la carga y pone texto informando (al final del HTML)
    try {
      //Envio los datos al controlador en formato JSON
      const response = await fetch('http://localhost:3000/auth/registro', {
        method: 'POST',
        headers: {'Content-Type': 'application/json',},
        body: JSON.stringify(formData),
      });

      const data = await response.json(); //Recibimos la respuesta del back

      if (response.ok) {
        //Si recibo status 201 Significa que se registró el usuario
        setMessage('Registro exitoso. Redirigiendo...');
        
        //TimeOut va a ser el tiempo en milisegundos que se espera para navegar al inicio de sesión
        setTimeout(() => {
          navigate({ to: '/iniciarSesion' });
        }, 5000);
      } else {
        // Si el backend devuelve BadRequestException por algun error como un dato duplicado, seteamos de error el msje recibido
        setError(data.message);
      }

    } catch (err) {
      // Si el backend está apagado o no hay internet
      console.error('Error de conexion:', err);
      setError('No se pudo conectar con el servidor.');
    } finally {
      setIsProcessing(false); //Se desbloquea el botón
    }
  };

  return (
    <div>
      <button onClick={() => navigate({to: "/"})}>Volver a la página principal</button>
      <h1>Registro de cliente</h1>
      <p>Por favor complete sus datos para registrarse.</p>

      {/* Como usás el onClick del botón, el onSubmit prevenido acá está perfecto */}
      <form onSubmit={e => e.preventDefault()}>
        <label>Nombre:</label>
        <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required />
        <br />

        <label>Apellido:</label>
        <input type="text" name="apellido" value={formData.apellido} onChange={handleChange} required />
        <br />

        <label>Email:</label>
        <input type="email" name="email" value={formData.email} onChange={handleChange} required />
        <br />

        <label>DNI:</label>
        <input type="text" name="dni" value={formData.dni} onChange={handleChange} required />
        <br />

        <label>Teléfono (es opcional):</label>
        <input type="tel" name="telefono" value={formData.telefono} onChange={handleChange} />
        <br />

        <div style={{ marginTop: '1rem' }}>
          <button type="button" onClick={handleRegister} disabled={isProcessing} style={{ marginLeft: '1rem' }}>
            {isProcessing ? 'Procesando...' : 'Registrarme'} {/*Texto del botón*/}
          </button>
        </div>
      </form>

      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export const Route = createFileRoute('/registro')({
  component: Registro
});