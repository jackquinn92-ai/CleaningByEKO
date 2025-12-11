import nodemailer from 'nodemailer';
import PDFDocument from 'pdfkit';
import env from '../config/env';
import { TicketItemMap } from '../models/types';

export type TicketEmailPayload = {
  to: string[];
  ref: string;
  createdAt: string;
  companyName: string;
  siteName: string;
  siteAddress: string;
  guardName: string;
  phone: string;
  email: string;
  items: TicketItemMap;
  notes?: string;
};

export function createTransport() {
  if (env.SMTP_HOST && env.SMTP_PORT && env.SMTP_USER && env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  }

  return nodemailer.createTransport({ jsonTransport: true });
}

export function buildTicketPdf(payload: TicketEmailPayload): Buffer {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const chunks: Buffer[] = [];

  doc.fontSize(18).text('Cleaning by EKO - Ticket', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Reference: ${payload.ref}`);
  doc.text(`Date: ${payload.createdAt}`);
  doc.text(`Company: ${payload.companyName}`);
  doc.text(`Site: ${payload.siteName}`);
  doc.text(`Address: ${payload.siteAddress}`);
  doc.moveDown();
  doc.text(`Guard: ${payload.guardName}`);
  doc.text(`Email: ${payload.email}`);
  doc.text(`Phone: ${payload.phone}`);
  doc.moveDown();

  doc.text('Items:');
  Object.entries(payload.items).forEach(([name, qty]) => {
    if (qty > 0) {
      doc.text(`- ${name}: ${qty}`);
    }
  });

  if (payload.notes) {
    doc.moveDown();
    doc.text('Notes:');
    doc.text(payload.notes);
  }

  doc.end();
  doc.on('data', (b) => chunks.push(b));

  return Buffer.concat(chunks);
}

export async function sendTicketEmails(payload: TicketEmailPayload) {
  const transporter = createTransport();
  const pdf = buildTicketPdf(payload);

  const message = {
    from: 'no-reply@cleaningbyeko.example',
    to: payload.to.join(','),
    subject: `Cleaning by EKO ticket ${payload.ref}`,
    text: `Reference: ${payload.ref}\nDate: ${payload.createdAt}\nCompany: ${payload.companyName}\nSite: ${payload.siteName}\nGuard: ${payload.guardName}\nEmail: ${payload.email}\nPhone: ${payload.phone}\nNotes: ${payload.notes || 'None'}`,
    attachments: [
      {
        filename: `ticket-${payload.ref}.pdf`,
        content: pdf,
      },
    ],
  };

  await transporter.sendMail(message);
}
