import type { APIRoute } from 'astro';
import { validateSession, getSessionFromRequest } from '../../../../lib/auth';
import { getDb } from '../../../../lib/db';
import type { Seminar } from '../../../../lib/db';
import { deleteUpload } from '../../../../lib/upload';

export const POST: APIRoute = ({ request, params }) => {
  if (!validateSession(getSessionFromRequest(request))) {
    return new Response(null, { status: 302, headers: { Location: '/admin/login' } });
  }
  const db = getDb();
  const seminar = db.prepare("SELECT * FROM seminars WHERE id = ?").get(Number(params.id)) as Seminar | undefined;
  if (seminar?.poster_url) deleteUpload(seminar.poster_url);
  db.prepare("DELETE FROM seminars WHERE id = ?").run(Number(params.id));
  return new Response(null, { status: 302, headers: { Location: '/admin/seminare' } });
};
