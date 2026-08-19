"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { CheckCircle, Sparkle, Star, Image as ImageIcon } from "@phosphor-icons/react";
import { supabase, type Event, type Frame } from "@/lib/supabase";

interface ConfigScreenProps {
  event: Event | null;
  onConfirm: (config: { templateId: string; frameUrl?: string | null; glamEnabled: boolean }) => void;
  onBack: () => void;
}

const PRESET_TEMPLATES = [
  {
    id: "pink-bloom",
    name: "Pink Bloom",
    description: "Ceria, hangat, kekinian",
    headerBg: "#ff3d8a",
    photoBg: "#fff0f5",
    accent: "#ff3d8a",
    textColor: "#fff",
  },
  {
    id: "blush-pop",
    name: "Blush Pop",
    description: "Manis, pastel",
    headerBg: "#ff4d8f",
    photoBg: "#1a0014",
    accent: "#ff85b3",
    textColor: "#ffe0ef",
  },
  {
    id: "minimal-dark",
    name: "Minimal Dark",
    description: "Elegan, profesional",
    headerBg: "#13131a",
    photoBg: "#0a0a0f",
    accent: "#e040fb",
    textColor: "#f5f5f5",
  },
  {
    id: "golden-hour",
    name: "Golden Hour",
    description: "Hangat, romantis",
    headerBg: "#2d1800",
    photoBg: "#1a0f00",
    accent: "#ffb347",
    textColor: "#fff8e7",
  },
];

export default function ConfigScreen({ event, onConfirm, onBack }: ConfigScreenProps) {
  const [selectedTemplate, setSelectedTemplate] = useState("pink-bloom");
  const [selectedFrameUrl, setSelectedFrameUrl] = useState<string | null>(null);
  const [glamEnabled, setGlamEnabled] = useState(false);
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
    }
    loadFrames();

    // Listen for local frame broadcasts from Admin
    const localChannel = typeof window !== "undefined" && "BroadcastChannel" in window
      ? new BroadcastChannel("clickit_local_sync")
      : null;

    const handleMsg = (e: MessageEvent) => {
      if (e.data?.type === "NEW_FRAME" && e.data?.payload) {
        const frame = e.data.payload as Frame;
        setCustomFrames((prev) => [frame, ...prev.filter((f) => f.id !== frame.id)]);
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
      glamEnabled,
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
            Pilih Frame Strip
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            Pilih desain PNG frame atau preset warna untuk strip cetak kamu.
          </p>
        </div>

        {/* Custom PNG Frames (if any uploaded by Admin) */}
        {customFrames.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <div className="label-mono" style={{ color: "var(--accent)" }}>
              Frame PNG Kustom (Admin)
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem" }}>
              {customFrames.map((frame) => {
                const isSelected = selectedFrameUrl === frame.image_url;
                return (
                  <motion.button
                    key={frame.id}
                    onClick={() => {
                      setSelectedFrameUrl(frame.image_url);
                      setSelectedTemplate(frame.id);
                    }}
                    whileTap={{ scale: 0.96 }}
                    style={{
                      position: "relative",
                      borderRadius: "12px",
                      overflow: "hidden",
                      border: `2px solid ${isSelected ? "var(--accent)" : "var(--border)"}`,
                      background: "white",
                      padding: "0.5rem",
                      cursor: "pointer",
                      boxShadow: isSelected ? "0 4px 16px var(--accent-glow)" : "none",
                    }}
                  >
                    <div style={{ aspectRatio: "2/3", width: "100%", borderRadius: "8px", overflow: "hidden", background: "#f0f0f0" }}>
                      <img src={frame.image_url} alt={frame.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                    </div>
                    <div style={{ fontSize: "0.75rem", fontWeight: 600, marginTop: "0.4rem", color: "var(--text-primary)" }}>
                      {frame.name}
                    </div>
                    {isSelected && (
                      <div style={{ position: "absolute", top: "8px", right: "8px" }}>
                        <CheckCircle size={20} weight="fill" color="var(--accent)" />
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}

        {/* Preset Templates */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {customFrames.length > 0 && (
            <div className="label-mono">Atau Pilih Preset Warna</div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.875rem" }}>
            {PRESET_TEMPLATES.map((tpl, i) => {
              const isSelected = selectedFrameUrl === null && selectedTemplate === tpl.id;
              return (
                <motion.button
                  key={tpl.id}
                  id={`template-${tpl.id}`}
                  onClick={() => {
                    setSelectedFrameUrl(null);
                    setSelectedTemplate(tpl.id);
                  }}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.75rem",
                    padding: "0.875rem",
                    background: isSelected ? `${tpl.accent}10` : "white",
                    border: `2px solid ${isSelected ? tpl.accent : "var(--border)"}`,
                    borderRadius: "var(--radius-card)",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                    boxShadow: isSelected ? `0 4px 20px ${tpl.accent}30` : "0 2px 8px rgba(0,0,0,0.05)",
                  }}
                >
                  {/* Mini 2-column strip preview */}
                  <div
                    style={{
                      position: "relative",
                      height: "90px",
                      borderRadius: "10px",
                      overflow: "hidden",
                      background: tpl.photoBg,
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        height: "18px",
                        background: tpl.headerBg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <span style={{ fontSize: "0.5rem", fontWeight: 900, color: tpl.textColor }}>
                        PHOTOBOOTH
                      </span>
                    </div>

                    <div
                      style={{
                        position: "absolute",
                        top: "22px",
                        left: "6px",
                        right: "6px",
                        bottom: "6px",
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gridTemplateRows: "repeat(3, 1fr)",
                        gap: "3px",
                      }}
                    >
                      {Array.from({ length: 6 }).map((_, n) => (
                        <div
                          key={n}
                          style={{
                            borderRadius: "3px",
                            background: `${tpl.accent}22`,
                            border: `1px solid ${tpl.accent}55`,
                          }}
                        />
                      ))}
                    </div>

                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        style={{ position: "absolute", top: "4px", right: "4px" }}
                      >
                        <CheckCircle size={18} weight="fill" color={tpl.accent} />
                      </motion.div>
                    )}
                  </div>

                  <div>
                    <div
                      style={{
                        fontSize: "0.875rem",
                        fontWeight: 700,
                        color: isSelected ? tpl.accent : "var(--text-primary)",
                        marginBottom: "0.15rem",
                      }}
                    >
                      {tpl.name}
                    </div>
                    <div style={{ fontSize: "0.73rem", color: "var(--text-muted)" }}>
                      {tpl.description}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Glam Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "1rem 1.25rem",
            background: glamEnabled ? "rgba(255,61,138,0.06)" : "white",
            border: `2px solid ${glamEnabled ? "var(--accent)" : "var(--border)"}`,
            borderRadius: "var(--radius-card)",
            transition: "all 0.25s",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 700, fontSize: "0.95rem" }}>
              <Star size={18} weight="fill" color="var(--accent)" />
              Glam Booth
            </div>
            <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
              Deteksi wajah + skin smoothing otomatis
            </span>
          </div>

          <label className="toggle" htmlFor="glam-toggle">
            <input id="glam-toggle" type="checkbox" checked={glamEnabled} onChange={(e) => setGlamEnabled(e.target.checked)} />
            <div className="toggle-track" />
            <div className="toggle-thumb" />
          </label>
        </motion.div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "0.875rem" }}>
          <button className="btn-secondary" onClick={onBack} id="config-back-btn">
            Kembali
          </button>
          <button
            className="btn-primary"
            onClick={handleConfirm}
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
