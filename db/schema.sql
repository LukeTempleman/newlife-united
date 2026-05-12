-- Events table for managing church events across all pages
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  location TEXT,
  image_url TEXT,
  page TEXT NOT NULL DEFAULT 'events',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_page ON events(page);
CREATE INDEX IF NOT EXISTS idx_events_active ON events(is_active);

-- Sample data (optional - remove if not needed)
INSERT INTO events (id, title, description, date, time, location, image_url, page, is_active, created_at, updated_at)
VALUES (
  'evt_sample_001',
  'Sunday Service',
  'Join us for our weekly Sunday service with worship and teaching.',
  '2024-05-19',
  '10:00 AM',
  'Main Hall',
  '',
  'watch',
  true,
  datetime('now'),
  datetime('now')
);
