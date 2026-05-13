-- Add featured / end_time / tag columns to events. Each ALTER is wrapped in
-- a NULL-safe ADD COLUMN; D1 ignores duplicates if you run it twice.
ALTER TABLE events ADD COLUMN featured BOOLEAN NOT NULL DEFAULT 0;
ALTER TABLE events ADD COLUMN end_time TEXT;
ALTER TABLE events ADD COLUMN tag TEXT;

-- Seed AWAKE 2026 as the featured event so the events page has content
-- to render even before the admin posts new events.
INSERT OR IGNORE INTO events (id, title, description, date, time, end_time, location, image_url, page, tag, featured, is_active, created_at, updated_at) VALUES
  ('evt_awake_2026',     'AWAKE 2026',          'Three days. One generation. A revival summit at Newlife United — worship, prayer and prophetic teaching from leaders across Africa.', '2026-06-19', '19:00', '22:00', 'Newlife United · 129, 12th Ave, Edenvale', '', 'events', 'FLAGSHIP CONFERENCE', 1, 1, datetime('now'), datetime('now')),
  ('evt_awake_2026_d1',  'AWAKE 2026 — Day 1',  '',                                              '2026-06-19', '19:00', '22:00', 'Main Auditorium', '', 'events', 'CONFERENCE', 0, 1, datetime('now'), datetime('now')),
  ('evt_awake_2026_d2',  'AWAKE 2026 — Day 2',  '',                                              '2026-06-20', '09:00', '22:00', 'Main Auditorium', '', 'events', 'CONFERENCE', 0, 1, datetime('now'), datetime('now')),
  ('evt_awake_2026_d3',  'AWAKE 2026 — Closing','',                                              '2026-06-21', '09:00', '13:00', 'Main Auditorium', '', 'events', 'CONFERENCE', 0, 1, datetime('now'), datetime('now'));
