import { useEffect, useRef, useState } from "react";
import QrScanner from "qr-scanner";

type QRScannerProps = {
  onScan: (value: string) => void;
  onError?: (message: string) => void;
};

function extractAttendanceToken(value: string): string | null {
  try {
    const url = new URL(value);
    if (!url.pathname.endsWith("/asistencia")) {
      return null;
    }
    const token = url.searchParams.get("token");
    console.log(token);
    return token || null;
  } catch {
    return null;
  }
}

export function QRScanner({ onScan, onError }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    let isDisposed = false;

    const startScanner = async () => {
      try {
        const scanner = new QrScanner(
          video,
          (result) => {
            const token = extractAttendanceToken(result.data);
            if (token) {
              onScan(token);
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
        onError?.(message);
      }
    };

    if (window.BarcodeDetector) {
      const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
      let frameId = 0;

      const scanWithNativeApi = async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) {
          frameId = window.requestAnimationFrame(scanWithNativeApi);
          return;
        }

        try {
          const barcodes = await detector.detect(videoRef.current);
          const match = barcodes.find((barcode) => barcode.rawValue);
          if (match?.rawValue) {
            const token = extractAttendanceToken(match.rawValue);
            if (token) {
              onScan(token);
              return;
            }
          }
        } catch {
          // Fallback to qr-scanner when native API fails mid-scan.
        }

        frameId = window.requestAnimationFrame(scanWithNativeApi);
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
          frameId = window.requestAnimationFrame(scanWithNativeApi);
        })
        .catch(() => {
          void startScanner();
        });

      return () => {
        isDisposed = true;
        window.cancelAnimationFrame(frameId);
        const stream = videoRef.current?.srcObject;
        if (stream instanceof MediaStream) {
          stream.getTracks().forEach((track) => track.stop());
        }
        scannerRef.current?.destroy();
        scannerRef.current = null;
      };
    }

    void startScanner();

    return () => {
      isDisposed = true;
      scannerRef.current?.destroy();
      scannerRef.current = null;
    };
  }, [onError, onScan]);

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
