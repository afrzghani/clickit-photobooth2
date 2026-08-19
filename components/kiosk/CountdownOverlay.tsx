"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

interface CountdownOverlayProps {
  onComplete: () => void;
  startFrom?: number;
}

export default function CountdownOverlay({
  onComplete,
  startFrom = 3,
}: CountdownOverlayProps) {
  const [count, setCount] = useState(startFrom);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (count === 0) {
      setVisible(false);
      setTimeout(onComplete, 200);
      return;
    }

    const timer = setTimeout(() => {
      setCount((c) => c - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [count, onComplete]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(10, 10, 15, 0.75)",
            backdropFilter: "blur(4px)",
            borderRadius: "inherit",
            zIndex: 30,
          }}
        >
          <AnimatePresence mode="wait">
            {count > 0 ? (
              <motion.span
                key={count}
                initial={{ scale: 1.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.4, opacity: 0 }}
                transition={{
                  duration: 0.4,
                  ease: [0.16, 1, 0.3, 1],
                }}
                style={{
                  fontSize: "clamp(6rem, 20vw, 10rem)",
                  fontWeight: 900,
                  color: "white",
                  lineHeight: 1,
                  textShadow: "0 0 60px var(--accent-glow)",
                  fontFamily: "var(--font-display)",
                }}
              >
                {count}
              </motion.span>
            ) : (
              <motion.div
                key="shoot"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1.2, opacity: 1 }}
                exit={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 0.3 }}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <span
                  style={{
                    fontSize: "clamp(3rem, 10vw, 6rem)",
                    fontWeight: 800,
                    color: "var(--accent)",
                    fontFamily: "var(--font-display)",
                    textShadow: "0 0 80px var(--accent-glow)",
                  }}
                >
                  KLIK!
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
