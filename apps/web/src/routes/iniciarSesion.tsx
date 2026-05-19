import { createFileRoute, useNavigate } from '@tanstack/react-router'
import React, { useState } from 'react';


type FormData = { 
  email: string;
  passwd: string;
};

const IniciarSesion = () => {
  const navigate = useNavigate();

  const [error, setError] = useState ('');
  const [message, setMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    email: '',
    passwd: ''
  });
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value});
  }

  const handleInicio = async () => {
    setError('');
    setMessage('');

    if (!formData.email) {
      setError ('Debe ingresar su email!');
      return;
    }
    if (!formData.passwd) {
      setError ('Debe ingresar su contraseña!');
      return; 
    }

    // --- 2. PETICIÓN AL BACKEND (Seguridad) ---
    setIsProcessing(true);
    try {
      const response = await fetch('http://localhost:3000/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: formData.email, 
          passwd: formData.passwd 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Guardamos el token que nos devuelve Supabase/NestJS
        localStorage.setItem('miToken', data.token);
        
        setMessage('¡Inicio de sesión exitoso!');
        setTimeout(() => {
          navigate({ to: '/' }); //espera un segundo para redirigir al inicio de Kinescius
        }, 1000);
      } else {
        //Si el backend dice que las credenciales son inválidas
        setError(data.message || 'El email o contraseña ingresados son inválidos');
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
      <h1>Inicio de sesión</h1>
      <p>Por favor complete sus datos para iniciar sesión</p>
      
      <form onSubmit={e => e.preventDefault()}>
        <label>Email:</label>
        <input type="email" name="email" value={formData.email} onChange={handleChange} required/> 
        <br />

        <label>Contraseña:</label>
        <input type="password" name="contraseña" value={formData.passwd} onChange={handleChange} required/> 

        <div style={{ marginTop: '1rem' }}>
          <button type="button" onClick={handleInicio} disabled={isProcessing} style={{ marginLeft: '1rem' }}>
            {isProcessing ? 'Verificando...' : 'Iniciar Sesión'} {/*Texto que muestra el botón en base al sistema*/}
          </button>
        </div>
      </form>

      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

export const Route = createFileRoute('/iniciarSesion')({
  component: IniciarSesion
});
