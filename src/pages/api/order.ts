import type { APIRoute } from 'astro';
import { getDb, parsePriceOptions } from '../../lib/db';
import { sendOrderEmails, type OrderKind } from '../../lib/email';
import { CONSULTATIONS, VOUCHERS, findCatalogItem } from '../../lib/catalog';
import type { Camp, Seminar } from '../../lib/db';

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const kind = body.type as OrderKind;
    const { child_name, child_age, parent_name, email, phone, note } = body;

    // Honeypot proti spamovým robotům
    if (body.website) return json({ ok: true });

    if (!parent_name || !email) return json({ error: 'Vyplňte prosím jméno a e-mail.' }, 400);
    if (kind !== 'contact' && !phone) return json({ error: 'Vyplňte prosím telefon.' }, 400);
    if (!body.gdpr) return json({ error: 'Pro odeslání je potřeba souhlas se zpracováním osobních údajů.' }, 400);

    const db = getDb();
    let item_id = 0;
    let item_title = '';
    let variant: string | null = null;
    let amount: number | null = null;
    let date_from: string | undefined;
    let location: string | undefined;

    if (kind === 'camp') {
      const camp = db.prepare("SELECT * FROM camps WHERE id = ? AND active = 1").get(Number(body.item_id)) as Camp | undefined;
      if (!camp) return json({ error: 'Tábor nebyl nalezen.' }, 404);
      if (!child_name || !child_age) return json({ error: 'Vyplňte prosím jméno a věk dítěte.' }, 400);
      if (camp.spots_left <= 0) return json({ error: 'Omlouváme se, tábor je plně obsazený.' }, 400);
      db.prepare("UPDATE camps SET spots_left = spots_left - 1 WHERE id = ?").run(camp.id);
      ({ id: item_id, title: item_title, price: amount, date_from, location } = camp);
    } else if (kind === 'seminar') {
      const s = db.prepare("SELECT * FROM seminars WHERE id = ? AND active = 1").get(Number(body.item_id)) as Seminar | undefined;
      if (!s) return json({ error: 'Kurz nebyl nalezen.' }, 404);
      if (new Date(s.date_from) < new Date(new Date().toDateString())) return json({ error: 'Tento kurz už proběhl.' }, 400);
      const options = parsePriceOptions(s.price_options);
      const opt = options.find(o => o.label === body.variant);
      if (options.length && !opt) return json({ error: 'Vyberte prosím variantu.' }, 400);
      variant = opt?.label ?? null;
      amount = opt?.price ?? s.price;
      ({ id: item_id, title: item_title, date_from, location } = s);
    } else if (kind === 'consultation' || kind === 'voucher') {
      const item = findCatalogItem(kind === 'consultation' ? CONSULTATIONS : VOUCHERS, String(body.item_id));
      if (!item) return json({ error: 'Položka nebyla nalezena.' }, 404);
      const opt = item.options?.find(o => o.label === body.variant);
      if (item.options && !opt) return json({ error: 'Vyberte prosím variantu.' }, 400);
      item_title = item.title;
      amount = opt?.price ?? item.price;
      variant = [opt?.label, body.meeting].filter(Boolean).join(' · ') || null;
    } else if (kind === 'contact') {
      if (!note) return json({ error: 'Napište prosím zprávu.' }, 400);
      item_title = 'Kontaktní formulář';
    } else {
      return json({ error: 'Neznámý typ objednávky.' }, 400);
    }

    const result = db.prepare(`INSERT INTO orders (type, item_id, item_title, child_name, child_age, parent_name, email, phone, note, variant, amount)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(kind, item_id, item_title, child_name || '-', child_age || '-', parent_name, email, phone || '', note || null, variant, amount);

    if (body.newsletter) {
      db.prepare("INSERT OR IGNORE INTO newsletter (email, source) VALUES (?, ?)").run(String(email).trim().toLowerCase(), kind);
    }

    // E-maily posíláme na pozadí, chyba SMTP nesmí shodit uloženou objednávku
    sendOrderEmails({
      id: Number(result.lastInsertRowid), kind, item_title, variant, amount,
      child_name, child_age, parent_name, email, phone, note, date_from, location,
    }).catch((err) => console.error('Email send failed:', err));

    return json({ ok: true, id: Number(result.lastInsertRowid) });
  } catch (err: any) {
    console.error('Order error:', err);
    return json({ error: 'Nastala chyba. Zkuste to prosím znovu nebo mě kontaktujte přímo.' }, 500);
  }
};
