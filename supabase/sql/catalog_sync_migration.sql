-- Adds support for syncing products from Fourthwall and Gumroad into the
-- existing `downloads` table via a pull-based sync (see
-- src/app/api/admin/sync/route.ts), instead of relying solely on
-- Fourthwall webhooks. Run this once in Supabase Dashboard → SQL Editor,
-- after the main migration and the profile trigger.

-- Synced products don't have a file we host in Supabase Storage — the
-- actual file lives on Fourthwall or Gumroad, and checkout/delivery is
-- handled by whichever platform sold it. file_path/file_type were
-- NOT NULL in the original schema, which only fit "we host the file"
-- downloads; relax both so synced rows are valid too.
ALTER TABLE downloads ALTER COLUMN file_path DROP NOT NULL;
ALTER TABLE downloads ALTER COLUMN file_type DROP NOT NULL;

ALTER TABLE downloads
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual'
    CHECK (source IN ('manual', 'fourthwall', 'gumroad'));

ALTER TABLE downloads
  ADD COLUMN IF NOT EXISTS gumroad_product_id text UNIQUE;

-- Where to send the customer to actually buy/claim this item when it's
-- not a file we host ourselves — the Fourthwall product page URL or the
-- Gumroad product URL. NULL for 'manual' downloads we deliver ourselves.
ALTER TABLE downloads
  ADD COLUMN IF NOT EXISTS external_url text;

-- A synced merch (physical) row also needs to remember which platform it
-- came from, for the same reasons.
ALTER TABLE merch
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual'
    CHECK (source IN ('manual', 'fourthwall'));

CREATE INDEX IF NOT EXISTS idx_downloads_source ON downloads(source);
CREATE INDEX IF NOT EXISTS idx_merch_source ON merch(source);
