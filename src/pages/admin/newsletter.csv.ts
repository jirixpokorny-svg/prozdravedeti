import type { APIRoute } from 'astro';
import { validateSession, getSessionFromRequest } from '../../lib/auth';
import { getDb } from '../../lib/db';

export const GET: APIRoute = ({ request }) => {
  if (!validateSession(getSessionFromRequest(request))) {
    return new Response(null, { status: 302, headers: { Location: '/admin/login' } });
  }
  const rows = getDb().prepare("SELECT email, source, created_at FROM newsletter ORDER BY created_at").all() as { email: string; source: string; created_at: string }[];
  const csv = ['email;zdroj;prihlasen', ...rows.map(r => `${r.email};${r.source ?? ''};${r.created_at}`)].join('\r\n');
  return new Response('﻿' + csv, {
    headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="odberatele-novinek.csv"' },
  });
};
