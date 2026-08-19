"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CircleNotch, CheckCircle } from "@phosphor-icons/react";

interface ProcessingScreenProps {
  photos: string[];
  templateId: string;
  frameUrl?: string | null;
  glamEnabled: boolean;
  eventId: string | null;
  eventConfig: {
    headerText?: string;
    hashtag?: string;
    socialHandle?: string;
    accentColor?: string;
  };
  onComplete: (sessionId: string) => void;
  onError: (message: string) => void;
}

const STEPS = [
  "Menyusun strip foto...",
  "Membuat GIF animasi...",
  "Mengunggah ke cloud...",
  "Membuat QR code...",
];

export default function ProcessingScreen({
  photos,
  templateId,
  frameUrl,
  glamEnabled,
  eventId,
  eventConfig,
  onComplete,
  onError,
}: ProcessingScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function process() {
      try {
        // Step 1: Compose strip
        setCurrentStep(0);
        const { composeStrip } = await import("@/lib/strip-canvas");
        const stripDataUrl = await composeStrip({
          photos,
          headerText: eventConfig.headerText ?? "ClickIt",
          hashtag: eventConfig.hashtag ?? undefined,
          socialHandle: eventConfig.socialHandle ?? undefined,
          templateId,
          frameUrl: frameUrl ?? null,
          accentColor: eventConfig.accentColor ?? "#e040fb",
        });
        if (cancelled) return;

        // Step 2: Compose GIF
        setCurrentStep(1);
        let gifBlob: Blob | null = null;
        try {
          const { composeGif } = await import("@/lib/gif-composer");
          gifBlob = await composeGif({ photos, width: 600, height: 450 });
        } catch {
          // GIF creation optional — continue without it
        }
        if (cancelled) return;

        // Step 3: Save session & Upload
        setCurrentStep(2);
        const sessionId = crypto.randomUUID();

        let stripUrl: string | null = null;
        let gifUrl: string | null = null;

        try {
          const { uploadToStorage } = await import("@/lib/realtime");

          // Try cloud storage upload
          const stripBlob = await (await fetch(stripDataUrl)).blob();
          stripUrl = await uploadToStorage(
            "sessions",
            `${sessionId}/strip.jpg`,
            stripBlob,
            "image/jpeg"
          );

          if (gifBlob) {
            gifUrl = await uploadToStorage(
              "sessions",
              `${sessionId}/animation.gif`,
              gifBlob,
              "image/gif"
            );
          }
        } catch {
          // Cloud upload optional — continue with data URLs
        }

        const sessionRecord = {
          id: sessionId,
          event_id: eventId ?? "default-event",
          strip_url: stripUrl || stripDataUrl,
          gif_url: gifUrl,
          template_id: templateId,
          glam_enabled: glamEnabled,
          status: "pending" as const,
          created_at: new Date().toISOString(),
        };

        // Try Supabase DB insert
        try {
          const { supabase } = await import("@/lib/supabase");
          await supabase.from("sessions").insert(sessionRecord);
        } catch (dbErr) {
          console.warn("Supabase session DB insert skipped/failed:", dbErr);
        }

        // Always save to localStorage & broadcast locally for instant offline tab sync!
        if (typeof window !== "undefined") {
          try {
            sessionStorage.setItem(`strip-${sessionId}`, stripDataUrl);
            const existing: any[] = JSON.parse(localStorage.getItem("clickit_sessions") || "[]");
            localStorage.setItem("clickit_sessions", JSON.stringify([sessionRecord, ...existing]));
          } catch {}
        }

        const { broadcastLocal } = await import("@/lib/realtime");
        broadcastLocal("NEW_SESSION", sessionRecord);

        if (cancelled) return;

        // Step 4: QR done
        setCurrentStep(3);
        await delay(600);
        if (cancelled) return;

        setDone(true);
        await delay(400);
        onComplete(sessionId);
      } catch (err) {
        if (!cancelled) {
          onError(
            err instanceof Error ? err.message : "Terjadi kesalahan saat memproses foto."
          );
        }
      }
    }

    process();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="kiosk-container">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "2.5rem",
          textAlign: "center",
          zIndex: 1,
          position: "relative",
        }}
      >
        {/* Spinner or done */}
        <motion.div
          style={{
            width: "88px",
            height: "88px",
            borderRadius: "50%",
            background: done ? "rgba(224,64,251,0.15)" : "var(--bg-surface)",
            border: `2px solid ${done ? "var(--accent)" : "var(--border)"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: done ? "0 0 40px var(--accent-glow)" : "none",
          }}
        >
          <AnimatePresence mode="wait">
            {done ? (
              <motion.div
                key="done"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <CheckCircle size={44} weight="fill" color="var(--accent)" />
              </motion.div>
            ) : (
              <motion.div
                key="spinner"
                animate={{ rotate: 360 }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
              >
                <CircleNotch size={44} color="var(--accent)" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <h2 className="display-md">
            {done ? "Selesai!" : "Sedang Memproses..."}
          </h2>
          <AnimatePresence mode="wait">
            <motion.p
              key={currentStep}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              style={{
                color: "var(--text-secondary)",
                fontFamily: "var(--font-mono)",
                fontSize: "0.85rem",
              }}
            >
              {STEPS[currentStep]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Step dots */}
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {STEPS.map((_, i) => (
            <motion.div
              key={i}
              animate={{
                background:
                  i <= currentStep ? "var(--accent)" : "var(--border)",
                scale: i === currentStep ? 1.3 : 1,
              }}
              transition={{ duration: 0.3 }}
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
              }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
