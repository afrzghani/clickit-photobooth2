"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { DownloadSimple, FilmSlate, ImageSquare, Camera } from "@phosphor-icons/react";
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
        overflow: "hidden",
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
          background:
            "radial-gradient(ellipse, rgba(224,64,251,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Header */}
      <header
        className="glass"
        style={{
          padding: "1rem 2rem",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "8px",
            background: "linear-gradient(135deg, var(--accent), #7b2ff7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Camera size={18} color="#fff" weight="bold" />
        </div>
        <span style={{ fontWeight: 700, fontSize: "1rem" }}>ClickIt</span>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.7rem",
            color: "var(--text-muted)",
            marginLeft: "auto",
          }}
        >
          {new Date(session.created_at).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </span>
      </header>

      {/* Main content */}
      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "3rem 1.5rem",
          gap: "3rem",
          position: "relative",
          zIndex: 1,
          maxWidth: "760px",
          margin: "0 auto",
          width: "100%",
        }}
      >
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          style={{ textAlign: "center" }}
        >
          <h1 className="display-lg gradient-text" style={{ marginBottom: "0.75rem" }}>
            Foto kamu siap!
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "1rem" }}>
            Download strip foto atau GIF animasi di bawah.
          </p>
        </motion.div>

        {/* Strip + GIF side by side */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: stripUrl && gifUrl ? "auto 1fr" : "1fr",
            gap: "2rem",
            width: "100%",
            alignItems: "start",
          }}
        >
          {/* Strip preview */}
          {stripUrl && (
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
                alignItems: "center",
              }}
            >
              {/* Strip image — portrait proportions */}
              <div
                style={{
                  width: "200px",
                  borderRadius: "16px",
                  overflow: "hidden",
                  border: "2px solid var(--border-accent)",
                  boxShadow: "0 0 40px var(--accent-glow)",
                }}
              >
                <img
                  src={stripUrl}
                  alt="Strip foto"
                  style={{ width: "100%", display: "block" }}
                />
              </div>

              <button
                className="btn-primary"
                onClick={() => handleDownload(stripUrl, `clickit-strip-${session.id.slice(0,8)}.jpg`)}
                id="download-strip-btn"
              >
                <ImageSquare size={18} />
                Unduh Strip
              </button>
            </motion.div>
          )}

          {/* GIF + info */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            {gifUrl && (
              <div
                style={{
                  borderRadius: "16px",
                  overflow: "hidden",
                  border: "1px solid var(--border)",
                }}
              >
                <img
                  src={gifUrl}
                  alt="GIF animasi"
                  style={{ width: "100%", display: "block" }}
                />
              </div>
            )}

            <div className="card" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div className="label-mono">Detail Sesi</div>
              {[
                { label: "ID", value: session.id.slice(0, 16) + "..." },
                { label: "Template", value: session.template_id ?? "default" },
                { label: "Glam Booth", value: session.glam_enabled ? "Aktif" : "Nonaktif" },
                {
                  label: "Waktu",
                  value: new Date(session.created_at).toLocaleString("id-ID"),
                },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.85rem",
                  }}
                >
                  <span style={{ color: "var(--text-muted)" }}>{item.label}</span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.8rem",
                    }}
                  >
                    {item.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Download GIF */}
            {gifUrl && (
              <button
                className="btn-secondary"
                onClick={() => handleDownload(gifUrl, `clickit-gif-${session.id.slice(0,8)}.gif`)}
                id="download-gif-btn"
                style={{ width: "100%" }}
              >
                <FilmSlate size={18} />
                Unduh GIF Animasi
              </button>
            )}

            {/* Download both */}
            {stripUrl && (
              <button
                className="btn-secondary"
                onClick={() => {
                  if (stripUrl)
                    handleDownload(stripUrl, `clickit-strip-${session.id.slice(0,8)}.jpg`);
                  if (gifUrl)
                    setTimeout(() => handleDownload(gifUrl, `clickit-gif-${session.id.slice(0,8)}.gif`), 300);
                }}
                id="download-all-btn"
              >
                <DownloadSimple size={18} />
                Unduh Semua
              </button>
            )}
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          textAlign: "center",
          padding: "2rem",
          borderTop: "1px solid var(--border)",
          color: "var(--text-muted)",
          fontSize: "0.8rem",
          fontFamily: "var(--font-mono)",
        }}
      >
        ClickIt Photo Booth &middot; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
