import { supabase, type Session } from "@/lib/supabase";
import ResultView from "../ResultClient";
import type { Metadata } from "next";

interface Props {
  params: { sessionId: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: `Foto Kamu — ClickIt`,
    description: "Download strip foto dan GIF dari sesi ClickIt kamu.",
  };
}

export default async function ResultPage({ params }: Props) {
  let sessionRecord: Session | null = null;

  try {
    const { data } = await supabase
      .from("sessions")
      .select("*")
      .eq("id", params.sessionId)
      .single();

    if (data) {
      sessionRecord = data as Session;
    }
  } catch {
    // ignore
  }

  // Fallback for local testing if Supabase returns null or is not configured
  if (!sessionRecord) {
    sessionRecord = {
      id: params.sessionId,
      event_id: "default-event",
      strip_url: null,
      gif_url: null,
      raw_photos: null,
      template_id: "pink-bloom",
      glam_enabled: false,
      status: "pending",
      created_at: new Date().toISOString(),
    };
  }

  return <ResultView session={sessionRecord} />;
}
