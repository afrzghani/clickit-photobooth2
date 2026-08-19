"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { CheckCircle, Sparkle, Star, Image as ImageIcon, Warning } from "@phosphor-icons/react";
import { supabase, type Event, type Frame } from "@/lib/supabase";

interface ConfigScreenProps {
  event: Event | null;
  onConfirm: (config: { templateId: string; frameUrl?: string | null; glamEnabled: boolean }) => void;
  onBack: () => void;
}

export default function ConfigScreen({ event, onConfirm, onBack }: ConfigScreenProps) {
  const [selectedTemplate, setSelectedTemplate] = useState("custom-frame");
  const [selectedFrameUrl, setSelectedFrameUrl] = useState<string | null>(null);
  const [glamEnabled] = useState(true); // Glam booth selalu aktif
  const [customFrames, setCustomFrames] = useState<Frame[]>([]);

  // Fetch uploaded PNG frames from Supabase or IndexedDB fallback
  useEffect(() => {
    async function loadFrames() {
      let loaded: Frame[] = [];
      try {
        const { data } = await supabase.from("frames").select("*").order("created_at", { ascending: false });
        if (data && data.length > 0) {
          loaded = data as Frame[];
        }
      } catch {
        // ignore
      }

      try {
        const { getFramesIDB } = await import("@/lib/idb");
        const idbFrames = await getFramesIDB();
        if (idbFrames.length > 0) {
          const existingIds = new Set(loaded.map((f) => f.id));
          for (const f of idbFrames) {
            if (!existingIds.has(f.id)) {
              loaded.push(f as Frame);
            }
          }
        }
      } catch {
        // ignore
      }

      setCustomFrames(loaded);
      // Auto-select first custom frame if available
      if (loaded.length > 0 && !selectedFrameUrl) {
        setSelectedFrameUrl(loaded[0].image_url);
        setSelectedTemplate(loaded[0].id);
      }
    }
    loadFrames();

    // Listen for local frame broadcasts from Admin
    const localChannel =
      typeof window !== "undefined" && "BroadcastChannel" in window
        ? new BroadcastChannel("clickit_local_sync")
        : null;

    const handleMsg = (e: MessageEvent) => {
      if (e.data?.type === "NEW_FRAME" && e.data?.payload) {
        const frame = e.data.payload as Frame;
        setCustomFrames((prev) => {
          const next = [frame, ...prev.filter((f) => f.id !== frame.id)];
          if (!selectedFrameUrl) {
            setSelectedFrameUrl(frame.image_url);
            setSelectedTemplate(frame.id);
          }
          return next;
        });
      }
    };

    if (localChannel) {
      localChannel.addEventListener("message", handleMsg);
    }

    return () => {
      if (localChannel) localChannel.removeEventListener("message", handleMsg);
    };
  }, []);

  const handleConfirm = () => {
    onConfirm({
      templateId: selectedTemplate,
      frameUrl: selectedFrameUrl,
      glamEnabled: true, // Always true
    });
  };

  return (
    <div className="kiosk-container dot-pattern" style={{ justifyContent: "flex-start", paddingTop: "2.5rem" }}>
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -40 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: "100%",
          maxWidth: "640px",
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
          zIndex: 1,
          position: "relative",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center" }}>
          <h2 className="display-md" style={{ marginBottom: "0.375rem" }}>
            Pilih Desain Frame PNG
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            Pilih frame PNG kustom yang telah diunggah oleh Admin.
          </p>
        </div>

        {/* Custom PNG Frames List */}
        {customFrames.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div className="label-mono" style={{ color: "var(--accent)" }}>
              Frame Tersedia ({customFrames.length})
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
              {customFrames.map((frame) => {
                const isSelected = selectedFrameUrl === frame.image_url;
                return (
                  <motion.button
                    key={frame.id}
                    onClick={() => {
                      setSelectedFrameUrl(frame.image_url);
                      setSelectedTemplate(frame.id);
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.96 }}
                    style={{
                      position: "relative",
                      borderRadius: "14px",
                      overflow: "hidden",
                      border: `2.5px solid ${isSelected ? "var(--accent)" : "var(--border)"}`,
                      background: "white",
                      padding: "0.625rem",
                      cursor: "pointer",
                      boxShadow: isSelected ? "0 6px 24px var(--accent-glow)" : "0 2px 8px rgba(0,0,0,0.04)",
                      transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                    }}
                  >
                    <div style={{ aspectRatio: "2/3", width: "100%", borderRadius: "10px", overflow: "hidden", background: "#f5f5f5" }}>
                      <img src={frame.image_url} alt={frame.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                    </div>
                    <div style={{ fontSize: "0.8rem", fontWeight: 700, marginTop: "0.5rem", color: "var(--text-primary)", textAlign: "center" }}>
                      {frame.name}
                    </div>
                    {isSelected && (
                      <div style={{ position: "absolute", top: "10px", right: "10px" }}>
                        <CheckCircle size={22} weight="fill" color="var(--accent)" />
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        ) : (
          <div
            style={{
              background: "white",
              border: "2px dashed var(--border-accent)",
              borderRadius: "var(--radius-card)",
              padding: "3rem 2rem",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "1rem",
            }}
          >
            <ImageIcon size={48} color="var(--accent)" style={{ opacity: 0.6 }} />
            <div>
              <div style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.25rem" }}>
                Belum Ada Frame PNG Unggahan
              </div>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", maxWidth: "360px" }}>
                Silakan unggah file PNG frame 10×15 cm di Dashboard Admin (<strong>/admin</strong>).
              </p>
            </div>
          </div>
        )}

        {/* Glam Booth Status Banner (Always Active) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "1rem 1.25rem",
            background: "rgba(255,61,138,0.06)",
            border: "1.5px solid var(--border-accent)",
            borderRadius: "var(--radius-card)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "var(--accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
              }}
            >
              <Star size={20} weight="fill" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>Glam Booth & Skin Smoothing</div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                Penyempurnaan kulit & pencahayaan otomatis aktif untuk setiap foto.
              </div>
            </div>
          </div>
          <span className="status-badge printed" style={{ background: "var(--accent-dim)", color: "var(--accent)", border: "1px solid var(--border-accent)" }}>
            Selalu Aktif
          </span>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "0.875rem" }}>
          <button className="btn-secondary" onClick={onBack} id="config-back-btn">
            Kembali
          </button>
          <button
            className="btn-primary"
            onClick={handleConfirm}
            disabled={customFrames.length > 0 && !selectedFrameUrl}
            id="config-confirm-btn"
            style={{ flex: 1 }}
          >
            <Sparkle size={20} weight="fill" />
            Lanjut Foto
          </button>
        </div>
      </motion.div>
    </div>
  );
}
