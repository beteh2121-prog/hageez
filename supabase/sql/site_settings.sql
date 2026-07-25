-- ── Site Settings ────────────────────────────────────────────────────────
-- Key-value store for all editable site configuration (hero, footer, etc).
-- Run this once in Supabase → SQL Editor → New query.

CREATE TABLE IF NOT EXISTS site_settings (
  key        text PRIMARY KEY,
  value      jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read site_settings"
  ON site_settings FOR SELECT USING (true);

CREATE POLICY "Admin write site_settings"
  ON site_settings FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ── Default values ───────────────────────────────────────────────────────
INSERT INTO site_settings (key, value) VALUES
  ('site', '{
    "name": "Ethiopian Orthodox Heritage",
    "description": "Ethiopian Orthodox faith, culture, and crafts.",
    "logo_text": "Ethiopian Orthodox Heritage",
    "logo_icon": "✝"
  }'),
  ('hero', '{
    "tagline": "Ethiopian Orthodox Tewahedo",
    "title": "Rooted in Faith, Crafted with Purpose",
    "subtitle": "A curated marketplace of books, ebooks, merch, and spiritual resources — dedicated to Ethiopian Orthodox Tewahedo literature, theology, and culture.",
    "cta_primary_text": "Browse Books",
    "cta_primary_href": "/books",
    "cta_secondary_text": "Free Downloads",
    "cta_secondary_href": "/downloads"
  }'),
  ('stats', '[
    {"num": "240+", "label": "Books & Ebooks"},
    {"num": "18",   "label": "Free Downloads"},
    {"num": "4.9★", "label": "Avg. Rating"},
    {"num": "12k+", "label": "Readers"}
  ]'),
  ('testimonial', '{
    "quote": "This is the most complete collection of Ethiopian Orthodox spiritual resources I have found outside of Ethiopia itself.",
    "attribution": "— Reader, Addis Ababa"
  }'),
  ('footer', '{
    "tagline": "A curated marketplace dedicated to Ethiopian Orthodox Tewahedo literature, theology, crafts, and cultural resources — for the faithful everywhere.",
    "facebook_url": "https://facebook.com",
    "instagram_url": "https://instagram.com",
    "youtube_url": "https://youtube.com",
    "support_email": "support@yourdomain.com"
  }')
ON CONFLICT (key) DO NOTHING;

-- ── Custom Pages ─────────────────────────────────────────────────────────
-- Pages you can add/edit/delete entirely from /admin/pages, no code needed.

CREATE TABLE IF NOT EXISTS site_pages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  slug        text NOT NULL UNIQUE,
  body        text,
  published   boolean NOT NULL DEFAULT false,
  show_in_nav boolean NOT NULL DEFAULT false,
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

ALTER TABLE site_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read published pages"
  ON site_pages FOR SELECT USING (published = true);

CREATE POLICY "Admin all pages"
  ON site_pages FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE OR REPLACE FUNCTION update_site_pages_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_site_pages_updated ON site_pages;
CREATE TRIGGER trg_site_pages_updated
  BEFORE UPDATE ON site_pages
  FOR EACH ROW EXECUTE FUNCTION update_site_pages_updated_at();
