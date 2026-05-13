-- Testimonies table — short stories shared by the church family.
-- Public GET returns all active ones; admin can create/update/delete.
CREATE TABLE IF NOT EXISTS testimonies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  body TEXT NOT NULL,
  location TEXT,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_testimonies_active ON testimonies(is_active);
CREATE INDEX IF NOT EXISTS idx_testimonies_created ON testimonies(created_at);
