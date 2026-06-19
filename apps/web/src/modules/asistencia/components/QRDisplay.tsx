import { useEffect, useState } from "react";
import QRCode from "react-qr-code";

type QRDisplayProps = {
  qrUrl: string;
  expiresAt: string;
};

function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function QRDisplay({ qrUrl, expiresAt }: QRDisplayProps) {
  const [remainingMs, setRemainingMs] = useState(
    () => new Date(expiresAt).getTime() - Date.now(),
  );

  useEffect(() => {
    const interval = window.setInterval(() => {
      setRemainingMs(new Date(expiresAt).getTime() - Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, [expiresAt]);

  const isExpired = remainingMs <= 0;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative rounded-ks-lg bg-white p-6 shadow-[0_8px_32px_rgba(26,58,42,0.12)]">
        <QRCode value={qrUrl} size={220} />
        {isExpired && (
          <div className="absolute inset-0 flex items-center justify-center rounded-ks-lg bg-black/60">
            <p className="px-4 text-center font-outfit text-sm font-semibold text-white">
              Código expirado
            </p>
          </div>
        )}
      </div>
      <p className="m-0 text-center text-sm text-ks-gray-text">
        {isExpired
          ? "El tiempo para registrar asistencia finalizó."
          : `Tiempo restante: ${formatCountdown(remainingMs)}`}
      </p>
      <p className="m-0 max-w-xs break-all text-center text-xs text-ks-gray-text">
        {qrUrl}
      </p>
    </div>
  );
}
