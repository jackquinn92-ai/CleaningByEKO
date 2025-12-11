import { Request, Response } from 'express';
import pool from '../config/db';
import env from '../config/env';
import jwt from 'jsonwebtoken';
import ExcelJS from 'exceljs';

export function login(req: Request, res: Response) {
  const { username, password } = req.body as { username?: string; password?: string };
  if (username !== env.ADMIN_USERNAME || password !== env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ role: 'admin' }, env.JWT_SECRET, { expiresIn: '12h' });
  res.json({ token });
}

export async function listCompanies(req: Request, res: Response) {
  const { rows } = await pool.query('SELECT * FROM companies ORDER BY name');
  res.json(rows);
}

export async function createCompany(req: Request, res: Response) {
  const { name } = req.body as { name?: string };
  if (!name) return res.status(400).json({ error: 'Name required' });
  const { rows } = await pool.query('INSERT INTO companies (name) VALUES ($1) RETURNING *', [name]);
  res.status(201).json(rows[0]);
}

export async function updateCompany(req: Request, res: Response) {
  const { id } = req.params;
  const { name } = req.body as { name?: string };
  const { rows } = await pool.query('UPDATE companies SET name=$1 WHERE id=$2 RETURNING *', [name, id]);
  res.json(rows[0]);
}

export async function deleteCompany(req: Request, res: Response) {
  const { id } = req.params;
  await pool.query('DELETE FROM companies WHERE id=$1', [id]);
  res.status(204).send();
}

export async function listSites(req: Request, res: Response) {
  const { companyId } = req.query;
  const { rows } = await pool.query(
    'SELECT * FROM sites WHERE ($1::int IS NULL OR company_id=$1) ORDER BY site_name',
    [companyId ? Number(companyId) : null]
  );
  res.json(rows);
}

export async function createSite(req: Request, res: Response) {
  const { companyId, siteName, siteAddress, pin, pricing, budget } = req.body as any;
  const { rows } = await pool.query(
    `INSERT INTO sites (company_id, site_name, site_address, pin, pricing, budget)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [companyId, siteName, siteAddress, pin, pricing, budget]
  );
  res.status(201).json(rows[0]);
}

export async function updateSite(req: Request, res: Response) {
  const { id } = req.params;
  const { companyId, siteName, siteAddress, pin, pricing, budget } = req.body as any;
  const { rows } = await pool.query(
    `UPDATE sites SET company_id=$1, site_name=$2, site_address=$3, pin=$4, pricing=$5, budget=$6 WHERE id=$7 RETURNING *`,
    [companyId, siteName, siteAddress, pin, pricing, budget, id]
  );
  res.json(rows[0]);
}

export async function deleteSite(req: Request, res: Response) {
  const { id } = req.params;
  await pool.query('DELETE FROM sites WHERE id=$1', [id]);
  res.status(204).send();
}

export async function listTickets(req: Request, res: Response) {
  const { start, end, companyId, siteId, search } = req.query as any;
  const params: any[] = [];
  const where: string[] = [];

  if (start) {
    params.push(start);
    where.push(`created_at >= $${params.length}`);
  }
  if (end) {
    params.push(end);
    where.push(`created_at <= $${params.length}`);
  }
  if (companyId) {
    params.push(companyId);
    where.push(`company_id = $${params.length}`);
  }
  if (siteId) {
    params.push(siteId);
    where.push(`site_id = $${params.length}`);
  }
  if (search) {
    const like = `%${search}%`;
    params.push(like, like, like);
    where.push(`(guard_name ILIKE $${params.length - 2} OR site_name ILIKE $${params.length - 1} OR company_name ILIKE $${params.length})`);
  }

  const sql = `SELECT * FROM tickets ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY created_at DESC`;
  const { rows } = await pool.query(sql, params);
  res.json(rows);
}

export async function exportTickets(req: Request, res: Response) {
  const { ids } = req.body as { ids: number[] };
  const { rows } = await pool.query('SELECT * FROM tickets WHERE id = ANY($1)', [ids]);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Tickets');
  sheet.columns = [
    { header: 'Company', key: 'company_name', width: 20 },
    { header: 'Site', key: 'site_name', width: 20 },
    { header: 'Guard', key: 'guard_name', width: 20 },
    { header: 'Reference', key: 'ref', width: 10 },
    { header: 'Date', key: 'created_at', width: 20 },
    { header: 'Items', key: 'items', width: 30 },
    { header: 'Total Cost', key: 'total_cost', width: 12 },
    { header: 'Notes', key: 'notes', width: 30 },
  ];

  rows.forEach((row) => {
    sheet.addRow({
      ...row,
      items: JSON.stringify(row.items),
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="tickets.xlsx"');
  res.send(buffer);
}

export async function monthlyReport(req: Request, res: Response) {
  const { month, year } = req.query as any;
  const start = new Date(Number(year), Number(month) - 1, 1).toISOString();
  const end = new Date(Number(year), Number(month), 0, 23, 59, 59).toISOString();

  const { rows } = await pool.query(
    `SELECT company_id, company_name, site_id, site_name, COUNT(*) as ticket_count, SUM(total_cost) as total_cost
     FROM tickets WHERE created_at BETWEEN $1 AND $2 GROUP BY company_id, company_name, site_id, site_name`,
    [start, end]
  );

  res.json(rows);
}
