import db from "./config/db.js";

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS player_saves (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  slot_number INTEGER NOT NULL,
  wave_number INTEGER DEFAULT 1,
  health INTEGER DEFAULT 100,
  max_health INTEGER DEFAULT 100,
  damage REAL DEFAULT 25,
  speed REAL DEFAULT 200,
  current_weapon TEXT DEFAULT 'pistol',
  coins INTEGER DEFAULT 0,
  kills INTEGER DEFAULT 0,
  powerups TEXT,
  boosts TEXT,
  position_x REAL DEFAULT 0,
  position_y REAL DEFAULT 0,
  saved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, slot_number)
);

CREATE TABLE IF NOT EXISTS player_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  wave_reached INTEGER DEFAULT 1,
  enemies_killed INTEGER DEFAULT 0,
  time_survived INTEGER DEFAULT 0,
  coins_earned INTEGER DEFAULT 0,
  weapon_used TEXT DEFAULT 'pistol',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
`);

console.log("tablas creadas" );
