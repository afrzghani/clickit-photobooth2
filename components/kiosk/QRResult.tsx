"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { QrCode, DownloadSimple, ArrowCounterClockwise } from "@phosphor-icons/react";
import { QRCodeSVG } from "qrcode.react";

interface QRResultProps {
  sessionId: string;
  stripUrl: string | null;
  onReset: () => void;
}

const AUTO_RESET_SEC = 60;

export default function QRResult({ sessionId, stripUrl, onReset }: QRResultProps) {
  const [secondsLeft, setSecondsLeft] = useState(AUTO_RESET_SEC);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const resultUrl = `${appUrl}/result/${sessionId}`;

  useEffect(() => {
    if (secondsLeft <= 0) {
      onReset();
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft, onReset]);

  return (
    <div className="kiosk-container">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "2rem",
          zIndex: 1,
          position: "relative",
          textAlign: "center",
          width: "100%",
          maxWidth: "480px",
        }}
      >
        {/* Success title */}
        <div>
          <motion.h2
            className="display-lg gradient-text"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Foto siap!
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            style={{ color: "var(--text-secondary)", marginTop: "0.5rem" }}
          >
            Scan QR untuk unduh strip + GIF kamu.
          </motion.p>
        </div>

        {/* QR Code */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 20 }}
          style={{
            background: "white",
            padding: "1.5rem",
            borderRadius: "24px",
            boxShadow: "0 0 60px var(--accent-glow), 0 0 120px rgba(224,64,251,0.1)",
          }}
        >
          <QRCodeSVG
            id="result-qr-code"
            value={resultUrl}
            size={220}
            level="M"
            includeMargin={false}
          />
        </motion.div>

        {/* URL */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.75rem",
            color: "var(--text-muted)",
            background: "var(--bg-surface)",
            padding: "0.5rem 1rem",
            borderRadius: "8px",
            border: "1px solid var(--border)",
          }}
        >
          {resultUrl}
        </motion.div>

        {/* Strip preview (if uploaded) */}
        {stripUrl && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              padding: "1rem",
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              borderRadius: "16px",
              width: "100%",
            }}
          >
            <div
              style={{
                width: "60px",
                height: "80px",
                borderRadius: "8px",
                overflow: "hidden",
                flexShrink: 0,
              }}
            >
              <img
                src={stripUrl}
                alt="Strip preview"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
            <div style={{ textAlign: "left", flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: "0.25rem" }}>
                Strip foto siap
              </div>
              <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                Scan QR untuk unduh kualitas penuh
              </div>
            </div>
            <QrCode size={32} color="var(--accent)" />
          </motion.div>
        )}

        {/* Auto-reset countdown */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1rem",
            width: "100%",
          }}
        >
          {/* Progress bar */}
          <div
            style={{
              width: "100%",
              height: "3px",
              background: "var(--bg-elevated)",
              borderRadius: "2px",
              overflow: "hidden",
            }}
          >
            <motion.div
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: AUTO_RESET_SEC, ease: "linear" }}
              style={{
                height: "100%",
                background: "linear-gradient(90deg, var(--accent), var(--accent-cyan))",
              }}
            />
          </div>

          <div
            style={{
              display: "flex",
              gap: "1rem",
              alignItems: "center",
              width: "100%",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.78rem",
                color: "var(--text-muted)",
                flex: 1,
                textAlign: "left",
              }}
            >
              Reset otomatis dalam {secondsLeft}s
            </span>
            <button
              className="btn-secondary"
              onClick={onReset}
              id="qr-reset-btn"
              style={{ fontSize: "0.85rem", padding: "0.625rem 1.25rem" }}
            >
              <ArrowCounterClockwise size={16} />
              Sesi Baru
            </button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
