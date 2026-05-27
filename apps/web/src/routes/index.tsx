import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
import { useState, useEffect } from "react";

// Separamos el componente para poder usar Hooks (useState y useEffect)
const PaginaPrincipal = () => {
  // Estado que funciona como un "interruptor" para saber si hay sesión
  const [estaLogueado, setEstaLogueado] = useState(false);

  // useEffect se ejecuta una sola vez cuando el usuario entra a la página
  useEffect(() => {
    // Buscamos el token en la memoria del navegador
    const token = localStorage.getItem('miToken');
    
    // Si el token existe, prendemos el interruptor
    if (token) {
      setEstaLogueado(true);
    }
  }, []);

  // Función para borrar el token y cerrar la sesión
  const cerrarSesion = () => {
    localStorage.removeItem('miToken');
    setEstaLogueado(false); // Apagamos el interruptor
  };

  return (
    <div>
      {/* Reemplacé la etiqueta <body> por <h1> y <p>. 
          En React, la etiqueta <body> ya existe en tu index.html principal, 
          por lo que acá adentro usamos divs o textos normales */}
      <h1>Bienvenidos a Kinescius</h1>
      <p>Kinescius es un centro de rehabilitación</p>

      <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
        
        {/*Si el interruptor está prendido (?) ve una cosa, si no (:) ve otra */}
        {estaLogueado ? (
          <>
            <Link to="/solicitarTurno" className="button button-primary">
              Solicitar turno
            </Link>
             <Link to="/listaEspera" className="button button-primary">
       Ver lista de espera
    </Link>
            <Link to="/cambiarPasswd" className="button button-primary">
              Cambiar contraseña
            </Link>
            <button onClick={cerrarSesion} className="button">
              Cerrar sesión
            </button>
          </>
        ) : (
          <>
            <Link to="/registro" className="button button-primary">
              Registrarse
            </Link>
            <Link to="/iniciarSesion" className="button button-primary">
              Iniciar sesión
            </Link>
          </>
        )}

      </div>
      <div></div>
      <div>
        En Kinescius trabajamos para brindarte una atención profesional, cercana y organizada, acompañándote en cada etapa de tu recuperación y bienestar físico. A través de nuestra plataforma vas a poder gestionar tus turnos de manera simple, rápida y segura, sin necesidad de llamadas ni largas esperas.
        Desde este sitio podrás reservar nuevos turnos online, consultar tus próximos horarios, realizar el seguimiento de tus asistencias y administrar tus sesiones de tratamiento de forma cómoda y accesible. Además, los clientes abonados podrán gestionar sus cuotas y mantener al día toda la información relacionada con su plan de atención.
        Nuestro objetivo es ofrecer una experiencia moderna y práctica, facilitando la organización de cada paciente y permitiéndote enfocarte en lo más importante: tu salud y tu bienestar.
      </div>
    </div>
  );
};

export const Route = createFileRoute("/")({
  component: PaginaPrincipal
});

const GREEN = "#2DBE7F";
const BG = "#ffffff";
const TEXT = "#0d1f18";
const MUTED = "rgba(13, 31, 24, 0.55)";
const CARD = "#f0faf5";

const cards = [
  { to: "/verClases",    num: "01", title: "Ver clases",     desc: "Consultá horarios y disponibilidad", icon: "📅" },
  { to: "/cancelarClase", num: "02", title: "Cancelar clase", desc: "Seleccioná una clase y cancelala",  icon: "❌" },
  { to: "/crearClase",   num: "03", title: "Crear clase",    desc: "Agendá una nueva sesión",            icon: "➕" },
  { to: "/clientes",     num: "04", title: "Clientes",       desc: "Administrá tus pacientes",           icon: "👥" },
];

function NavCard({ to, num, title, desc, icon }: (typeof cards)[0]) {
  return (
    <Link
      to={to}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        padding: "20px",
        borderRadius: "16px",
        border: `1px solid rgba(45,190,127,0.2)`,
        background: CARD,
        textDecoration: "none",
        transition: "background 0.2s, border-color 0.2s, transform 0.2s",
        cursor: "pointer",
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.background = "rgba(45,190,127,0.12)";
        el.style.borderColor = "rgba(45,190,127,0.5)";
        el.style.transform = "translateY(-3px)";
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.background = CARD;
        el.style.borderColor = "rgba(45,190,127,0.2)";
        el.style.transform = "translateY(0)";
      }}
    >
      {/* número */}
      <span style={{ fontSize: "10px", letterSpacing: "0.1em", color: "rgba(45,190,127,0.7)", fontFamily: "monospace" }}>
        {num}
      </span>

      {/* ícono */}
      <div style={{
        width: "40px", height: "40px",
        borderRadius: "10px",
        background: "rgba(45,190,127,0.15)",
        border: `1px solid rgba(45,190,127,0.35)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "18px",
      }}>
        {icon}
      </div>

      {/* título */}
      <p style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: TEXT, lineHeight: 1.2 }}>
        {title}
      </p>

      {/* descripción */}
      <p style={{ margin: 0, fontSize: "12px", fontWeight: 300, color: MUTED, lineHeight: 1.5 }}>
        {desc}
      </p>

      {/* flecha */}
      <span style={{ fontSize: "14px", color: GREEN, marginTop: "4px" }}>↗</span>
    </Link>
  );
}

function Home() {
  return (
    <main style={{
      minHeight: "100vh",
      background: BG,
      padding: "40px 32px 40px",
      position: "relative",
      overflow: "hidden",
      boxSizing: "border-box",
    }}>

      {/* destellos de fondo */}
      <div style={{
        position: "absolute", top: "-100px", right: "-100px",
        width: "380px", height: "380px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(45,190,127,0.12) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: "-60px", left: "-60px",
        width: "250px", height: "250px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(45,190,127,0.08) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* badge */}
      <div style={{
        display: "inline-flex", alignItems: "center", gap: "8px",
        background: "rgba(45,190,127,0.1)",
        border: `1px solid rgba(45,190,127,0.3)`,
        borderRadius: "100px", padding: "5px 14px",
        marginBottom: "28px",
      }}>
        <span style={{
          width: "7px", height: "7px", borderRadius: "50%",
          background: GREEN, boxShadow: `0 0 8px ${GREEN}`,
          display: "inline-block",
        }} />
        <span style={{ fontSize: "11px", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: GREEN }}>
          Centro de rehabilitación
        </span>
      </div>

      {/* título */}
      <h1 style={{
        margin: "0 0 8px",
        fontSize: "clamp(36px, 8vw, 52px)",
        fontWeight: 700,
        lineHeight: 1.08,
        color: TEXT,
        letterSpacing: "-0.01em",
      }}>
        Bienvenido a<br />
        <span style={{ color: GREEN, fontStyle: "italic" }}>Kinescius</span>
      </h1>

      <p style={{ margin: "0 0 32px", fontSize: "14px", fontWeight: 300, letterSpacing: "0.04em", color: MUTED }}>
        Buenos Aires · Sistema de gestión
      </p>

      {/* línea */}
      <div style={{
        width: "36px", height: "2px",
        background: GREEN,
        boxShadow: `0 0 10px ${GREEN}88`,
        marginBottom: "32px",
      }} />

      {/* grid de cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        {cards.map((c) => <NavCard key={c.to} {...c} />)}
      </div>

      {/* footer */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "28px" }}>
        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: GREEN, boxShadow: `0 0 6px ${GREEN}`, display: "inline-block" }} />
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "rgba(13,31,24,0.12)", display: "inline-block" }} />
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "rgba(13,31,24,0.12)", display: "inline-block" }} />
        </div>
        <span style={{ fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(13,31,24,0.18)" }}>
          Kinescius © 2026
        </span>
      </div>
    </main>
  );
}