import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';

type ClaseInfo = {
  id: number;
  tipo: string;
  fecha: string;
  hora: string;
};

export const Route = createFileRoute('/confirmar-turno')({
  component: ConfirmarTurnoPage,
});

function ConfirmarTurnoPage() {
  const { token, claseId, clienteId } = Route.useSearch() as {
    token: string;
    claseId: string;
    clienteId: string;
  };

  const [clase, setClase] = useState<ClaseInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmando, setConfirmando] = useState(false);
  const [exito, setExito] = useState(false);

  useEffect(() => {
    const validar = async () => {
      try {
        const res = await fetch(
          `http://localhost:3000/confirmar-turno/validar?token=${token}&claseId=${claseId}&clienteId=${clienteId}`
        );
        const data = await res.json();
        if (!res.ok) {
          setError(data.message);
        } else {
          setClase(data.clase);
        }
      } catch {
        setError('Error al conectar con el servidor.');
      } finally {
        setLoading(false);
      }
    };
    validar();
  }, [token, claseId, clienteId]);

  const handleConfirmar = async () => {
    setConfirmando(true);
    try {
      const res = await fetch('http://localhost:3000/confirmar-turno', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteId: Number(clienteId),
          claseId: Number(claseId),
          token,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message);
      } else {
        setExito(true);
      }
    } catch {
      setError('Error al conectar con el servidor.');
    } finally {
      setConfirmando(false);
    }
  };

  if (loading) return (
    <div style={styles.container}>
      <p style={styles.texto}>Validando tu enlace...</p>
    </div>
  );

  if (exito) return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={{ color: '#1a6b4a' }}>✅ Turno solicitado</h2>
        <p style={styles.texto}>Tu turno fue confirmado exitosamente.</p>
      </div>
    </div>
  );

  if (error) return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={{ color: '#c0392b' }}>❌ Error</h2>
        <p style={styles.texto}>{error}</p>
      </div>
    </div>
  );

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={{ color: '#1a6b4a', marginBottom: 8 }}>Confirmar turno</h2>
        <p style={styles.texto}>Estás por reservar tu lugar en:</p>

        <div style={styles.infoBox}>
          <p><strong>Tipo:</strong> {clase?.tipo}</p>
          <p><strong>Fecha:</strong> {clase?.fecha}</p>
          <p><strong>Horario:</strong> {clase?.hora?.substring(0, 5)} hs</p>
        </div>

        <p style={styles.texto}>
          Para confirmar debés abonar la seña correspondiente.
        </p>

        <button
          onClick={handleConfirmar}
          disabled={confirmando}
          style={styles.boton}
        >
          {confirmando ? 'Procesando...' : 'Confirmar turno'}
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f4f6f9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  } as React.CSSProperties,
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: '40px',
    maxWidth: 500,
    width: '100%',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  } as React.CSSProperties,
  infoBox: {
    backgroundColor: '#f0f7f4',
    borderLeft: '4px solid #1a6b4a',
    borderRadius: 6,
    padding: '16px 20px',
    marginBottom: 20,
  } as React.CSSProperties,
  texto: {
    color: '#555555',
    fontSize: 15,
    lineHeight: 1.6,
  } as React.CSSProperties,
  boton: {
    backgroundColor: '#1a6b4a',
    color: '#ffffff',
    border: 'none',
    borderRadius: 8,
    padding: '14px 36px',
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
    width: '100%',
  } as React.CSSProperties,
};