import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dataDir = process.env.DB_PATH
  ? path.dirname(process.env.DB_PATH)
  : path.join(process.cwd(), 'data');
const DB_PATH = process.env.DB_PATH || path.join(dataDir, 'pzd.db');
fs.mkdirSync(dataDir, { recursive: true });

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');
    initSchema(_db);
  }
  return _db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS camps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      date_from TEXT NOT NULL,
      date_to TEXT,
      time_info TEXT,
      location TEXT NOT NULL,
      price INTEGER NOT NULL,
      spots_total INTEGER NOT NULL,
      spots_left INTEGER NOT NULL,
      age_range TEXT,
      description TEXT NOT NULL,
      poster_url TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS seminars (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      date_from TEXT NOT NULL,
      time_info TEXT,
      location TEXT NOT NULL,
      price INTEGER,
      description TEXT NOT NULL,
      poster_url TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      item_id INTEGER NOT NULL,
      item_title TEXT NOT NULL,
      child_name TEXT NOT NULL,
      child_age TEXT NOT NULL,
      parent_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      note TEXT,
      status TEXT NOT NULL DEFAULT 'new',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS admin_sessions (
      token TEXT PRIMARY KEY,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Seed default settings
  const existing = db.prepare("SELECT key FROM settings WHERE key = 'lenka_email'").get();
  if (!existing) {
    db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)").run('lenka_email', 'info@prozdravedeti.cz');
    db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)").run('admin_password_hash', '');
  }
}

export type Camp = {
  id: number;
  slug: string;
  title: string;
  date_from: string;
  date_to: string | null;
  time_info: string | null;
  location: string;
  price: number;
  spots_total: number;
  spots_left: number;
  age_range: string | null;
  description: string;
  poster_url: string | null;
  active: number;
  sort_order: number;
};

export type Seminar = {
  id: number;
  slug: string;
  title: string;
  date_from: string;
  time_info: string | null;
  location: string;
  price: number | null;
  description: string;
  poster_url: string | null;
  active: number;
  sort_order: number;
};

export type Order = {
  id: number;
  type: string;
  item_id: number;
  item_title: string;
  child_name: string;
  child_age: string;
  parent_name: string;
  email: string;
  phone: string;
  note: string | null;
  status: string;
  created_at: string;
};
