import { supabase, type Session } from "./supabase";

// Local BroadcastChannel for instant local tab sync when Supabase is offline/not setup
const localChannel =
  typeof window !== "undefined" && "BroadcastChannel" in window
    ? new BroadcastChannel("clickit_local_sync")
    : null;

export function broadcastLocal(type: string, payload: any) {
  if (localChannel) {
    try {
      localChannel.postMessage({ type, payload });
    } catch (e) {
      console.warn("BroadcastChannel error:", e);
    }
  }
}

/**
 * Subscribe to new sessions in real-time (for admin print queue)
 */
export function subscribeToNewSessions(
  eventId: string,
  onInsert: (session: Session) => void
) {
  // 1. Supabase Postgres Realtime
  let channel: any = null;
  try {
    channel = supabase
      .channel(`sessions:${eventId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "sessions",
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => onInsert(payload.new as Session)
      )
      .subscribe();
  } catch (e) {
    console.warn("Supabase realtime error:", e);
  }

  // 2. Local BroadcastChannel fallback
  const handleMessage = (e: MessageEvent) => {
    if (e.data?.type === "NEW_SESSION" && e.data?.payload) {
      onInsert(e.data.payload as Session);
    }
  };

  if (localChannel) {
    localChannel.addEventListener("message", handleMessage);
  }

  return () => {
    if (channel) supabase.removeChannel(channel);
    if (localChannel) localChannel.removeEventListener("message", handleMessage);
  };
}

/**
 * Subscribe to session status updates (pending <-> printed)
 */
export function subscribeToSessionUpdates(
  eventId: string,
  onUpdate: (session: Session) => void
) {
  let channel: any = null;
  try {
    channel = supabase
      .channel(`session-updates:${eventId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "sessions",
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => onUpdate(payload.new as Session)
      )
      .subscribe();
  } catch (e) {
    console.warn("Supabase update subscription error:", e);
  }

  const handleMessage = (e: MessageEvent) => {
    if (e.data?.type === "SESSION_UPDATED" && e.data?.payload) {
      onUpdate(e.data.payload as Session);
    }
  };

  if (localChannel) {
    localChannel.addEventListener("message", handleMessage);
  }

  return () => {
    if (channel) supabase.removeChannel(channel);
    if (localChannel) localChannel.removeEventListener("message", handleMessage);
  };
}

/**
 * Subscribe to event config changes (for kiosk to receive admin config)
 */
export function subscribeToEventConfig(
  eventId: string,
  onUpdate: (config: Record<string, unknown>) => void
) {
  let channel: any = null;
  try {
    channel = supabase
      .channel(`event-config:${eventId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "events",
          filter: `id=eq.${eventId}`,
        },
        (payload) => onUpdate(payload.new as Record<string, unknown>)
      )
      .subscribe();
  } catch (e) {
    console.warn("Supabase event config error:", e);
  }

  const handleMessage = (e: MessageEvent) => {
    if (e.data?.type === "EVENT_CONFIG_UPDATED" && e.data?.payload) {
      onUpdate(e.data.payload);
    }
  };

  if (localChannel) {
    localChannel.addEventListener("message", handleMessage);
  }

  return () => {
    if (channel) supabase.removeChannel(channel);
    if (localChannel) localChannel.removeEventListener("message", handleMessage);
  };
}

export async function uploadToStorage(
  bucket: string,
  path: string,
  file: Blob,
  contentType: string
): Promise<string> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url || url.includes("placeholder")) {
    throw new Error("Supabase URL is not configured (placeholder)");
  }

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { contentType, upsert: false });

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}
