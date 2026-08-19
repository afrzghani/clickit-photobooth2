"use client";

import { motion } from "motion/react";
import { Camera, Sparkle, Heart } from "@phosphor-icons/react";

interface WelcomeScreenProps {
  eventName?: string;
  onStart: () => void;
}

export default function WelcomeScreen({ eventName, onStart }: WelcomeScreenProps) {
  return (
    <div className="kiosk-container dot-pattern">
      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: "1.75rem",
          maxWidth: "500px",
          width: "100%",
        }}
      >
        {/* Event name badge */}
        {eventName && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              background: "var(--accent-dim)",
              border: "1.5px solid var(--border-accent)",
              borderRadius: "999px",
              padding: "0.375rem 1rem",
              fontSize: "0.8rem",
              fontWeight: 600,
              color: "var(--accent)",
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.06em",
            }}
          >
            <Heart size={12} weight="fill" />
            {eventName}
          </motion.div>
        )}

        {/* Logo mark */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="animate-float"
          style={{
            width: "100px",
            height: "100px",
            borderRadius: "30px",
            background: "linear-gradient(135deg, var(--accent), var(--accent-secondary))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 8px 40px var(--accent-glow)",
          }}
        >
          <Camera size={50} color="#fff" weight="bold" />
        </motion.div>

        {/* Title */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
          <motion.h1
            className="display-xl gradient-text"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            ClickIt
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontSize: "1.1rem",
              color: "var(--text-secondary)",
              lineHeight: 1.55,
            }}
          >
            Foto bareng, kenangan selamanya. ✨
          </motion.p>
        </div>

        {/* CTA */}
        <motion.button
          className="btn-primary"
          onClick={onStart}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          style={{ fontSize: "1.2rem", padding: "1rem 3rem" }}
          id="kiosk-start-btn"
        >
          <Sparkle size={22} weight="fill" />
          Mulai Foto
        </motion.button>

        {/* Steps */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.25rem", width: "100%" }}
        >
          <div className="glow-line" style={{ width: "100%", maxWidth: "300px" }} />

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.25rem", width: "100%" }}>
            {[
              { num: "01", label: "Pilih template" },
              { num: "02", label: "3 foto sesi" },
              { num: "03", label: "Scan & unduh" },
            ].map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.65 + i * 0.1 }}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.3rem" }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: "var(--accent-dim)",
                    border: "1.5px solid var(--border-accent)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.65rem",
                    color: "var(--accent)",
                    fontWeight: 700,
                  }}
                >
                  {step.num}
                </div>
                <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{step.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
