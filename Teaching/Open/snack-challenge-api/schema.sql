-- 在 Cloudflare D1 的 Console 粘贴执行，首次部署一次即可。
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  game_date TEXT NOT NULL,
  items_json TEXT NOT NULL,
  optimal_score INTEGER NOT NULL,
  optimal_combo_json TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  start_at INTEGER,
  end_at INTEGER,
  revealed_at INTEGER
);
CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES sessions(id),
  nickname TEXT NOT NULL,
  device_id TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  joined_at INTEGER NOT NULL,
  UNIQUE(session_id,device_id)
);
CREATE TABLE IF NOT EXISTS scores (
  player_id TEXT PRIMARY KEY REFERENCES players(id),
  session_id TEXT NOT NULL REFERENCES sessions(id),
  qty_json TEXT NOT NULL,
  cost INTEGER NOT NULL,
  score INTEGER NOT NULL,
  is_valid INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  finished_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_scores_rank ON scores(session_id,is_valid,score DESC,cost ASC);
CREATE INDEX IF NOT EXISTS idx_players_session ON players(session_id);
