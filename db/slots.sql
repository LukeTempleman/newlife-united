-- Image slot table: lets the admin override any <img> on the site by slot_id.
-- The frontend shim (js/slots.js) fetches /api/slots and swaps `src` on
-- elements tagged with `data-slot`. Rows without a `current_url` keep the
-- HTML default.

CREATE TABLE IF NOT EXISTS image_slots (
  slot_id TEXT PRIMARY KEY,
  page TEXT NOT NULL,
  label TEXT NOT NULL,
  default_url TEXT NOT NULL,
  current_url TEXT,
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_image_slots_page ON image_slots(page);

-- Seed all 54 slots. INSERT OR IGNORE so re-running won't blow away
-- customisations the admin has already made.

-- index (Home)
INSERT OR IGNORE INTO image_slots (slot_id, page, label, default_url) VALUES
  ('home-hero',                    'index', 'Hero background',                   'assets/hero-index.png'),
  ('home-pillar-encounter',        'index', 'Pillar 1 — Encounter / Know God',   'assets/pillar-know-god.png'),
  ('home-pillar-discipleship',     'index', 'Pillar 2 — Find Freedom',           'assets/pillar-find-freedom.png'),
  ('home-pillar-calling',          'index', 'Pillar 3 — Discover Purpose',       'assets/pillar-discover-purpose.png'),
  ('home-pillar-sent',             'index', 'Pillar 4 — Make a Difference',      'assets/pillar-make-difference.png'),
  ('home-photo-worship',           'index', 'Sunday photo — Congregation',       'assets/worship-congregation.png'),
  ('home-photo-pastor',            'index', 'Sunday photo — Pastor preaching',   'assets/pastor-preaching.png'),
  ('home-sermon-1',                'index', 'Sermon thumb 1',                    'assets/sermon-thumb-01.png'),
  ('home-sermon-2',                'index', 'Sermon thumb 2',                    'assets/sermon-thumb-02.png'),
  ('home-sermon-3',                'index', 'Sermon thumb 3',                    'assets/sermon-thumb-03.png'),
  ('home-generosity-bg',           'index', 'Generosity background',             'assets/generosity-bg.png'),
  ('home-cta',                     'index', 'Footer CTA strip',                  'assets/cta-worship.png');

-- about
INSERT OR IGNORE INTO image_slots (slot_id, page, label, default_url) VALUES
  ('about-hero',                   'about', 'Hero',                              'assets/hero-about.png'),
  ('about-leader-1',               'about', 'Leader 1 — Senior Pastor',          'assets/leader-01.png'),
  ('about-leader-2',               'about', 'Leader 2 — Co-Pastor',              'assets/leader-02.png'),
  ('about-leader-3',               'about', 'Leader 3 — Worship Leader',         'assets/leader-03.png'),
  ('about-leader-4',               'about', 'Leader 4 — Youth Leader',           'assets/leader-04.png'),
  ('about-cta',                    'about', 'Footer CTA',                        'assets/cta-building.png');

-- watch
INSERT OR IGNORE INTO image_slots (slot_id, page, label, default_url) VALUES
  ('watch-hero',                   'watch', 'Hero',                              'assets/hero-watch.png'),
  ('watch-featured',               'watch', 'Featured sermon',                   'assets/sermon-featured.png'),
  ('watch-thumb-1',                'watch', 'Recent sermon thumb 1',             'assets/sermon-thumb-01.png'),
  ('watch-thumb-2',                'watch', 'Recent sermon thumb 2',             'assets/sermon-thumb-02.png'),
  ('watch-thumb-3',                'watch', 'Recent sermon thumb 3',             'assets/sermon-thumb-03.png'),
  ('watch-cta',                    'watch', 'Footer CTA',                        'assets/cta-worship.png');

-- events
INSERT OR IGNORE INTO image_slots (slot_id, page, label, default_url) VALUES
  ('events-hero',                  'events', 'Hero',                             'assets/hero-events.png'),
  ('events-awake',                 'events', 'AWAKE 2026 conference card',       'assets/event-awake.png'),
  ('events-cta',                   'events', 'Footer CTA',                       'assets/cta-worship.png');

-- next-steps
INSERT OR IGNORE INTO image_slots (slot_id, page, label, default_url) VALUES
  ('next-steps-hero',              'next-steps', 'Hero',                             'assets/hero-next-steps.png'),
  ('next-steps-1-know-god',        'next-steps', 'Step 1 — Know God',                'assets/step-know-god.png'),
  ('next-steps-2-find-freedom',    'next-steps', 'Step 2 — Find Freedom',            'assets/step-find-freedom.png'),
  ('next-steps-3-discover-purpose','next-steps', 'Step 3 — Discover Purpose',        'assets/step-discover-purpose.png'),
  ('next-steps-4-make-difference', 'next-steps', 'Step 4 — Make a Difference',       'assets/step-make-difference.png'),
  ('next-steps-cta',               'next-steps', 'Footer CTA',                       'assets/cta-community.png');

-- visit
INSERT OR IGNORE INTO image_slots (slot_id, page, label, default_url) VALUES
  ('visit-hero',                   'visit',   'Hero',                            'assets/hero-visit.png'),
  ('visit-signboard',              'visit',   'Building / signboard',            'assets/building-signboard.png'),
  ('visit-cta',                    'visit',   'Footer CTA',                      'assets/cta-building.png');

-- contact
INSERT OR IGNORE INTO image_slots (slot_id, page, label, default_url) VALUES
  ('contact-hero',                 'contact', 'Hero',                            'assets/hero-contact.png'),
  ('contact-signboard',            'contact', 'Building / signboard',            'assets/building-signboard.png'),
  ('contact-cta',                  'contact', 'Footer CTA',                      'assets/cta-building.png');

-- kids
INSERT OR IGNORE INTO image_slots (slot_id, page, label, default_url) VALUES
  ('kids-hero',                    'kids',    'Hero',                            'assets/hero-kids.png'),
  ('kids-cta',                     'kids',    'Footer CTA',                      'assets/cta-community.png');

-- youth
INSERT OR IGNORE INTO image_slots (slot_id, page, label, default_url) VALUES
  ('youth-hero',                   'youth',   'Hero',                            'assets/hero-youth.png'),
  ('youth-cta',                    'youth',   'Footer CTA',                      'assets/cta-worship.png');

-- legacy
INSERT OR IGNORE INTO image_slots (slot_id, page, label, default_url) VALUES
  ('legacy-hero',                  'legacy',  'Hero',                            'assets/hero-legacy.png'),
  ('legacy-cta',                   'legacy',  'Footer CTA',                      'assets/cta-learning.png');

-- small-groups
INSERT OR IGNORE INTO image_slots (slot_id, page, label, default_url) VALUES
  ('small-groups-hero',            'small-groups', 'Hero',                       'assets/hero-small-groups.png'),
  ('small-groups-cta',             'small-groups', 'Footer CTA',                 'assets/cta-community.png');

-- bible-school
INSERT OR IGNORE INTO image_slots (slot_id, page, label, default_url) VALUES
  ('bible-school-hero',            'bible-school', 'Hero',                       'assets/hero-bible-school.png'),
  ('bible-school-cta',             'bible-school', 'Footer CTA',                 'assets/cta-learning.png');

-- connect
INSERT OR IGNORE INTO image_slots (slot_id, page, label, default_url) VALUES
  ('connect-hero',                 'connect', 'Hero',                            'assets/hero-connect.png'),
  ('connect-cta',                  'connect', 'Footer CTA',                      'assets/cta-community.png');

-- give
INSERT OR IGNORE INTO image_slots (slot_id, page, label, default_url) VALUES
  ('give-hero',                    'give',    'Hero',                            'assets/hero-give.png'),
  ('give-cta',                     'give',    'Footer CTA',                      'assets/cta-worship.png');
