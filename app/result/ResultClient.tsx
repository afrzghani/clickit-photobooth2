"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { DownloadSimple, FilmSlate, ImageSquare, Camera, Sparkle } from "@phosphor-icons/react";
import { type Session } from "@/lib/supabase";

interface ResultClientProps {
  session: Session;
}

export default function ResultClient({ session }: ResultClientProps) {
  const [stripUrl, setStripUrl] = useState<string | null>(session.strip_url);
  const [gifUrl, setGifUrl] = useState<string | null>(session.gif_url);

  useEffect(() => {
    if (!stripUrl && typeof window !== "undefined") {
      try {
        const localStrip = sessionStorage.getItem(`strip-${session.id}`);
        if (localStrip) {
          setStripUrl(localStrip);
        } else {
          const localSess: Session[] = JSON.parse(localStorage.getItem("clickit_sessions") || "[]");
          const found = localSess.find((s) => s.id === session.id);
          if (found?.strip_url) setStripUrl(found.strip_url);
          if (found?.gif_url) setGifUrl(found.gif_url);
        }
      } catch {
        // ignore
      }
    }
  }, [session.id, stripUrl]);

  const handleDownload = async (url: string, filename: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "var(--bg-base)",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflowX: "hidden",
      }}
    >
      {/* Background glow */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          top: "-20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "600px",
          height: "600px",
          background: "radial-gradient(ellipse, rgba(255,61,138,0.15) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Header */}
      <header
        className="glass"
        style={{
          padding: "0.875rem 1.25rem",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          position: "sticky",
          top: 0,
          zIndex: 10,
          borderBottom: "1px solid var(--border-accent)",
        }}
      >
        <div
          style={{
            width: "34px",
            height: "34px",
            borderRadius: "10px",
            background: "linear-gradient(135deg, var(--accent), #ff85b3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 8px var(--accent-glow)",
          }}
        >
          <Camera size={20} color="#fff" weight="bold" />
        </div>
        <span style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--text-primary)" }}>ClickIt</span>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.75rem",
            color: "var(--text-muted)",
            marginLeft: "auto",
          }}
        >
          {new Date(session.created_at).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>
      </header>

      {/* Main content - Responsive Container */}
      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "1.5rem 1rem 3rem 1rem",
          gap: "1.75rem",
          position: "relative",
          zIndex: 1,
          maxWidth: "680px",
          margin: "0 auto",
          width: "100%",
        }}
      >
        {/* Hero Banner */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{ textAlign: "center", width: "100%" }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.35rem 0.85rem",
              borderRadius: "20px",
              background: "var(--accent-dim)",
              color: "var(--accent)",
              fontSize: "0.8rem",
              fontWeight: 700,
              marginBottom: "0.75rem",
              border: "1px solid var(--border-accent)",
            }}
          >
            <Sparkle size={14} weight="fill" /> Hasil Foto Photobooth
          </div>
          <h1 className="display-md gradient-text" style={{ fontSize: "clamp(1.5rem, 5vw, 2.2rem)", marginBottom: "0.5rem" }}>
            Foto Kamu Siap Diunduh!
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            Simpan strip foto HD dan GIF animasi kamu langsung ke galeri HP / Tablet.
          </p>
        </motion.div>

        {/* Responsive Content Grid: Stacks on mobile, Side-by-Side on iPad/Desktop */}
        <div
          className="result-grid"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1.75rem",
            width: "100%",
            alignItems: "center",
          }}
        >
          {/* Section 1: Strip Image & Main Download */}
          {stripUrl && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
                alignItems: "center",
                width: "100%",
                maxWidth: "320px",
                background: "white",
                padding: "1.25rem",
                borderRadius: "var(--radius-card)",
                boxShadow: "0 8px 30px rgba(0,0,0,0.06)",
                border: "1.5px solid var(--border)",
              }}
            >
              <div className="label-mono" style={{ color: "var(--accent)", fontSize: "0.8rem" }}>
                Strip Foto Cetak (10×15 cm)
              </div>

              {/* Strip Image Container */}
              <div
                style={{
                  width: "100%",
                  maxWidth: "230px",
                  borderRadius: "14px",
                  overflow: "hidden",
                  border: "2.5px solid var(--border-accent)",
                  boxShadow: "0 6px 24px var(--accent-glow)",
                  background: "#fff",
                }}
              >
                <img
                  src={stripUrl}
                  alt="Strip Foto ClickIt"
                  style={{ width: "100%", height: "auto", display: "block", objectFit: "contain" }}
                />
              </div>

              {/* Touch-friendly Download Button */}
              <button
                className="btn-primary"
                onClick={() => handleDownload(stripUrl, `clickit-strip-${session.id.slice(0, 8)}.jpg`)}
                id="download-strip-btn"
                style={{
                  width: "100%",
                  minHeight: "50px",
                  fontSize: "1rem",
                  gap: "0.5rem",
                  justifyContent: "center",
                }}
              >
                <ImageSquare size={20} weight="fill" />
                Unduh Strip Foto (JPG)
              </button>
            </motion.div>
          )}

          {/* Section 2: GIF Animation & Actions */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              width: "100%",
              maxWidth: "380px",
            }}
          >
            {/* GIF Preview */}
            {gifUrl && (
              <div
                style={{
                  background: "white",
                  padding: "1.25rem",
                  borderRadius: "var(--radius-card)",
                  boxShadow: "0 8px 30px rgba(0,0,0,0.06)",
                  border: "1.5px solid var(--border)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                  alignItems: "center",
                }}
              >
                <div className="label-mono" style={{ color: "var(--accent)", fontSize: "0.8rem" }}>
                  GIF Animasi Moving Photo
                </div>
                <div
                  style={{
                    width: "100%",
                    borderRadius: "12px",
                    overflow: "hidden",
                    border: "1.5px solid var(--border)",
                  }}
                >
                  <img
                    src={gifUrl}
                    alt="GIF Animasi ClickIt"
                    style={{ width: "100%", height: "auto", display: "block" }}
                  />
                </div>

                <button
                  className="btn-secondary"
                  onClick={() => handleDownload(gifUrl, `clickit-gif-${session.id.slice(0, 8)}.gif`)}
                  id="download-gif-btn"
                  style={{
                    width: "100%",
                    minHeight: "48px",
                    fontSize: "0.95rem",
                    gap: "0.5rem",
                    justifyContent: "center",
                  }}
                >
                  <FilmSlate size={20} weight="bold" />
                  Unduh GIF Animasi
                </button>
              </div>
            )}

            {/* Session Detail Card */}
            <div className="card" style={{ display: "flex", flexDirection: "column", gap: "0.625rem", padding: "1rem 1.25rem" }}>
              <div className="label-mono">Detail Sesi Photobooth</div>
              {[
                { label: "ID Sesi", value: session.id.slice(0, 8).toUpperCase() },
                { label: "Format Strip", value: "2 Strip 5×15 cm (10×15 cm)" },
                {
                  label: "Waktu Foto",
                  value: new Date(session.created_at).toLocaleString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                    day: "numeric",
                    month: "short",
                  }),
                },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.83rem",
                  }}
                >
                  <span style={{ color: "var(--text-muted)" }}>{item.label}</span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      color: "var(--text-primary)",
                    }}
                  >
                    {item.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Download All Button */}
            {stripUrl && gifUrl && (
              <button
                className="btn-secondary"
                onClick={() => {
                  if (stripUrl) handleDownload(stripUrl, `clickit-strip-${session.id.slice(0, 8)}.jpg`);
                  if (gifUrl) setTimeout(() => handleDownload(gifUrl, `clickit-gif-${session.id.slice(0, 8)}.gif`), 400);
                }}
                id="download-all-btn"
                style={{
                  width: "100%",
                  minHeight: "50px",
                  fontSize: "1rem",
                  gap: "0.5rem",
                  justifyContent: "center",
                  background: "white",
                  borderColor: "var(--accent)",
                  color: "var(--accent)",
                }}
              >
                <DownloadSimple size={20} weight="bold" />
                Unduh Semua (Strip + GIF)
              </button>
            )}
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          textAlign: "center",
          padding: "1.5rem",
          borderTop: "1px solid var(--border)",
          color: "var(--text-muted)",
          fontSize: "0.78rem",
          fontFamily: "var(--font-mono)",
        }}
      >
        ClickIt Digital Photo Booth &middot; {new Date().getFullYear()}
      </footer>

      {/* Responsive Layout CSS overrides for iPad & Desktop screens */}
      <style jsx global>{`
        @media (min-width: 640px) {
          .result-grid {
            flex-direction: row !important;
            align-items: flex-start !important;
            justify-content: center !important;
          }
        }
      `}</style>
    </div>
  );
}
