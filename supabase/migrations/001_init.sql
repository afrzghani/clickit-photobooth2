-- ============================================================
-- ClickIt Photo Booth — Database Migration
-- Jalankan ini di Supabase SQL Editor
-- ============================================================

-- Extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ──────────────────────────────────────────────────────────────
-- Table: events
-- Satu event per acara. Admin konfigurasikan lewat dashboard.
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL DEFAULT 'ClickIt Event',
  active          BOOLEAN NOT NULL DEFAULT TRUE,
  theme           JSONB NOT NULL DEFAULT '{"accent": "#ff3d8a"}',
  active_templates TEXT[] NOT NULL DEFAULT ARRAY['pink-bloom', 'blush-pop', 'minimal-dark', 'golden-hour'],
  header_text     TEXT,
  hashtag         TEXT,
  social_handle   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────────
-- Table: frames (PNG Frame Overlays)
-- Frame PNG 10x15cm yang diunggah oleh admin.
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS frames (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  image_url     TEXT NOT NULL,
  thumbnail_url TEXT,
  layout_type   TEXT NOT NULL DEFAULT '2x3_strip',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────────
-- Table: sessions
-- Setiap sesi foto oleh pembeli.
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id      UUID REFERENCES events(id) ON DELETE SET NULL,
  strip_url     TEXT,
  gif_url       TEXT,
  raw_photos    JSONB,
  template_id   TEXT NOT NULL DEFAULT 'pink-bloom',
  frame_url     TEXT,
  glam_enabled  BOOLEAN NOT NULL DEFAULT FALSE,
  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'printed')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast queue loading
CREATE INDEX IF NOT EXISTS idx_sessions_event_status
  ON sessions(event_id, status, created_at DESC);

-- ──────────────────────────────────────────────────────────────
-- RLS Policies
-- ──────────────────────────────────────────────────────────────

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE frames ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Events: public read
CREATE POLICY "events_public_select"
  ON events FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "events_auth_insert"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "events_auth_update"
  ON events FOR UPDATE
  TO authenticated
  USING (true);

-- Frames: public read (kiosk needs frames), anon/auth insert & delete
CREATE POLICY "frames_public_select"
  ON frames FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "frames_public_insert"
  ON frames FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "frames_public_delete"
  ON frames FOR DELETE
  TO anon, authenticated
  USING (true);

-- Sessions: public insert & read
CREATE POLICY "sessions_anon_insert"
  ON sessions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "sessions_public_select"
  ON sessions FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "sessions_auth_update"
  ON sessions FOR UPDATE
  TO authenticated
  USING (true);

-- ──────────────────────────────────────────────────────────────
-- Realtime
-- ──────────────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE events;
ALTER PUBLICATION supabase_realtime ADD TABLE frames;

-- Seed: default event
INSERT INTO events (name, active, header_text, hashtag, social_handle)
VALUES ('ClickIt Event', true, 'PHOTOBOOTH', '#PPKMB2026', '@hmpti.unesa')
ON CONFLICT DO NOTHING;
