import type { APIRoute } from 'astro';
import { getDb } from '../../lib/db';
import { sendOrderEmails } from '../../lib/email';
import type { Camp, Seminar } from '../../lib/db';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { type, item_id, item_title, child_name, child_age, parent_name, email, phone, note } = body;

    if (!type || !item_id || !parent_name || !email || !phone) {
      return new Response(JSON.stringify({ error: 'Vyplňte prosím všechna povinná pole.' }), { status: 400 });
    }

    const db = getDb();

    // Decrease spots if camp
    if (type === 'camp') {
      const camp = db.prepare("SELECT * FROM camps WHERE id = ? AND active = 1").get(Number(item_id)) as Camp | undefined;
      if (!camp) return new Response(JSON.stringify({ error: 'Tábor nebyl nalezen.' }), { status: 404 });
      if (camp.spots_left <= 0) return new Response(JSON.stringify({ error: 'Omlouváme se, tábor je plně obsazený.' }), { status: 400 });
      db.prepare("UPDATE camps SET spots_left = spots_left - 1 WHERE id = ?").run(camp.id);
    }

    const item = type === 'camp'
      ? db.prepare("SELECT * FROM camps WHERE id = ?").get(Number(item_id)) as Camp
      : db.prepare("SELECT * FROM seminars WHERE id = ?").get(Number(item_id)) as Seminar;

    // Save order
    db.prepare(`INSERT INTO orders (type, item_id, item_title, child_name, child_age, parent_name, email, phone, note)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(type, Number(item_id), item_title, child_name || '-', child_age || '-', parent_name, email, phone, note || null);

    // Send emails
    await sendOrderEmails({
      item_title,
      child_name: child_name || '-',
      child_age: child_age || '-',
      parent_name,
      email,
      phone,
      note,
      price: item.price ?? 0,
      date_from: item.date_from,
      location: item.location,
    });

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err: any) {
    console.error('Order error:', err);
    return new Response(JSON.stringify({ error: 'Nastala chyba. Zkuste to prosím znovu nebo nás kontaktujte přímo.' }), { status: 500 });
  }
};
