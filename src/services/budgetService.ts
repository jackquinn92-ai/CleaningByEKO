import { PoolClient } from 'pg';
import { Budget } from '../models/types';

export type BudgetStatus = {
  allowed: boolean;
  remaining: number;
  reason?: string;
};

export async function evaluateBudget(
  client: PoolClient,
  companyId: number,
  siteId: number,
  budget: Budget,
  totalCost: number,
  now = new Date()
): Promise<BudgetStatus> {
  if (!budget.isActive) {
    return { allowed: false, remaining: budget.amount, reason: 'Budget inactive' };
  }

  const start = new Date(budget.startDate);
  const end = new Date(budget.endDate);
  if (now < start || now > end) {
    return { allowed: false, remaining: budget.amount, reason: 'Budget window closed' };
  }

  const { rows } = await client.query(
    `SELECT COALESCE(SUM(total_cost), 0) as used FROM tickets
     WHERE company_id = $1 AND site_id = $2 AND created_at BETWEEN $3 AND $4`,
    [companyId, siteId, start.toISOString(), end.toISOString()]
  );

  const used = parseFloat(rows[0].used) || 0;
  const remaining = budget.amount - used;
  if (remaining < totalCost) {
    return { allowed: false, remaining, reason: 'Budget exceeded' };
  }

  return { allowed: true, remaining };
}
