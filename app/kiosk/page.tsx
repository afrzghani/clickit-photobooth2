"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Camera, Sparkle, ArrowRight, Lock } from "@phosphor-icons/react";
import { supabase, type Event, type Frame } from "@/lib/supabase";
import { subscribeToEventConfig } from "@/lib/realtime";
import WelcomeScreen from "@/components/kiosk/WelcomeScreen";
import ConfigScreen from "@/components/kiosk/ConfigScreen";
import CameraView, { type CameraViewHandle } from "@/components/kiosk/CameraView";
import CountdownOverlay from "@/components/kiosk/CountdownOverlay";
import PhotoPreview from "@/components/kiosk/PhotoPreview";
import ProcessingScreen from "@/components/kiosk/ProcessingScreen";
import QRResult from "@/components/kiosk/QRResult";

type Step =
  | "welcome"
  | "config"
  | "shoot"
  | "preview"
  | "processing"
  | "result";

export default function KioskPage() {
  const [isKioskUnlocked, setIsKioskUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);

  const [step, setStep] = useState<Step>("welcome");
  const [photos, setPhotos] = useState<string[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [stripUrl, setStripUrl] = useState<string | null>(null);
  const [templateId, setTemplateId] = useState("pink-bloom");
  const [selectedFrameUrl, setSelectedFrameUrl] = useState<string | null>(null);
  const [glamEnabled, setGlamEnabled] = useState(true);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [event, setEvent] = useState<Event | null>(null);

  const cameraRef = useRef<CameraViewHandle>(null);

  // Check local Kiosk unlock state
  useEffect(() => {
    if (typeof sessionStorage !== "undefined" && sessionStorage.getItem("clickit_kiosk_unlocked") === "true") {
      setIsKioskUnlocked(true);
    }
  }, []);

  const handleUnlockKiosk = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === "192837" || pinInput.trim() === "192837") {
      setIsKioskUnlocked(true);
      setPinError(false);
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.setItem("clickit_kiosk_unlocked", "true");
      }
    } else {
      setPinError(true);
    }
  };

  // Load active event config
  useEffect(() => {
    async function loadEvent() {
      const { data } = await supabase
        .from("events")
        .select("*")
        .eq("active", true)
        .single();
      if (data) setEvent(data as Event);
    }
    loadEvent();
  }, []);

  // Real-time event config updates
  useEffect(() => {
    if (!event?.id) return;
    const unsubscribe = subscribeToEventConfig(event.id, (updated) => {
      setEvent((prev) => (prev ? { ...prev, ...(updated as Partial<Event>) } : prev));
    });
    return () => { unsubscribe(); };
  }, [event?.id]);

  // Trigger manual single photo shot with countdown
  const handleTriggerPhoto = useCallback(() => {
    if (isCountingDown || photos.length >= 3) return;
    setIsCountingDown(true);
  }, [isCountingDown, photos.length]);

  const handleCountdownComplete = useCallback(() => {
    setIsCountingDown(false);
    // Trigger actual camera shutter
    setTimeout(() => {
      cameraRef.current?.capture();
    }, 50);
  }, []);

  const handlePhotoCaptured = useCallback((dataUrl: string) => {
    setPhotos((prev) => {
      const next = [...prev, dataUrl];
      if (next.length === 3) {
        // All 3 photos captured -> proceed to preview
        setTimeout(() => setStep("preview"), 500);
      }
      return next;
    });
  }, []);

  const handleConfigConfirm = useCallback(
    (config: { templateId: string; frameUrl?: string | null; glamEnabled: boolean }) => {
      setTemplateId(config.templateId);
      setSelectedFrameUrl(config.frameUrl ?? null);
      setGlamEnabled(config.glamEnabled);
      setPhotos([]);
      setStep("shoot");
    },
    []
  );

  const handleProcessComplete = useCallback(
    (sid: string) => {
      setSessionId(sid);
      const localStrip = sessionStorage.getItem(`strip-${sid}`);
      setStripUrl(localStrip);

      supabase
        .from("sessions")
        .select("strip_url")
        .eq("id", sid)
        .single()
        .then(({ data }) => {
          if (data?.strip_url) setStripUrl(data.strip_url);
        });

      setStep("result");
    },
    []
  );

  const handleReset = useCallback(() => {
    setStep("welcome");
    setPhotos([]);
    setSessionId(null);
    setStripUrl(null);
    setTemplateId("pink-bloom");
    setSelectedFrameUrl(null);
    setGlamEnabled(true);
    setIsCountingDown(false);
  }, []);

  if (!isKioskUnlocked) {
    return (
      <div
        className="kiosk-container dot-pattern"
        style={{
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card-elevated"
          style={{
            width: "100%",
            maxWidth: "400px",
            padding: "2.5rem 2rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1.5rem",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "20px",
              background: "var(--accent-dim)",
              border: "1.5px solid var(--border-accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--accent)",
            }}
          >
            <Lock size={32} weight="bold" />
          </div>

          <div>
            <h2 className="display-md" style={{ fontSize: "1.375rem", marginBottom: "0.25rem" }}>
              Akses Perangkat Kiosk
            </h2>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              Masukkan PIN Acara untuk membuka layar Photobooth Kiosk.
            </p>
          </div>

          <form onSubmit={handleUnlockKiosk} style={{ width: "100%", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <input
                type="password"
                className="input"
                placeholder="Masukkan PIN"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                style={{ textAlign: "center", fontSize: "1.2rem", letterSpacing: "0.25em" }}
                autoFocus
              />
              {pinError && (
                <div style={{ color: "#ff3d57", fontSize: "0.78rem", marginTop: "0.375rem" }}>
                  PIN salah. Masukkan PIN yang benar.
                </div>
              )}
            </div>

            <button type="submit" className="btn-primary" style={{ width: "100%" }}>
              Buka Layar Kiosk
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  const accentColor =
    (event?.theme as { accent?: string })?.accent ?? "#ff3d8a";

  return (
    <main
      style={{
        minHeight: "100dvh",
        background: "var(--bg-base)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Step indicator */}
      {step !== "welcome" && step !== "result" && (
        <div
          className="no-print"
          style={{
            position: "fixed",
            top: "1.25rem",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 100,
            display: "flex",
            gap: "0.5rem",
          }}
        >
          {(["config", "shoot", "preview", "processing"] as Step[]).map(
            (s) => (
              <div
                key={s}
                className={`step-dot ${s === step ? "active" : steps.indexOf(s) < steps.indexOf(step) ? "done" : ""}`}
              />
            )
          )}
        </div>
      )}

      <AnimatePresence mode="wait">
        {step === "welcome" && (
          <motion.div key="welcome" {...slideTransition}>
            <WelcomeScreen
              eventName={event?.name}
              onStart={() => setStep("config")}
            />
          </motion.div>
        )}

        {step === "config" && (
          <motion.div key="config" {...slideTransition}>
            <ConfigScreen
              event={event}
              onConfirm={handleConfigConfirm}
              onBack={() => setStep("welcome")}
            />
          </motion.div>
        )}

        {step === "shoot" && (
          <motion.div key="shoot" {...slideTransition}>
            <div className="kiosk-container dot-pattern" style={{ gap: "1.25rem" }}>
              <div style={{ zIndex: 1, width: "100%", maxWidth: "600px", position: "relative" }}>
                {/* Header status */}
                <div style={{ textAlign: "center", marginBottom: "0.75rem" }}>
                  <h3 className="display-md" style={{ fontSize: "1.5rem" }}>
                    Foto ke-{Math.min(photos.length + 1, 3)} dari 3
                  </h3>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                    {isCountingDown
                      ? "Bersiap! Senyum ke kamera..."
                      : "Posisikan gaya kamu, lalu tekan tombol Ambil Foto."}
                  </p>
                </div>

                <div style={{ position: "relative" }}>
                  <CameraView
                    ref={cameraRef}
                    glamEnabled={glamEnabled}
                    onPhotoCaptured={handlePhotoCaptured}
                    photoCount={photos.length}
                  />

                  {/* Countdown overlay on top of camera */}
                  {isCountingDown && (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        zIndex: 20,
                        borderRadius: "var(--radius-kiosk)",
                        overflow: "hidden",
                      }}
                    >
                      <CountdownOverlay onComplete={handleCountdownComplete} />
                    </div>
                  )}
                </div>

                {/* MANUAL SHUTTER BUTTON */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    marginTop: "1.25rem",
                  }}
                >
                  <motion.button
                    className="btn-primary"
                    onClick={handleTriggerPhoto}
                    disabled={isCountingDown || photos.length >= 3}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    style={{
                      fontSize: "1.2rem",
                      padding: "1rem 3rem",
                      minWidth: "260px",
                    }}
                    id="shutter-trigger-btn"
                  >
                    <Camera size={24} weight="fill" />
                    {isCountingDown
                      ? "Mengambil Foto..."
                      : `Ambil Foto (${photos.length + 1}/3)`}
                  </motion.button>
                </div>
              </div>

              {/* Captured photos thumbnail row */}
              {photos.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    display: "flex",
                    gap: "0.75rem",
                    zIndex: 1,
                  }}
                >
                  {photos.map((photo, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      style={{
                        width: "80px",
                        height: "60px",
                        borderRadius: "10px",
                        overflow: "hidden",
                        border: "2px solid var(--accent)",
                        boxShadow: "0 0 12px var(--accent-glow)",
                      }}
                    >
                      <img
                        src={photo}
                        alt={`Foto ${i + 1}`}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {step === "preview" && (
          <motion.div key="preview" {...slideTransition}>
            <PhotoPreview
              photos={photos}
              templateId={templateId}
              frameUrl={selectedFrameUrl}
              eventConfig={{
                headerText: event?.header_text ?? undefined,
                hashtag: event?.hashtag ?? undefined,
                socialHandle: event?.social_handle ?? undefined,
                accentColor,
              }}
              onRetake={() => {
                setPhotos([]);
                setStep("shoot");
              }}
              onConfirm={() => setStep("processing")}
            />
          </motion.div>
        )}

        {step === "processing" && (
          <motion.div key="processing" {...slideTransition}>
            <ProcessingScreen
              photos={photos}
              templateId={templateId}
              frameUrl={selectedFrameUrl}
              glamEnabled={glamEnabled}
              eventId={event?.id ?? null}
              eventConfig={{
                headerText: event?.header_text ?? undefined,
                hashtag: event?.hashtag ?? undefined,
                socialHandle: event?.social_handle ?? undefined,
                accentColor,
              }}
              onComplete={handleProcessComplete}
              onError={(msg) => {
                console.error(msg);
                handleProcessComplete(crypto.randomUUID());
              }}
            />
          </motion.div>
        )}

        {step === "result" && sessionId && (
          <motion.div key="result" {...slideTransition}>
            <QRResult
              sessionId={sessionId}
              stripUrl={stripUrl}
              onReset={handleReset}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

const steps: Step[] = ["welcome", "config", "shoot", "preview", "processing", "result"];

const slideTransition = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
  transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
};
