import nodemailer from 'nodemailer';
import { getSetting } from './db';

function getTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

function getLenkaEmail(): string {
  return getSetting('lenka_email') || 'info@prozdravedeti.cz';
}

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

export type OrderKind = 'camp' | 'seminar' | 'consultation' | 'voucher' | 'contact';

export type OrderMail = {
  id: number;
  kind: OrderKind;
  item_title: string;
  variant?: string | null;
  amount?: number | null;
  child_name?: string;
  child_age?: string;
  parent_name: string;
  email: string;
  phone?: string;
  note?: string | null;
  date_from?: string;
  location?: string;
};

const KIND_LABEL: Record<OrderKind, string> = {
  camp: 'Přihláška na tábor',
  seminar: 'Přihláška na kurz',
  consultation: 'Objednávka konzultace',
  voucher: 'Objednávka dárkového poukazu',
  contact: 'Dotaz z webu',
};

/** Platí se předem převodem (stejně jako dřív ve WooCommerce). */
const PAID_KINDS: OrderKind[] = ['camp', 'seminar', 'voucher'];

function formatDateCz(d?: string) {
  if (!d) return '';
  const dt = new Date(d);
  return isNaN(+dt) ? d : dt.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' });
}

function rows(o: OrderMail) {
  const r: [string, string][] = [];
  if (o.kind === 'camp') r.push(['Dítě', `${o.child_name}, ${o.child_age} let`]);
  r.push([o.kind === 'camp' ? 'Rodič' : 'Jméno', o.parent_name]);
  r.push(['E-mail', o.email]);
  if (o.phone) r.push(['Telefon', o.phone]);
  if (o.variant) r.push(['Varianta', o.variant]);
  if (o.date_from) r.push(['Termín', formatDateCz(o.date_from)]);
  if (o.location) r.push(['Místo', o.location]);
  if (o.amount) r.push(['Cena', `${o.amount.toLocaleString('cs-CZ')} Kč`]);
  if (o.note) r.push([o.kind === 'contact' ? 'Zpráva' : 'Poznámka', o.note]);
  return r.map(([k, v]) => `<tr><td style="padding:6px 0;color:#6b7280;width:35%;vertical-align:top">${esc(k)}</td><td style="padding:6px 0;font-weight:600;white-space:pre-line">${esc(v)}</td></tr>`).join('');
}

function paymentBlock(o: OrderMail) {
  if (!PAID_KINDS.includes(o.kind) || !o.amount) return '';
  const account = getSetting('bank_account');
  if (!account) {
    return `<p><strong>Rezervace je platná po zaplacení.</strong> Platební údaje vám pošlu e-mailem.</p>`;
  }
  return `
    <div style="background:#fef3dc;border-radius:12px;padding:20px;margin:24px 0">
      <h3 style="margin:0 0 12px;color:#c07818">Platba převodem</h3>
      <p style="margin:4px 0"><strong>Číslo účtu:</strong> ${esc(account)}</p>
      <p style="margin:4px 0"><strong>Částka:</strong> ${o.amount.toLocaleString('cs-CZ')} Kč</p>
      <p style="margin:4px 0"><strong>Variabilní symbol:</strong> ${o.id}</p>
      <p style="margin:12px 0 0;font-size:14px">Rezervace je platná po připsání platby na účet.</p>
    </div>`;
}

function shell(title: string, body: string) {
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#2c2c2c">
      <div style="background:#3d7a4a;padding:24px;border-radius:12px 12px 0 0">
        <h1 style="color:white;margin:0;font-size:20px">${title}</h1>
      </div>
      <div style="background:white;padding:24px 28px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;border-top:none">${body}</div>
    </div>`;
}

export async function sendOrderEmails(o: OrderMail) {
  const transport = getTransport();
  const lenkaEmail = getLenkaEmail();
  const from = `"Pro zdravé děti" <${process.env.SMTP_USER}>`;
  const label = KIND_LABEL[o.kind];

  await transport.sendMail({
    from,
    to: lenkaEmail,
    replyTo: o.email,
    subject: `${label}: ${o.item_title}`,
    html: shell(`${esc(label)}: ${esc(o.item_title)}`, `
      <table style="width:100%;border-collapse:collapse">${rows(o)}</table>
      <p style="color:#6b7280;font-size:13px;margin-top:16px">Č. ${o.id} · přehled v administraci webu, sekce Přihlášky.</p>`),
  });

  const intro = o.kind === 'contact'
    ? 'děkuji za vaši zprávu. Co nejdříve se vám ozvu.'
    : o.kind === 'consultation'
      ? `děkuji za vaši důvěru. Přijala jsem objednávku <strong>${esc(o.item_title)}</strong> a co nejdříve se vám ozvu kvůli termínu.`
      : `přijala jsem vaši objednávku <strong>${esc(o.item_title)}</strong>.`;

  await transport.sendMail({
    from,
    to: o.email,
    replyTo: lenkaEmail,
    subject: o.kind === 'contact' ? 'Děkuji za zprávu – Pro zdravé děti' : `Potvrzení: ${o.item_title}`,
    html: shell(o.kind === 'contact' ? 'Děkuji za zprávu' : 'Děkuji, objednávka přijata', `
      <p style="font-size:16px">Dobrý den, <strong>${esc(o.parent_name)}</strong>,</p>
      <p>${intro}</p>
      <div style="background:#e8f5ec;border-radius:12px;padding:16px 20px;margin:24px 0">
        <table style="width:100%;border-collapse:collapse">${rows(o)}</table>
      </div>
      ${paymentBlock(o)}
      <p>V případě dotazů mi stačí odpovědět na tento e-mail nebo zavolat:<br>
      <a href="mailto:${esc(lenkaEmail)}" style="color:#3d7a4a">${esc(lenkaEmail)}</a> · <a href="tel:+420725757041" style="color:#3d7a4a">+420 725 757 041</a></p>
      <p style="color:#6b7280;font-size:14px;margin-top:28px">Těším se na vás! 🌿<br><strong>Lenka Pokorná</strong><br>Pro zdravé děti</p>`),
  });
}
