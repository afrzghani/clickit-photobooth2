"use client";

import { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Camera, Warning } from "@phosphor-icons/react";

interface CameraViewProps {
  glamEnabled: boolean;
  onPhotoCaptured: (dataUrl: string) => void;
  photoCount: number; // how many photos taken so far (0,1,2)
}

export interface CameraViewHandle {
  capture: () => void;
}

const CameraView = forwardRef<CameraViewHandle, CameraViewProps>(
  function CameraView({ glamEnabled, onPhotoCaptured, photoCount }, ref) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [error, setError] = useState<string | null>(null);
    const [isFlashing, setIsFlashing] = useState(false);
    const [mirrored] = useState(true);

    useEffect(() => {
      let stream: MediaStream | null = null;

      async function startCamera() {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: "user",
              width: { ideal: 1280 },
              height: { ideal: 960 },
            },
            audio: false,
          });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch {
          setError(
            "Kamera tidak bisa diakses. Pastikan izin kamera sudah diberikan."
          );
        }
      }

      startCamera();
      return () => {
        stream?.getTracks().forEach((t) => t.stop());
      };
    }, []);

    const capture = useCallback(async () => {
      if (!videoRef.current || !canvasRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d")!;

      // Draw video directly in normal orientation for un-mirrored output photo
      ctx.drawImage(video, 0, 0);

      // Apply glam if enabled
      if (glamEnabled) {
        try {
          const { applyGlamEffect, initGlamBooth } = await import(
            "@/lib/mediapipe"
          );
          await initGlamBooth();
          const glamCanvas = await applyGlamEffect(canvas);
          const glamCtx = canvas.getContext("2d")!;
          glamCtx.clearRect(0, 0, canvas.width, canvas.height);
          glamCtx.drawImage(glamCanvas, 0, 0);
        } catch {
          // Continue without glam on error
        }
      }

      // Flash
      setIsFlashing(true);
      setTimeout(() => setIsFlashing(false), 350);

      const dataUrl = canvas.toDataURL("image/jpeg", 1.0);
      onPhotoCaptured(dataUrl);
    }, [glamEnabled, mirrored, onPhotoCaptured]);

    useImperativeHandle(ref, () => ({ capture }), [capture]);

    if (error) {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
            padding: "3rem",
            background: "var(--bg-surface)",
            borderRadius: "var(--radius-kiosk)",
            border: "1px solid var(--border)",
            textAlign: "center",
          }}
        >
          <Warning size={48} color="#ffc800" />
          <p style={{ color: "var(--text-secondary)", maxWidth: "320px" }}>
            {error}
          </p>
        </div>
      );
    }

    return (
      <div style={{ position: "relative", width: "100%" }}>
        {/* Camera preview */}
        <div
          className="camera-frame"
          style={{
            aspectRatio: "485/325",
            width: "100%",
            maxWidth: "600px",
            margin: "0 auto",
          }}
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: mirrored ? "scaleX(-1)" : "none",
              borderRadius: "inherit",
              filter: glamEnabled
                ? "contrast(107%) brightness(109%) saturate(115%)"
                : "none",
              transition: "filter 0.3s ease",
            }}
          />

          {/* Real-time Glam Beauty Skin Glow Overlay */}
          {glamEnabled && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "inherit",
                pointerEvents: "none",
                background: "radial-gradient(ellipse at 50% 35%, rgba(255,238,225,0.14) 0%, rgba(255,210,230,0.05) 100%)",
                backdropFilter: "blur(0.4px)",
                zIndex: 2,
              }}
            />
          )}

          {/* Shutter flash overlay */}
          <AnimatePresence>
            {isFlashing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "white",
                  borderRadius: "inherit",
                  pointerEvents: "none",
                  zIndex: 20,
                }}
              />
            )}
          </AnimatePresence>

          {/* Photo counter overlay */}
          <div
            style={{
              position: "absolute",
              top: "1rem",
              right: "1rem",
              display: "flex",
              gap: "0.5rem",
              zIndex: 10,
            }}
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  background: i < photoCount ? "var(--accent)" : "rgba(255,255,255,0.3)",
                  boxShadow: i < photoCount ? "0 0 8px var(--accent-glow)" : "none",
                  transition: "all 0.3s",
                }}
              />
            ))}
          </div>

          {/* Camera icon bottom-left */}
          <div
            style={{
              position: "absolute",
              bottom: "1rem",
              left: "1rem",
              zIndex: 10,
            }}
          >
            <Camera size={20} color="rgba(255,255,255,0.4)" />
          </div>
        </div>

        {/* Hidden canvas for capture */}
        <canvas ref={canvasRef} style={{ display: "none" }} />
      </div>
    );
  }
);

export default CameraView;
