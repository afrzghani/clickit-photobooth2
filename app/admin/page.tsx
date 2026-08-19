"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Printer,
  ClockCounterClockwise,
  Gear,
  Camera,
  CircleNotch,
  CheckCircle,
  Image as ImageIcon,
  MagnifyingGlass,
  ArrowClockwise,
  UploadSimple,
  Trash,
  Plus,
  Lock,
} from "@phosphor-icons/react";
import { supabase, type Session, type Event, type Frame } from "@/lib/supabase";
import {
  subscribeToNewSessions,
  subscribeToSessionUpdates,
  uploadToStorage,
} from "@/lib/realtime";

type AdminTab = "queue" | "history" | "config";

function printStripImage(stripUrl: string) {
  let iframe = document.getElementById("clickit-print-iframe") as HTMLIFrameElement;
  if (!iframe) {
    iframe = document.createElement("iframe");
    iframe.id = "clickit-print-iframe";
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);
  }

  const doc = iframe.contentWindow?.document || iframe.contentDocument;
  if (!doc) return;

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Cetak Strip Foto</title>
        <style>
          @page { size: 10cm 15cm; margin: 0; }
          html, body { margin: 0; padding: 0; width: 10cm; height: 15cm; overflow: hidden; background: white; }
          img { width: 10cm; height: 15cm; display: block; object-fit: contain; }
        </style>
      </head>
      <body>
        <img src="${stripUrl}" />
      </body>
    </html>
  `);
  doc.close();

  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (e) {
      console.error("Print error:", e);
    }
  }, 300);
}

// ─── Print Queue Component ─────────────────────────────────────────
function PrintQueue({
  sessions,
  onMarkPrinted,
}: {
  sessions: Session[];
  onMarkPrinted: (id: string) => void;
}) {
  const pending = sessions.filter((s) => s.status === "pending");

  const handlePrint = useCallback(
    (session: Session) => {
      if (!session.strip_url) return;
      printStripImage(session.strip_url);
      onMarkPrinted(session.id);
    },
    [onMarkPrinted]
  );

  if (pending.length === 0) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "4rem 2rem",
          gap: "1rem",
          color: "var(--text-muted)",
          textAlign: "center",
        }}
      >
        <Printer size={48} style={{ opacity: 0.3 }} />
        <p style={{ fontSize: "0.9rem" }}>Belum ada foto yang menunggu cetak.</p>
        <p style={{ fontSize: "0.8rem", fontFamily: "var(--font-mono)" }}>
          Foto baru akan muncul otomatis saat kiosk selesai.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {pending.map((session, i) => (
        <motion.div
          key={session.id}
          className="session-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <div
            style={{
              width: "64px",
              height: "80px",
              borderRadius: "6px",
              overflow: "hidden",
              background: "var(--bg-elevated)",
              flexShrink: 0,
            }}
          >
            {session.strip_url ? (
              <img
                src={session.strip_url}
                alt="Strip"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ImageIcon size={24} color="var(--text-muted)" />
              </div>
            )}
          </div>

          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.7rem",
                color: "var(--text-muted)",
                marginBottom: "0.375rem",
              }}
            >
              {session.id.slice(0, 8).toUpperCase()}
            </div>
            <div style={{ fontSize: "0.85rem", marginBottom: "0.25rem" }}>
              {new Date(session.created_at).toLocaleTimeString("id-ID")}
            </div>
            <span className="status-badge pending">Menunggu cetak</span>
          </div>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            {session.strip_url && (
              <motion.button
                className="btn-primary"
                onClick={() => handlePrint(session)}
                whileTap={{ scale: 0.97 }}
                id={`print-btn-${session.id}`}
                style={{ fontSize: "0.875rem", padding: "0.625rem 1.25rem" }}
              >
                <Printer size={16} />
                Cetak
              </motion.button>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ─── History Component ─────────────────────────────────────────────
function SessionHistory({
  sessions,
  onReprint,
}: {
  sessions: Session[];
  onReprint: (session: Session) => void;
}) {
  const [search, setSearch] = useState("");

  const filtered = sessions.filter((s) =>
    s.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ position: "relative" }}>
        <MagnifyingGlass
          size={16}
          style={{
            position: "absolute",
            left: "0.875rem",
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--text-muted)",
          }}
        />
        <input
          className="input"
          style={{ paddingLeft: "2.5rem" }}
          placeholder="Cari ID sesi..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          id="history-search"
        />
      </div>

      <div
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-admin)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "80px 1fr auto auto auto",
            gap: "1rem",
            padding: "0.75rem 1rem",
            borderBottom: "1px solid var(--border)",
            fontSize: "0.75rem",
            fontFamily: "var(--font-mono)",
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          <span>Preview</span>
          <span>Waktu</span>
          <span>Template</span>
          <span>Status</span>
          <span>Aksi</span>
        </div>

        {filtered.length === 0 ? (
          <div
            style={{
              padding: "3rem",
              textAlign: "center",
              color: "var(--text-muted)",
              fontSize: "0.875rem",
            }}
          >
            Tidak ada sesi ditemukan.
          </div>
        ) : (
          filtered.map((session) => (
            <div
              key={session.id}
              style={{
                display: "grid",
                gridTemplateColumns: "80px 1fr auto auto auto",
                gap: "1rem",
                padding: "0.875rem 1rem",
                borderBottom: "1px solid var(--border)",
                alignItems: "center",
                opacity: session.status === "printed" ? 0.65 : 1,
              }}
            >
              <div
                style={{
                  width: "50px",
                  height: "64px",
                  borderRadius: "6px",
                  overflow: "hidden",
                  background: "var(--bg-elevated)",
                }}
              >
                {session.strip_url ? (
                  <img
                    src={session.strip_url}
                    alt="Strip"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <ImageIcon size={20} color="var(--text-muted)" />
                  </div>
                )}
              </div>
              <div>
                <div style={{ fontSize: "0.875rem", marginBottom: "0.2rem" }}>
                  {new Date(session.created_at).toLocaleString("id-ID")}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.7rem",
                    color: "var(--text-muted)",
                  }}
                >
                  {session.id.slice(0, 16)}...
                </div>
              </div>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.75rem",
                  color: "var(--text-muted)",
                }}
              >
                {session.template_id ?? "default"}
              </span>
              <span className={`status-badge ${session.status}`}>
                {session.status === "pending" ? "Menunggu" : "Tercetak"}
              </span>
              <button
                className="btn-ghost"
                onClick={() => onReprint(session)}
                id={`reprint-btn-${session.id}`}
                title="Cetak ulang"
              >
                <ArrowClockwise size={16} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Event Config & PNG Frame Manager ────────────────────────────────
function EventConfig({
  event,
  onSave,
}: {
  event: Event | null;
  onSave: (updates: Partial<Event>) => void;
}) {
  const [name, setName] = useState(event?.name ?? "");
  const [headerText, setHeaderText] = useState(event?.header_text ?? "");
  const [hashtag, setHashtag] = useState(event?.hashtag ?? "");
  const [socialHandle, setSocialHandle] = useState(event?.social_handle ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Frames state
  const [frames, setFrames] = useState<Frame[]>([]);
  const [uploadingFrame, setUploadingFrame] = useState(false);
  const [frameName, setFrameName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load existing frames (Supabase + IndexedDB fallback)
  const loadFrames = useCallback(async () => {
    let loaded: Frame[] = [];
    try {
      const { data } = await supabase
        .from("frames")
        .select("*")
        .order("created_at", { ascending: false });
      if (data && data.length > 0) loaded = data as Frame[];
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

    setFrames(loaded);
  }, []);

  useEffect(() => {
    loadFrames();
  }, [loadFrames]);

  const handleSave = async () => {
    setSaving(true);
    const updates: Partial<Event> = {
      name,
      header_text: headerText || null,
      hashtag: hashtag || null,
      social_handle: socialHandle || null,
    };
    await onSave(updates);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // Upload PNG frame file
  const handleFrameUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFrame(true);
    try {
      const frameId = crypto.randomUUID();
      const nameToUse = frameName.trim() || file.name.replace(/\.[^/.]+$/, "");

      // Dual-Image generation: High-Res (1181x1772) + Mini Thumbnail (200x300)
      const { imageUrl, thumbnailUrl } = await new Promise<{ imageUrl: string; thumbnailUrl: string }>((resolve) => {
        const reader = new FileReader();
        reader.onload = (re) => {
          const img = new Image();
          img.onload = () => {
            // High-Res
            const cHigh = document.createElement("canvas");
            cHigh.width = 1181;
            cHigh.height = 1772;
            const ctxH = cHigh.getContext("2d")!;
            ctxH.clearRect(0, 0, 1181, 1772);
            ctxH.drawImage(img, 0, 0, 1181, 1772);
            const highRes = cHigh.toDataURL("image/png");

            // Mini Thumbnail (200x300) ~20KB for 0ms UI loading
            const cThumb = document.createElement("canvas");
            cThumb.width = 200;
            cThumb.height = 300;
            const ctxT = cThumb.getContext("2d")!;
            ctxT.clearRect(0, 0, 200, 300);
            ctxT.drawImage(img, 0, 0, 200, 300);
            const miniThumb = cThumb.toDataURL("image/png");

            resolve({ imageUrl: highRes, thumbnailUrl: miniThumb });
          };
          img.onerror = () => resolve({ imageUrl: re.target?.result as string, thumbnailUrl: re.target?.result as string });
          img.src = re.target?.result as string;
        };
        reader.readAsDataURL(file);
      });

      let finalImageUrl = imageUrl;
      try {
        const uploaded = await uploadToStorage(
          "templates",
          `${frameId}.png`,
          file,
          "image/png"
        );
        if (uploaded) finalImageUrl = uploaded;
      } catch {
        // fallback to dataUrl
      }

      const newFrame: Frame = {
        id: frameId,
        name: nameToUse,
        image_url: finalImageUrl,
        thumbnail_url: thumbnailUrl,
        layout_type: "2x3_strip",
      };

      // Save to IndexedDB (supports unlimited file size for high-res PNG frames)
      const { saveFrameIDB } = await import("@/lib/idb");
      await saveFrameIDB(newFrame);

      // Try insert into Supabase DB
      try {
        await supabase.from("frames").insert(newFrame);
      } catch {
        // ignore
      }

      // Update state instantly!
      setFrames((prev) => [newFrame, ...prev.filter((f) => f.id !== frameId)]);

      // Broadcast to Kiosk
      const { broadcastLocal } = await import("@/lib/realtime");
      broadcastLocal("NEW_FRAME", newFrame);

      setFrameName("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      console.error("Frame upload failed:", err);
    } finally {
      setUploadingFrame(false);
    }
  };

  const handleDeleteFrame = async (id: string) => {
    try {
      await supabase.from("frames").delete().eq("id", id);
    } catch {
      // ignore
    }

    try {
      const { deleteFrameIDB } = await import("@/lib/idb");
      await deleteFrameIDB(id);
    } catch {
      // ignore
    }

    setFrames((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "2rem",
        maxWidth: "680px",
      }}
    >
      {/* Event Details */}
      <div>
        <h3
          style={{
            fontSize: "1rem",
            fontWeight: 700,
            marginBottom: "1rem",
            paddingBottom: "0.75rem",
            borderBottom: "1px solid var(--border)",
          }}
        >
          Konfigurasi Acara
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {[
            { id: "cfg-name", label: "Nama Acara", value: name, setter: setName, placeholder: "Contoh: PPKMB FT 2026" },
            { id: "cfg-header", label: "Teks Header Strip", value: headerText, setter: setHeaderText, placeholder: "PHOTOBOOTH" },
            { id: "cfg-hashtag", label: "Hashtag", value: hashtag, setter: setHashtag, placeholder: "#PPKMB2026" },
            { id: "cfg-social", label: "Social Handle", value: socialHandle, setter: setSocialHandle, placeholder: "@hmpti.unesa" },
          ].map((field) => (
            <div key={field.id}>
              <label className="label" htmlFor={field.id}>
                {field.label}
              </label>
              <input
                id={field.id}
                className="input"
                value={field.value}
                onChange={(e) => field.setter(e.target.value)}
                placeholder={field.placeholder}
              />
            </div>
          ))}

          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={saving}
            id="save-config-btn"
            style={{ alignSelf: "flex-start", marginTop: "0.5rem" }}
          >
            {saving ? (
              <CircleNotch size={18} className="animate-spin-slow" />
            ) : saved ? (
              <CheckCircle size={18} weight="fill" />
            ) : (
              <Gear size={18} />
            )}
            {saving ? "Menyimpan..." : saved ? "Tersimpan!" : "Simpan Konfigurasi"}
          </button>
        </div>
      </div>

      {/* Upload PNG Frame Section */}
      <div>
        <h3
          style={{
            fontSize: "1rem",
            fontWeight: 700,
            marginBottom: "0.5rem",
            paddingBottom: "0.75rem",
            borderBottom: "1px solid var(--border)",
          }}
        >
          Upload Frame PNG Strip (10×15 cm)
        </h3>
        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
          Unggah file PNG overlay dengan area transparan tempat foto (layout 2 strip 10x15cm).
        </p>

        {/* Upload Box */}
        <div
          style={{
            background: "var(--bg-surface)",
            border: "2px dashed var(--border-accent)",
            borderRadius: "var(--radius-card)",
            padding: "1.5rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1rem",
            textAlign: "center",
          }}
        >
          <div style={{ width: "100%", maxWidth: "320px" }}>
            <input
              className="input"
              placeholder="Nama Frame (Opsional)"
              value={frameName}
              onChange={(e) => setFrameName(e.target.value)}
              style={{ marginBottom: "0.75rem" }}
            />
          </div>

          <input
            type="file"
            ref={fileInputRef}
            accept="image/png"
            onChange={handleFrameUpload}
            style={{ display: "none" }}
            id="png-frame-input"
          />

          <button
            className="btn-secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingFrame}
            id="select-frame-btn"
          >
            {uploadingFrame ? (
              <CircleNotch size={18} className="animate-spin-slow" />
            ) : (
              <UploadSimple size={18} />
            )}
            {uploadingFrame ? "Mengunggah Frame..." : "Pilih File PNG Frame"}
          </button>
        </div>

        {/* Existing Uploaded Frames Grid */}
        {frames.length > 0 && (
          <div style={{ marginTop: "1.5rem" }}>
            <div className="label-mono" style={{ marginBottom: "0.75rem" }}>
              Daftar Frame PNG Aktif ({frames.length})
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
              {frames.map((f) => (
                <div
                  key={f.id}
                  style={{
                    background: "var(--bg-surface)",
                    border: "1.5px solid var(--border)",
                    borderRadius: "12px",
                    padding: "0.75rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                  }}
                >
                  <div
                    style={{
                      aspectRatio: "2/3",
                      borderRadius: "8px",
                      overflow: "hidden",
                      background: "#f5f5f5",
                    }}
                  >
                    <img
                      src={f.image_url}
                      alt={f.name}
                      style={{ width: "100%", height: "100%", objectFit: "contain" }}
                    />
                  </div>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {f.name}
                  </div>
                  <button
                    className="btn-ghost"
                    onClick={() => handleDeleteFrame(f.id)}
                    style={{ color: "#ff3d57", alignSelf: "flex-end", padding: "0.25rem 0.5rem" }}
                  >
                    <Trash size={16} />
                    Hapus
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Admin Page ───────────────────────────────────────────────
export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);

  const [activeTab, setActiveTab] = useState<AdminTab>("queue");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof sessionStorage !== "undefined" && sessionStorage.getItem("clickit_admin_auth") === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === "192837" || pinInput.trim() === "192837") {
      setIsAuthenticated(true);
      setPinError(false);
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.setItem("clickit_admin_auth", "true");
      }
    } else {
      setPinError(true);
    }
  };

  // Load event & sessions (with local fallback)
  useEffect(() => {
    async function load() {
      let ev: Event | null = null;
      let sess: Session[] = [];

      try {
        const { data: evData } = await supabase
          .from("events")
          .select("*")
          .eq("active", true)
          .single();

        if (evData) {
          ev = evData as Event;
          const { data: sessData } = await supabase
            .from("sessions")
            .select("*")
            .eq("event_id", evData.id)
            .order("created_at", { ascending: false })
            .limit(100);

          if (sessData) sess = sessData as Session[];
        }
      } catch {
        // ignore
      }

      // Merge local storage sessions if offline or placeholder
      if (typeof window !== "undefined") {
        try {
          const localSess: Session[] = JSON.parse(localStorage.getItem("clickit_sessions") || "[]");
          const existingIds = new Set(sess.map((s) => s.id));
          for (const s of localSess) {
            if (!existingIds.has(s.id)) {
              sess.push(s);
            }
          }
          sess.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        } catch {
          // ignore
        }
      }

      setEvent(ev || { id: "default-event", name: "ClickIt Event", active: true, active_templates: [], header_text: "PHOTOBOOTH", hashtag: "#clickit", social_handle: "@clickit", created_at: new Date().toISOString(), theme: { accent: "#ff3d8a" } });
      setSessions(sess);
      setLoading(false);
    }
    load();
  }, []);

  // Real-time new sessions & status updates
  useEffect(() => {
    const eventId = event?.id || "default-event";
    const unsub1 = subscribeToNewSessions(eventId, (newSession) => {
      setSessions((prev) => {
        if (prev.some((s) => s.id === newSession.id)) return prev;
        return [newSession, ...prev];
      });
    });
    const unsub2 = subscribeToSessionUpdates(eventId, (updated) => {
      setSessions((prev) =>
        prev.map((s) => (s.id === updated.id ? updated : s))
      );
    });
    return () => { unsub1(); unsub2(); };
  }, [event?.id]);

  const handleMarkPrinted = useCallback(async (id: string) => {
    try {
      await supabase.from("sessions").update({ status: "printed" }).eq("id", id);
    } catch {
      // ignore
    }

    if (typeof window !== "undefined") {
      try {
        const localSess: Session[] = JSON.parse(localStorage.getItem("clickit_sessions") || "[]");
        const updatedLocal = localSess.map((s) => (s.id === id ? { ...s, status: "printed" as const } : s));
        localStorage.setItem("clickit_sessions", JSON.stringify(updatedLocal));
      } catch {}
    }

    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: "printed" } : s))
    );

    const { broadcastLocal } = await import("@/lib/realtime");
    broadcastLocal("SESSION_UPDATED", { id, status: "printed" });
  }, []);

  const handleReprint = useCallback((session: Session) => {
    if (!session.strip_url) return;
    printStripImage(session.strip_url);
    handleMarkPrinted(session.id);
  }, [handleMarkPrinted]);

  const handleSaveConfig = useCallback(
    async (updates: Partial<Event>) => {
      if (!event?.id) return;
      const { data } = await supabase
        .from("events")
        .update(updates)
        .eq("id", event.id)
        .select()
        .single();
      if (data) setEvent(data as Event);
    },
    [event?.id]
  );

  const navItems = [
    {
      id: "queue" as AdminTab,
      label: "Antrian Cetak",
      icon: <Printer size={18} />,
      badge: sessions.filter((s) => s.status === "pending").length,
    },
    {
      id: "history" as AdminTab,
      label: "Riwayat",
      icon: <ClockCounterClockwise size={18} />,
      badge: 0,
    },
    {
      id: "config" as AdminTab,
      label: "Konfigurasi & Frame",
      icon: <Gear size={18} />,
      badge: 0,
    },
  ];

  if (!isAuthenticated) {
    return (
      <div
        className="kiosk-container dot-pattern"
        style={{
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card-elevated"
          style={{
            width: "100%",
            maxWidth: "400px",
            padding: "2.5rem 2rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1.5rem",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "20px",
              background: "var(--accent-dim)",
              border: "1.5px solid var(--border-accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--accent)",
            }}
          >
            <Lock size={32} weight="bold" />
          </div>

          <div>
            <h2 className="display-md" style={{ fontSize: "1.375rem", marginBottom: "0.25rem" }}>
              Admin Dashboard PIN
            </h2>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              Masukkan PIN untuk membuka akses dashboard admin.
            </p>
          </div>

          <form onSubmit={handlePinSubmit} style={{ width: "100%", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <input
                type="password"
                className="input"
                placeholder="PIN Admin"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                style={{ textAlign: "center", fontSize: "1.2rem", letterSpacing: "0.25em" }}
                autoFocus
              />
              {pinError && (
                <div style={{ color: "#ff3d57", fontSize: "0.78rem", marginTop: "0.375rem" }}>
                  PIN salah. Masukkan PIN yang benar.
                </div>
              )}
            </div>

            <button type="submit" className="btn-primary" style={{ width: "100%" }}>
              Buka Dashboard Admin
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar no-print">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            padding: "0.5rem 0.875rem",
            marginBottom: "1.5rem",
          }}
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, var(--accent), #ff85b3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Camera size={18} color="#fff" weight="bold" />
          </div>
          <div>
            <div
              style={{ fontWeight: 700, fontSize: "0.95rem", lineHeight: 1.2 }}
            >
              ClickIt
            </div>
            <div
              style={{
                fontSize: "0.65rem",
                fontFamily: "var(--font-mono)",
                color: "var(--text-muted)",
              }}
            >
              Admin Dashboard
            </div>
          </div>
        </div>

        {event && (
          <div
            style={{
              padding: "0.625rem 0.875rem",
              background: "var(--accent-dim)",
              borderRadius: "var(--radius-admin)",
              marginBottom: "1.5rem",
              border: "1px solid var(--border-accent)",
            }}
          >
            <div
              style={{
                fontSize: "0.65rem",
                fontFamily: "var(--font-mono)",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: "0.25rem",
              }}
            >
              Acara Aktif
            </div>
            <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>
              {event.name}
            </div>
          </div>
        )}

        <nav style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`admin-nav-item ${activeTab === item.id ? "active" : ""}`}
              onClick={() => setActiveTab(item.id)}
              id={`nav-${item.id}`}
            >
              {item.icon}
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge > 0 && (
                <span
                  style={{
                    background: "var(--accent)",
                    color: "#fff",
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    padding: "0.1rem 0.45rem",
                    borderRadius: "999px",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <main className="admin-main">
        {loading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              paddingTop: "4rem",
            }}
          >
            <CircleNotch
              size={32}
              color="var(--accent)"
              className="animate-spin-slow"
            />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              <div style={{ marginBottom: "1.5rem" }}>
                <h1
                  style={{
                    fontSize: "1.375rem",
                    fontWeight: 700,
                    marginBottom: "0.25rem",
                  }}
                >
                  {activeTab === "queue" && "Antrian Cetak"}
                  {activeTab === "history" && "Riwayat Sesi"}
                  {activeTab === "config" && "Konfigurasi & Frame PNG"}
                </h1>
                <p
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--text-muted)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {sessions.length} sesi total &middot;{" "}
                  {sessions.filter((s) => s.status === "pending").length} menunggu
                </p>
              </div>

              {activeTab === "queue" && (
                <PrintQueue
                  sessions={sessions}
                  onMarkPrinted={handleMarkPrinted}
                />
              )}
              {activeTab === "history" && (
                <SessionHistory
                  sessions={sessions}
                  onReprint={handleReprint}
                />
              )}
              {activeTab === "config" && (
                <EventConfig event={event} onSave={handleSaveConfig} />
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </main>
    </div>
  );
}
