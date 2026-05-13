-- Form submissions captured from all public-facing forms on the site.
-- Each row is one submission. `data_json` holds the raw form fields so we
-- never lose context as forms evolve. The denormalised columns (name, email,
-- phone, message) make admin listing fast without parsing JSON every time.
CREATE TABLE IF NOT EXISTS form_submissions (
  id TEXT PRIMARY KEY,
  form_type TEXT NOT NULL,
  name TEXT,
  email TEXT,
  phone TEXT,
  message TEXT,
  data_json TEXT NOT NULL,
  is_archived INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_form_submissions_type ON form_submissions(form_type);
CREATE INDEX IF NOT EXISTS idx_form_submissions_archived ON form_submissions(is_archived);
CREATE INDEX IF NOT EXISTS idx_form_submissions_created ON form_submissions(created_at);
