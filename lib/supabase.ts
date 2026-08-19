import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Session = {
  id: string;
  event_id: string | null;
  strip_url: string | null;
  gif_url: string | null;
  raw_photos: { url: string; timestamp: string }[] | null;
  template_id: string | null;
  frame_url?: string | null;
  glam_enabled: boolean;
  status: "pending" | "printed";
  created_at: string;
};

export type Frame = {
  id: string;
  name: string;
  image_url: string;
  preview_url?: string | null;
  layout_type?: string;
  created_at?: string;
};

export type Event = {
  id: string;
  name: string;
  active: boolean;
  theme: {
    accent?: string;
    background?: string;
    headerBg?: string;
  };
  active_templates: string[];
  header_text: string | null;
  hashtag: string | null;
  social_handle: string | null;
  created_at: string;
};
