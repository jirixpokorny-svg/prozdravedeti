import type { APIRoute } from 'astro';
import { getDb } from '../../lib/db';

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json().catch(() => ({}));
  if (body.website) return new Response(JSON.stringify({ ok: true }));
  const email = String(body.email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return new Response(JSON.stringify({ error: 'Zadejte prosím platný e-mail.' }), { status: 400 });
  }
  getDb().prepare("INSERT OR IGNORE INTO newsletter (email, source) VALUES (?, ?)").run(email, 'web');
  return new Response(JSON.stringify({ ok: true }));
};
