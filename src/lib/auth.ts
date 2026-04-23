import bcrypt from 'bcryptjs';
import { getDb } from './db';
import crypto from 'crypto';

export function checkPassword(password: string): boolean {
  const db = getDb();
  const row = db.prepare("SELECT value FROM settings WHERE key = 'admin_password_hash'").get() as { value: string } | undefined;
  if (!row || !row.value) return false;
  return bcrypt.compareSync(password, row.value);
}

export function setPassword(password: string): void {
  const db = getDb();
  const hash = bcrypt.hashSync(password, 10);
  db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('admin_password_hash', ?)").run(hash);
}

export function hasPasswordSet(): boolean {
  const db = getDb();
  const row = db.prepare("SELECT value FROM settings WHERE key = 'admin_password_hash'").get() as { value: string } | undefined;
  return !!(row && row.value);
}

export function createSession(): string {
  const db = getDb();
  const token = crypto.randomBytes(32).toString('hex');
  db.prepare("DELETE FROM admin_sessions WHERE created_at < datetime('now', '-7 days')").run();
  db.prepare("INSERT INTO admin_sessions (token) VALUES (?)").run(token);
  return token;
}

export function validateSession(token: string | undefined): boolean {
  if (!token) return false;
  const db = getDb();
  const row = db.prepare("SELECT token FROM admin_sessions WHERE token = ? AND created_at > datetime('now', '-7 days')").get(token);
  return !!row;
}

export function destroySession(token: string): void {
  const db = getDb();
  db.prepare("DELETE FROM admin_sessions WHERE token = ?").run(token);
}

export function getSessionFromRequest(request: Request): string | undefined {
  const cookie = request.headers.get('cookie') || '';
  const match = cookie.match(/pzd_admin=([^;]+)/);
  return match?.[1];
}
