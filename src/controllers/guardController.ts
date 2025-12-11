import { Request, Response } from 'express';
import pool from '../config/db';
import { evaluateBudget } from '../services/budgetService';
import { generateRef } from '../utils/ref';
import { sendTicketEmails } from '../services/emailService';
import env from '../config/env';

const garmentKeys = [
  'jacket',
  'trousers',
  'waistcoat',
  'shirt',
  'dress',
  'skirt',
  'coat',
  'high-vis coat',
  'high-vis vest',
  'tie',
  'top',
  'misc',
  'raincoat',
  'rain jacket',
  'jumpers',
  'aprons',
  'table covers',
];

export async function resolvePin(req: Request, res: Response) {
  const { pin } = req.body as { pin?: string };
  if (!pin) {
    return res.status(400).json({ error: 'PIN is required' });
  }

  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `SELECT s.id as site_id, s.site_name, s.site_address, s.pricing, s.budget, s.company_id, c.name as company_name
       FROM sites s JOIN companies c ON s.company_id = c.id WHERE s.pin = $1`,
      [pin]
    );

    if (!rows.length) {
      return res.status(400).json({ error: 'Invalid PIN. Please check with your supervisor.' });
    }

    const site = rows[0];
    const budget = site.budget;
    const budgetStatus = await evaluateBudget(
      client,
      site.company_id,
      site.site_id,
      budget,
      0
    );

    if (!budgetStatus.allowed) {
      return res.status(400).json({
        error: "This site's allocation is not currently active or has been used. Please contact your manager.",
      });
    }

    return res.json({
      company: site.company_name,
      siteId: site.site_id,
      siteName: site.site_name,
      siteAddress: site.site_address,
      pricing: site.pricing,
      budgetStatus,
    });
  } finally {
    client.release();
  }
}

export async function submitTicket(req: Request, res: Response) {
  const { pin, guardName, phone, email, items, notes } = req.body as any;
  if (!pin || !guardName || !phone || !email || !items) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const totalItems = garmentKeys.reduce((sum, key) => sum + (Number(items[key]) || 0), 0);
  if (totalItems === 0) {
    return res.status(400).json({ error: 'At least one item is required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `SELECT s.id as site_id, s.site_name, s.site_address, s.pricing, s.budget, s.company_id, c.name as company_name
       FROM sites s JOIN companies c ON s.company_id = c.id WHERE s.pin = $1 FOR UPDATE`,
      [pin]
    );

    if (!rows.length) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Invalid PIN. Please check with your supervisor.' });
    }

    const site = rows[0];
    const pricing = site.pricing as Record<string, number>;
    const budget = site.budget;

    const totalCost = garmentKeys.reduce(
      (sum, key) => sum + (pricing[key] || 0) * (Number(items[key]) || 0),
      0
    );

    const budgetStatus = await evaluateBudget(
      client,
      site.company_id,
      site.site_id,
      budget,
      totalCost
    );

    if (!budgetStatus.allowed) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: "This site's allocation is not currently active or has been used. Please contact your manager.",
      });
    }

    const createdAt = new Date().toISOString();
    const ref = generateRef(email, Date.now());

    await client.query(
      `INSERT INTO tickets (ref, created_at, company_id, company_name, site_id, site_name, guard_name, phone, email, items, notes, total_cost)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        ref,
        createdAt,
        site.company_id,
        site.company_name,
        site.site_id,
        site.site_name,
        guardName,
        phone,
        email,
        items,
        notes,
        totalCost,
      ]
    );

    await sendTicketEmails({
      to: [email, env.EKO_INTERNAL_EMAIL],
      ref,
      createdAt,
      companyName: site.company_name,
      siteName: site.site_name,
      siteAddress: site.site_address,
      guardName,
      phone,
      email,
      items,
      notes,
    });

    await client.query('COMMIT');

    res.json({
      ref,
      createdAt,
      company: site.company_name,
      site: site.site_name,
      siteAddress: site.site_address,
      guard: { name: guardName, phone, email },
      items,
      notes,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Failed to submit ticket' });
  } finally {
    client.release();
  }
}
