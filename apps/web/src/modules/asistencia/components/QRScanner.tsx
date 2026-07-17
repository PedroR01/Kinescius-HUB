import { useEffect, useRef, useState } from "react";
import QrScanner from "qr-scanner";

type QRScannerProps = {
  onScan: (value: string) => void;
  onError?: (message: string) => void;
  /** Incrementar tras un error de registro para reactivar la cámara y permitir reintento. */
  rescanNonce?: number;
};

function extractAttendanceToken(value: string): string | null {
  try {
    const url = new URL(value);
    if (!url.pathname.endsWith("/asistencia")) {
      return null;
    }
    const token = url.searchParams.get("token");
    return token || null;
  } catch {
    return null;
  }
}

function stopMediaStream(video: HTMLVideoElement | null) {
  const stream = video?.srcObject;
  if (stream instanceof MediaStream) {
    stream.getTracks().forEach((track) => track.stop());
  }
  if (video) {
    video.srcObject = null;
  }
}

export function QRScanner({ onScan, onError, rescanNonce = 0 }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  const onScanRef = useRef(onScan);
  const onErrorRef = useRef(onError);
  const hasScannedRef = useRef(false);
  const frameIdRef = useRef(0);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    let isDisposed = false;
    hasScannedRef.current = false;
    setCameraError(null);

    const handleValidToken = (token: string) => {
      if (hasScannedRef.current || isDisposed) {
        return;
      }

      hasScannedRef.current = true;
      window.cancelAnimationFrame(frameIdRef.current);
      scannerRef.current?.stop();
      stopMediaStream(videoRef.current);
      onScanRef.current(token);
    };

    const startScanner = async () => {
      try {
        const scanner = new QrScanner(
          video,
          (result) => {
            const token = extractAttendanceToken(result.data);
            if (token) {
              handleValidToken(token);
            }
          },
          {
            preferredCamera: "environment",
            highlightScanRegion: true,
            highlightCodeOutline: true,
          },
        );

        if (isDisposed) {
          scanner.destroy();
          return;
        }

        scannerRef.current = scanner;
        await scanner.start();
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "No se pudo acceder a la cámara.";
        setCameraError(message);
        onErrorRef.current?.(message);
      }
    };

    if (window.BarcodeDetector) {
      const detector = new window.BarcodeDetector({ formats: ["qr_code"] });

      const scanWithNativeApi = async () => {
        if (hasScannedRef.current || isDisposed) {
          return;
        }

        if (!videoRef.current || videoRef.current.readyState < 2) {
          frameIdRef.current = window.requestAnimationFrame(scanWithNativeApi);
          return;
        }

        try {
          const barcodes = await detector.detect(videoRef.current);
          const match = barcodes.find((barcode) => barcode.rawValue);
          if (match?.rawValue) {
            const token = extractAttendanceToken(match.rawValue);
            if (token) {
              handleValidToken(token);
              return;
            }
          }
        } catch {
          // Fallback to qr-scanner when native API fails mid-scan.
        }

        if (!hasScannedRef.current && !isDisposed) {
          frameIdRef.current = window.requestAnimationFrame(scanWithNativeApi);
        }
      };

      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: "environment" } })
        .then((stream) => {
          if (isDisposed || !videoRef.current) {
            stream.getTracks().forEach((track) => track.stop());
            return;
          }
          videoRef.current.srcObject = stream;
          void videoRef.current.play();
          frameIdRef.current = window.requestAnimationFrame(scanWithNativeApi);
        })
        .catch(() => {
          void startScanner();
        });

      return () => {
        isDisposed = true;
        window.cancelAnimationFrame(frameIdRef.current);
        stopMediaStream(videoRef.current);
        scannerRef.current?.destroy();
        scannerRef.current = null;
      };
    }

    void startScanner();

    return () => {
      isDisposed = true;
      window.cancelAnimationFrame(frameIdRef.current);
      scannerRef.current?.destroy();
      scannerRef.current = null;
    };
    // rescanNonce reinicia la cámara tras un error de registro (reintento).
    // onScan/onError se leen vía refs para no reconstruir la cámara en cada render.
  }, [rescanNonce]);

  return (
    <div className="overflow-hidden rounded-ks-lg border border-[rgba(82,183,136,0.18)] bg-black">
      <video
        ref={videoRef}
        className="aspect-square w-full object-cover"
        muted
        playsInline
      />
      {cameraError && (
        <p className="m-0 bg-ks-red-soft px-4 py-3 text-sm text-red-700">
          {cameraError}
        </p>
      )}
    </div>
  );
}
