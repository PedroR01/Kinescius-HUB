import { createFileRoute, Link } from '@tanstack/react-router'
import { useMemo, useState } from "react";

// estoy probando hasta q hagamos la bd

const appointmentSlots = [
  {
    key: "4-5-2026-15",
    date: "4/5/2026",
    time: "15hs",
    className: "clase 1",
    price: 100,
    full: false,
    favorAmount: 0,
  },
  {
    key: "4-5-2026-16",
    date: "4/5/2026",
    time: "16hs",
    className: "clase 1",
    price: 100,
    full: false,
    favorAmount: 0,
  },
  {
    key: "4-5-2026-19",
    date: "4/5/2026",
    time: "19hs",
    className: "clase 1",
    price: 100,
    full: true,
    favorAmount: 0,
  },
  {
    key: "6-5-2026-15",
    date: "6/5/2026",
    time: "15hs",
    className: "clase 1",
    price: 100,
    full: false,
    favorAmount: 30,
  },
];

export const Route = createFileRoute('/solicitarTurno')({
  component: RouteComponent,
})

function RouteComponent() {
  const [date, setDate] = useState("4/5/2026");
    const [time, setTime] = useState("15hs");
    const [className, setClassName] = useState("clase 1");
    const [message, setMessage] = useState<string | null>(null);
    const [phase, setPhase] = useState<"idle" | "confirmFavor" | "payment" | "completed">("idle");
    const [selectedSlot, setSelectedSlot] = useState<typeof appointmentSlots[number] | null>(null);
    const [enrollments, setEnrollments] = useState<string[]>([]);
    const [waitList, setWaitList] = useState<string[]>([]);

    const currentSlot = useMemo(
      () => appointmentSlots.find((slot) => slot.date === date && slot.time === time && slot.className === className),
      [date, time, className]
    );

    const priceToPay = currentSlot ? currentSlot.price / 2 : 0;

    const handleSolicitarTurno = () => {
      if (!currentSlot) {
        setMessage("Seleccione una clase válida.");
        return;
      }

      if (currentSlot.full) {
        setMessage("Cupo de la clase lleno. Usted ha sido añadido a la lista de espera si presiona el botón correspondiente.");
        return;
      }

      setSelectedSlot(currentSlot);

      if (currentSlot.favorAmount > 0) {
        setPhase("confirmFavor");
        setMessage(`Este cliente tiene monto a favor de $${currentSlot.favorAmount}. Confirme si desea aplicarlo.`);
        return;
      }

      setPhase("payment");
      setMessage(`Calculando monto a pagar... El monto a pagar es $${priceToPay}. Seleccione método de pago.`);
    };

    const handleAddWaitList = () => {
      if (!currentSlot) {
        setMessage("Seleccione una clase válida.");
        return;
      }

      if (!currentSlot.full) {
        setMessage("Esta clase todavía tiene cupo. Use 'Solicitar turno' para inscribirse.");
        return;
      }

      const waitKey = `${currentSlot.date} ${currentSlot.time} ${currentSlot.className}`;
      if (!waitList.includes(waitKey)) {
        setWaitList((list) => [...list, waitKey]);
      }
      setMessage("Cupo de la clase lleno. Usted ha sido añadido a la lista de espera.");
    };

    const handleConfirmFavor = (apply: boolean) => {
      if (!selectedSlot) {
        setMessage("No hay una clase seleccionada.");
        return;
      }

      if (apply) {
        setPhase("completed");
        const entry = `${selectedSlot.date} ${selectedSlot.time} ${selectedSlot.className}`;
        setEnrollments((list) => [...list, entry]);
        setMessage(`Turno solicitado. Se aplicó el monto a favor de $${selectedSlot.favorAmount}.`);
        return;
      }

      setPhase("payment");
      setMessage(`Monto a pagar $${priceToPay}. Seleccione un método de pago.`);
    };

    const handlePayment = (method: string) => {
      if (!selectedSlot) {
        setMessage("Seleccione la clase antes de elegir un método de pago.");
        return;
      }

      const appointmentKey = `${selectedSlot.date} ${selectedSlot.time} ${selectedSlot.className}`;
      if (selectedSlot.date === "4/5/2026" && selectedSlot.time === "16hs") {
        setPhase("completed");
        setMessage(`No se pudo solicitar el turno. Pago con ${method} fallido.`);
        return;
      }

      setPhase("completed");
      setEnrollments((list) => [...list, appointmentKey]);
      setMessage(`Turno solicitado. Método de pago: ${method}.`);
    };

    return (
      <main className="page-shell">
        <section className="hero-card">
          <h1>Solicitar turno</h1>
          <p>Completa los datos para reservar tu clase en el centro Kinescius.</p>
        </section>

        <section className="form-card">
          <div className="field-row">
            <label>
              Día
              <select value={date} onChange={(event) => setDate(event.target.value)}>
                <option value="4/5/2026">4/5/2026</option>
                <option value="6/5/2026">6/5/2026</option>
              </select>
            </label>
            <label>
              Hora
              <select value={time} onChange={(event) => setTime(event.target.value)}>
                <option value="15hs">15hs</option>
                <option value="16hs">16hs</option>
                <option value="19hs">19hs</option>
              </select>
            </label>
            <label>
              Clase
              <select value={className} onChange={(event) => setClassName(event.target.value)}>
                <option value="clase 1">clase 1</option>
              </select>
            </label>
          </div>

          <div className="actions-row">
            <button className="button button-primary" type="button" onClick={handleSolicitarTurno}>
              Solicitar turno
            </button>
            <button className="button button-secondary" type="button" onClick={handleAddWaitList}>
              Acceder a lista de espera
            </button>
          </div>

          <div className="status-card">
            <h2>Estado actual</h2>
            <p>
              {currentSlot ? (
                <>
                  Clase: <strong>{currentSlot.className}</strong> — Día: <strong>{currentSlot.date}</strong> —
                  Hora: <strong>{currentSlot.time}</strong>
                </>
              ) : (
                "Selecciona una fecha, hora y clase."
              )}
            </p>
            {currentSlot?.full && <p className="status-badge full">Esta clase está completa</p>}
            {currentSlot?.favorAmount ? (
              <p className="status-badge favor">Monto a favor disponible: ${currentSlot.favorAmount}</p>
            ) : null}
          </div>

          {phase === "confirmFavor" && selectedSlot ? (
            <div className="modal-card">
              <p>
                El cliente tiene <strong>${selectedSlot.favorAmount}</strong> de monto a favor. ¿Desea aplicarlo?
              </p>
              <div className="actions-row">
                <button className="button button-primary" type="button" onClick={() => handleConfirmFavor(true)}>
                  Aplicar monto a favor
                </button>
                <button className="button button-secondary" type="button" onClick={() => handleConfirmFavor(false)}>
                  Pagar sin monto a favor
                </button>
              </div>
            </div>
          ) : null}

          {phase === "payment" && selectedSlot ? (
            <div className="modal-card">
              <p>Monto a pagar: <strong>${priceToPay}</strong></p>
              <p>Elige un método de pago simulado:</p>
              <div className="actions-row">
                <button className="button button-primary" type="button" onClick={() => handlePayment("tarjeta")}>Tarjeta</button>
                <button className="button button-secondary" type="button" onClick={() => handlePayment("transferencia")}>Transferencia</button>
              </div>
            </div>
          ) : null}

          {message ? (
            <div className="message-card">
              <p>{message}</p>
            </div>
          ) : null}
        </section>

        <section className="info-card">
          <div>
            <h2>Turnos inscriptos</h2>
            <ul>
              {enrollments.length === 0 ? <li>No hay inscripciones aún.</li> : enrollments.map((entry) => <li key={entry}>{entry}</li>)}
            </ul>
          </div>
          <div>
            <h2>Lista de espera</h2>
            <ul>
              {waitList.length === 0 ? <li>No hay lista de espera.</li> : waitList.map((entry) => <li key={entry}>{entry}</li>)}
            </ul>
          </div>
        </section>

        <section className="form-card">
          <Link to="/" className="button button-secondary">
            Volver al inicio
          </Link>
        </section>
      </main>
    )
}
