import nodemailer from 'nodemailer';
import { getDb } from './db';

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
  const db = getDb();
  const row = db.prepare("SELECT value FROM settings WHERE key = 'lenka_email'").get() as { value: string } | undefined;
  return row?.value || 'info@prozdravedeti.cz';
}

export async function sendOrderEmails(order: {
  item_title: string;
  child_name: string;
  child_age: string;
  parent_name: string;
  email: string;
  phone: string;
  note?: string;
  price: number;
  date_from: string;
  location: string;
}) {
  const transport = getTransport();
  const lenkaEmail = getLenkaEmail();

  // Email Lence
  await transport.sendMail({
    from: `"Pro zdravé děti" <${process.env.SMTP_USER}>`,
    to: lenkaEmail,
    subject: `Nová přihláška: ${order.item_title}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #2c2c2c;">
        <div style="background: #3d7a4a; padding: 24px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 20px;">Nová přihláška na ${order.item_title}</h1>
        </div>
        <div style="background: white; padding: 24px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; color: #6b7280; width: 40%;">Dítě</td><td style="padding: 8px 0; font-weight: 600;">${order.child_name}, ${order.child_age} let</td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280;">Rodič</td><td style="padding: 8px 0; font-weight: 600;">${order.parent_name}</td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280;">Email</td><td style="padding: 8px 0;"><a href="mailto:${order.email}" style="color: #3d7a4a;">${order.email}</a></td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280;">Telefon</td><td style="padding: 8px 0;"><a href="tel:${order.phone}" style="color: #3d7a4a;">${order.phone}</a></td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280;">Termín</td><td style="padding: 8px 0;">${order.date_from}</td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280;">Místo</td><td style="padding: 8px 0;">${order.location}</td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280;">Cena</td><td style="padding: 8px 0; font-weight: 600; color: #3d7a4a;">${order.price.toLocaleString('cs-CZ')} Kč</td></tr>
            ${order.note ? `<tr><td style="padding: 8px 0; color: #6b7280;">Poznámka</td><td style="padding: 8px 0;">${order.note}</td></tr>` : ''}
          </table>
        </div>
      </div>
    `,
  });

  // Potvrzení zákazníkovi
  await transport.sendMail({
    from: `"Pro zdravé děti" <${process.env.SMTP_USER}>`,
    to: order.email,
    subject: `Přihláška přijata: ${order.item_title}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #2c2c2c;">
        <div style="background: #3d7a4a; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 22px;">Přihláška přijata! 🎉</h1>
        </div>
        <div style="background: white; padding: 32px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
          <p style="font-size: 16px;">Dobrý den, <strong>${order.parent_name}</strong>,</p>
          <p>Přijali jsme vaši přihlášku na <strong>${order.item_title}</strong>. Brzy se vám ozveme s potvrzením a dalšími informacemi.</p>

          <div style="background: #e8f5ec; border-radius: 12px; padding: 20px; margin: 24px 0;">
            <h3 style="margin: 0 0 12px; color: #3d7a4a;">Shrnutí přihlášky</h3>
            <p style="margin: 4px 0;"><strong>Dítě:</strong> ${order.child_name}, ${order.child_age} let</p>
            <p style="margin: 4px 0;"><strong>Termín:</strong> ${order.date_from}</p>
            <p style="margin: 4px 0;"><strong>Místo:</strong> ${order.location}</p>
            <p style="margin: 4px 0;"><strong>Cena:</strong> ${order.price.toLocaleString('cs-CZ')} Kč</p>
          </div>

          <p>V případě dotazů mě neváhejte kontaktovat:</p>
          <p><a href="mailto:${lenkaEmail}" style="color: #3d7a4a;">${lenkaEmail}</a><br>
          <a href="tel:+420725757041" style="color: #3d7a4a;">+420 725 757 041</a></p>

          <p style="color: #6b7280; font-size: 14px; margin-top: 32px;">Těším se na setkání s vaším dítětem! 🌿<br><strong>Lenka</strong><br>Pro zdravé děti</p>
        </div>
      </div>
    `,
  });
}
