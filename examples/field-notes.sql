PRAGMA journal_mode = WAL;
CREATE TABLE notes (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  saved_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO notes(title, body) VALUES
  ('Offline map cache', 'Refresh trail tiles before Friday.'),
  ('Battery test', 'Device B lasted 11 hours in airplane mode.'),
  ('Sync rule', 'Only copy a verified snapshot packet.');

