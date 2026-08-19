"use client";

import { useState, useEffect, useCallback, memo } from "react";
import { motion } from "motion/react";
import { CheckCircle, Sparkle, Image as ImageIcon } from "@phosphor-icons/react";
import { supabase, type Event, type Frame } from "@/lib/supabase";

interface ConfigScreenProps {
  event: Event | null;
  onConfirm: (config: { templateId: string; frameUrl?: string | null; glamEnabled: boolean }) => void;
  onBack: () => void;
}

// Global in-memory cache for ultra-fast compressed mini-thumbnails (200x300 ~20KB)
const miniThumbCache = new Map<string, string>();
const blobCache = new Map<string, string>();

/**
 * Converts heavy Base64 data URLs (~5-10MB string) into lightweight 50-byte Blob URLs
 * Eliminates JavaScript string memory allocation and Base64 parsing CPU lag completely.
 */
function toBlobUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (!url.startsWith("data:")) return url;
  if (blobCache.has(url)) return blobCache.get(url)!;

  try {
    const arr = url.split(",");
    const mime = arr[0].match(/:(.*?);/)?.[1] || "image/png";
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    const blob = new Blob([u8arr], { type: mime });
    const blobUrl = URL.createObjectURL(blob);
    blobCache.set(url, blobUrl);
    return blobUrl;
  } catch {
    return url;
  }
}

function compressDataUrlToThumb(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 200;
        canvas.height = 300;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, 200, 300);
          ctx.drawImage(img, 0, 0, 200, 300);
          // Compressed PNG thumbnail (retains frame transparency for card preview)
          const mini = canvas.toDataURL("image/png");
          resolve(toBlobUrl(mini) || mini);
          return;
        }
      } catch {}
      resolve(toBlobUrl(dataUrl) || dataUrl);
    };
    img.onerror = () => resolve(toBlobUrl(dataUrl) || dataUrl);
    img.src = dataUrl;
  });
}

// Custom hook to provide compressed lightweight thumbnail URLs for UI grid
function useOptimizedThumbnails(frames: Frame[]) {
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;

    async function processThumbnails() {
      const nextMap: Record<string, string> = {};

      for (const frame of frames) {
        // 1. Explicit separate thumbnail_url if available
        if (frame.thumbnail_url && frame.thumbnail_url !== frame.image_url) {
          nextMap[frame.id] = toBlobUrl(frame.thumbnail_url) || frame.thumbnail_url;
          continue;
        }

        // 2. Cached in RAM
        if (miniThumbCache.has(frame.id)) {
          nextMap[frame.id] = miniThumbCache.get(frame.id)!;
          continue;
        }

        // 3. Regular HTTP/HTTPS URL (not data URL)
        if (frame.image_url && !frame.image_url.startsWith("data:")) {
          nextMap[frame.id] = frame.image_url;
          continue;
        }

        // 4. Large base64 data URL without thumbnail -> compress on the fly
        if (frame.image_url && frame.image_url.startsWith("data:")) {
          try {
            const compressed = await compressDataUrlToThumb(frame.image_url);
            miniThumbCache.set(frame.id, compressed);
            nextMap[frame.id] = compressed;
          } catch {
            nextMap[frame.id] = toBlobUrl(frame.image_url) || frame.image_url;
          }
        } else {
          nextMap[frame.id] = toBlobUrl(frame.image_url) || frame.image_url;
        }
      }

      if (active) {
        setThumbnails(nextMap);
      }
    }

    processThumbnails();

    return () => {
      active = false;
    };
  }, [frames]);

  return thumbnails;
}

// Memoized FrameCard to ensure 0ms click latency and zero virtual DOM diffing on unselected cards
const FrameCard = memo(function FrameCard({
  frame,
  thumbUrl,
  isSelected,
  onSelect,
}: {
  frame: Frame;
  thumbUrl?: string;
  isSelected: boolean;
  onSelect: (frame: Frame) => void;
}) {
  const handleClick = useCallback(() => {
    onSelect(frame);
  }, [frame, onSelect]);

  const displaySrc = thumbUrl || frame.thumbnail_url || frame.image_url;

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      style={{
        position: "relative",
        borderRadius: "14px",
        overflow: "hidden",
        border: `2.5px solid ${isSelected ? "var(--accent)" : "var(--border)"}`,
        background: "white",
        padding: "0.625rem",
        cursor: "pointer",
        boxShadow: isSelected ? "0 6px 24px var(--accent-glow)" : "0 2px 8px rgba(0,0,0,0.04)",
        willChange: "transform",
      }}
    >
      <div style={{ aspectRatio: "2/3", width: "100%", borderRadius: "10px", overflow: "hidden", background: "#f5f5f5" }}>
        <img
          src={displaySrc}
          alt={frame.name}
          loading="eager"
          decoding="async"
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
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
});

export default function ConfigScreen({ event, onConfirm, onBack }: ConfigScreenProps) {
  const [selectedTemplate, setSelectedTemplate] = useState("custom-frame");
  const [selectedFrameUrl, setSelectedFrameUrl] = useState<string | null>(null);
  const [glamEnabled] = useState(true); // Glam booth selalu aktif
  const [customFrames, setCustomFrames] = useState<Frame[]>([]);

  const thumbnailsMap = useOptimizedThumbnails(customFrames);

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

      // Convert all heavy Base64 data URLs to lightweight 50-byte Blob URLs
      const optimizedLoaded = loaded.map((f) => ({
        ...f,
        image_url: toBlobUrl(f.image_url) || f.image_url,
        thumbnail_url: f.thumbnail_url ? (toBlobUrl(f.thumbnail_url) || f.thumbnail_url) : null,
      }));

      setCustomFrames(optimizedLoaded);

      // Auto-select and preload ONLY the first frame
      if (optimizedLoaded.length > 0 && !selectedFrameUrl) {
        setSelectedFrameUrl(optimizedLoaded[0].image_url);
        setSelectedTemplate(optimizedLoaded[0].id);
        import("@/lib/strip-canvas").then(({ preloadFrameImage }) => {
          preloadFrameImage(optimizedLoaded[0].image_url).catch(() => {});
        });
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
        const rawFrame = e.data.payload as Frame;
        const frame: Frame = {
          ...rawFrame,
          image_url: toBlobUrl(rawFrame.image_url) || rawFrame.image_url,
          thumbnail_url: rawFrame.thumbnail_url ? (toBlobUrl(rawFrame.thumbnail_url) || rawFrame.thumbnail_url) : null,
        };
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

  const handleSelectFrame = useCallback((frame: Frame) => {
    setSelectedFrameUrl(frame.image_url);
    setSelectedTemplate(frame.id);

    // Preload selected high-res image off-thread so full composition is instant
    import("@/lib/strip-canvas").then(({ preloadFrameImage }) => {
      preloadFrameImage(frame.image_url).catch(() => {});
    });
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
                  <FrameCard
                    key={frame.id}
                    frame={frame}
                    thumbUrl={thumbnailsMap[frame.id]}
                    isSelected={isSelected}
                    onSelect={handleSelectFrame}
                  />
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

