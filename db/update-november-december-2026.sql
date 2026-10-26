-- Requested event corrections: move Dream Team and hide cancelled carols.
UPDATE events SET date = '2026-11-04', updated_at = datetime('now') WHERE id = 'evt_202611_dreamteam' AND date = '2026-11-25';
UPDATE events SET is_active = 0, updated_at = datetime('now') WHERE id = 'evt_202612_carols' AND date = '2026-12-11';
