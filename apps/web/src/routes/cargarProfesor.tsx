import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { API_BASE } from "@/lib/constants";
import { BackPreviousRouteButton } from "@/components/BackPreviousRouteButton";

export const Route = createFileRoute("/cargarProfesor")({
  component: RouteComponent,
});

const GREEN = "#2DBE7F";
const TEXT = "#0d1f18";
const CARD = "#f0faf5";

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: "10px",
  border: "1px solid rgba(45,190,127,0.25)",
  background: "#ffffff",
  color: TEXT,
  fontSize: "14px",
  outline: "none",
  boxSizing: "border-box",
  marginTop: "6px",
};

const labelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  fontSize: "12px",
  fontWeight: 500,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: GREEN,
};

function RouteComponent() {
  const [dni, setDni] = useState("");
  const [mail, setMail] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [telefono, setTelefono] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isFormValid =
    dni.trim() !== "" &&
    mail.trim() !== "" &&
    nombre.trim() !== "" &&
    apellido.trim() !== "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/admin/clases/profesores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dni: dni.trim(),
          mail: mail.trim(),
          nombre: nombre.trim(),
          apellido: apellido.trim(),
          telefono: telefono.trim() || null,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data?.message ?? data?.error ?? "Error desconocido");
      } else {
        setMessage(data?.message ?? "Profesor cargado correctamente");
        setDni("");
        setMail("");
        setNombre("");
        setApellido("");
        setTelefono("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de red");
    } finally {
      setLoading(false);
    }
  };

  const isButtonDisabled = loading || !isFormValid;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#ffffff",
        padding: "40px 24px",
        boxSizing: "border-box",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <BackPreviousRouteButton className="relative z-10 mb-6" />
      <div
        style={{
          position: "absolute",
          top: "-80px",
          right: "-80px",
          width: "300px",
          height: "300px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(45,190,127,0.1) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          background: "rgba(45,190,127,0.1)",
          border: "1px solid rgba(45,190,127,0.3)",
          borderRadius: "100px",
          padding: "5px 14px",
          marginBottom: "24px",
        }}
      >
        <span
          style={{
            width: "7px",
            height: "7px",
            borderRadius: "50%",
            background: GREEN,
            boxShadow: `0 0 8px ${GREEN}`,
            display: "inline-block",
          }}
        />
        <span
          style={{
            fontSize: "11px",
            fontWeight: 500,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: GREEN,
          }}
        >
          Admin
        </span>
      </div>

      <h1
        style={{
          margin: "0 0 6px",
          fontSize: "36px",
          fontWeight: 700,
          color: TEXT,
          letterSpacing: "-0.01em",
        }}
      >
        Cargar{" "}
        <span style={{ color: GREEN, fontStyle: "italic" }}>profesor</span>
      </h1>
      <p
        style={{
          margin: "0 0 32px",
          fontSize: "14px",
          fontWeight: 300,
          color: "rgba(13,31,24,0.55)",
        }}
      >
        Completá los datos y presioná Cargar profesor.
      </p>
      <div
        style={{
          width: "36px",
          height: "2px",
          background: GREEN,
          boxShadow: `0 0 10px ${GREEN}88`,
          marginBottom: "32px",
        }}
      />

      <div
        style={{
          background: CARD,
          border: "1px solid rgba(45,190,127,0.15)",
          borderRadius: "20px",
          padding: "28px 24px",
          maxWidth: "480px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        <label style={labelStyle}>
          Nombre
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Juan"
            style={inputStyle}
          />
        </label>

        <label style={labelStyle}>
          Apellido
          <input
            type="text"
            value={apellido}
            onChange={(e) => setApellido(e.target.value)}
            placeholder="Ej: Pérez"
            style={inputStyle}
          />
        </label>

        <label style={labelStyle}>
          DNI
          <input
            type="text"
            value={dni}
            onChange={(e) => setDni(e.target.value)}
            placeholder="Ej: 12345678"
            style={inputStyle}
          />
        </label>

        <label style={labelStyle}>
          Mail
          <input
            type="email"
            value={mail}
            onChange={(e) => setMail(e.target.value)}
            placeholder="Ej: juan@mail.com"
            style={inputStyle}
          />
        </label>

        <label style={labelStyle}>
          Teléfono <span style={{ textTransform: "none", fontSize: "11px", opacity: 0.6 }}>(opcional)</span>
          <input
            type="text"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="Ej: 1123456789"
            style={inputStyle}
          />
        </label>

        <button
          type="submit"
          disabled={isButtonDisabled}
          onClick={handleSubmit}
          title={!isFormValid ? "Completá los campos obligatorios para continuar" : undefined}
          style={{
            marginTop: "4px",
            padding: "12px",
            borderRadius: "12px",
            border: "none",
            background: isButtonDisabled ? "rgba(45,190,127,0.35)" : GREEN,
            color: isButtonDisabled ? "rgba(13,31,24,0.4)" : TEXT,
            fontSize: "14px",
            fontWeight: 700,
            letterSpacing: "0.04em",
            cursor: isButtonDisabled ? "not-allowed" : "pointer",
            transition: "background 0.2s, color 0.2s",
          }}
        >
          {loading ? "Cargando..." : "Cargar profesor"}
        </button>

        {message && (
          <p
            style={{
              margin: 0,
              padding: "12px 16px",
              borderRadius: "10px",
              background: "rgba(45,190,127,0.12)",
              border: "1px solid rgba(45,190,127,0.3)",
              color: GREEN,
              fontSize: "13px",
            }}
          >
            ✓ {message}
          </p>
        )}
        {error && (
          <p
            style={{
              margin: 0,
              padding: "12px 16px",
              borderRadius: "10px",
              background: "rgba(220,50,50,0.1)",
              border: "1px solid rgba(220,50,50,0.3)",
              color: "#ff6b6b",
              fontSize: "13px",
            }}
          >
            ✕ {error}
          </p>
        )}
      </div>
    </main>
  );
}