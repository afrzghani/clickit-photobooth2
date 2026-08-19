"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { CheckCircle, ArrowCounterClockwise, ArrowRight, CircleNotch, Sparkle } from "@phosphor-icons/react";

interface PhotoPreviewProps {
  photos: string[]; // 3 data URLs
  templateId?: string;
  frameUrl?: string | null;
  eventConfig?: {
    headerText?: string;
    hashtag?: string;
    socialHandle?: string;
    accentColor?: string;
  };
  onRetake: () => void;
  onConfirm: () => void;
}

export default function PhotoPreview({
  photos,
  templateId,
  frameUrl,
  eventConfig,
  onRetake,
  onConfirm,
}: PhotoPreviewProps) {
  const [stripPreviewUrl, setStripPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Generate actual composed strip preview on mount
  useEffect(() => {
    let cancelled = false;

    async function generatePreview() {
      try {
        const { composeStrip } = await import("@/lib/strip-canvas");
        const url = await composeStrip({
          photos,
          headerText: eventConfig?.headerText ?? "PHOTOBOOTH",
          hashtag: eventConfig?.hashtag ?? undefined,
          socialHandle: eventConfig?.socialHandle ?? undefined,
          templateId: templateId ?? "pink-bloom",
          frameUrl: frameUrl ?? null,
          accentColor: eventConfig?.accentColor ?? "#ff3d8a",
        });
        if (!cancelled) {
          setStripPreviewUrl(url);
          setLoading(false);
        }
      } catch (e) {
        console.warn("Failed to render strip preview:", e);
        if (!cancelled) setLoading(false);
      }
    }

    generatePreview();
    return () => {
      cancelled = true;
    };
  }, [photos, templateId, frameUrl, eventConfig]);

  return (
    <div className="kiosk-container dot-pattern" style={{ gap: "1.5rem" }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: "100%",
          maxWidth: "680px",
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem",
          zIndex: 1,
          position: "relative",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center" }}>
          <h2 className="display-md" style={{ marginBottom: "0.375rem" }}>
            Preview Hasil Strip Foto
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            Periksa hasil jepretan dan susunan strip foto kamu di bawah ini.
          </p>
        </div>

        {/* Content Grid: 3 Shot Thumbnails + Composed Strip Preview */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "180px 1fr",
            gap: "1.25rem",
            alignItems: "start",
          }}
        >
          {/* Left Column: 3 captured photo thumbnails */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div className="label-mono" style={{ color: "var(--accent)" }}>
              3 Foto Jepretan
            </div>
            {photos.map((photo, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  position: "relative",
                  borderRadius: "12px",
                  overflow: "hidden",
                  aspectRatio: "4/3",
                  border: "2px solid var(--border-accent)",
                  background: "var(--bg-surface)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                }}
              >
                <img
                  src={photo}
                  alt={`Foto ${i + 1}`}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                <div
                  style={{
                    position: "absolute",
                    bottom: "6px",
                    left: "6px",
                    background: "rgba(0,0,0,0.65)",
                    color: "white",
                    padding: "2px 8px",
                    borderRadius: "999px",
                    fontSize: "0.65rem",
                    fontFamily: "var(--font-mono)",
                    fontWeight: 600,
                  }}
                >
                  #{i + 1}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Right Column: Composed 10x15cm Strip Canvas Preview */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <div className="label-mono" style={{ color: "var(--accent)" }}>
              Hasil Strip Cetak (10×15 cm)
            </div>

            <div
              style={{
                background: "white",
                borderRadius: "16px",
                border: "2px solid var(--accent)",
                padding: "0.75rem",
                boxShadow: "0 8px 30px var(--accent-glow)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: "320px",
                position: "relative",
              }}
            >
              {loading ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem", color: "var(--text-muted)" }}>
                  <CircleNotch size={32} color="var(--accent)" className="animate-spin-slow" />
                  <span style={{ fontSize: "0.85rem", fontFamily: "var(--font-mono)" }}>
                    Menyusun preview strip...
                  </span>
                </div>
              ) : stripPreviewUrl ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  style={{ width: "100%", maxWidth: "240px", borderRadius: "10px", overflow: "hidden", border: "1px solid var(--border)" }}
                >
                  <img
                    src={stripPreviewUrl}
                    alt="Preview Strip Cetak 10x15 cm"
                    style={{ width: "100%", display: "block" }}
                  />
                </motion.div>
              ) : (
                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  Gagal memuat preview strip.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Checkmarks */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "0.5rem",
          }}
        >
          {photos.map((_, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.5rem 0.75rem",
                background: "rgba(255,61,138,0.06)",
                borderRadius: "8px",
                border: "1px solid var(--border-accent)",
              }}
            >
              <CheckCircle size={16} weight="fill" color="var(--accent)" />
              <span
                style={{
                  fontSize: "0.8rem",
                  color: "var(--text-secondary)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                Foto {i + 1} Siap
              </span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          style={{ display: "flex", gap: "1rem" }}
        >
          <button
            className="btn-secondary"
            onClick={onRetake}
            id="preview-retake-btn"
          >
            <ArrowCounterClockwise size={18} />
            Foto Ulang
          </button>
          <button
            className="btn-primary"
            onClick={onConfirm}
            id="preview-confirm-btn"
            style={{ flex: 1 }}
          >
            <Sparkle size={20} weight="fill" />
            Cetak & Buat QR Code
            <ArrowRight size={18} weight="bold" />
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
