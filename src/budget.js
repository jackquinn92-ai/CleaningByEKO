function parseDate(dateStr) {
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

function isWithinInterval(date, start, end) {
  return date >= start && date <= end;
}

function calculateTicketTotal(pricing, items) {
  return Object.entries(items).reduce((sum, [key, qty]) => {
    const price = pricing[key] || 0;
    return sum + price * qty;
  }, 0);
}

function budgetWindowTickets(site, tickets) {
  const budget = site.budget;
  if (!budget) return [];
  const start = parseDate(budget.startDate);
  const end = parseDate(budget.endDate);
  if (!start || !end) return [];
  return tickets.filter((ticket) => {
    if (ticket.siteId !== site.id) return false;
    const created = parseDate(ticket.createdAt);
    if (!created) return false;
    return isWithinInterval(created, start, end);
  });
}

function remainingBudget(site, tickets) {
  const budget = site.budget;
  if (!budget || !budget.isActive) return null;
  const windowTickets = budgetWindowTickets(site, tickets);
  const used = windowTickets.reduce((sum, ticket) => sum + ticket.totalCost, 0);
  return budget.amount - used;
}

function canSpend(site, tickets, totalCost) {
  const budget = site.budget;
  if (!budget || !budget.isActive) {
    return { allowed: false, reason: 'inactive' };
  }
  const now = new Date();
  const start = parseDate(budget.startDate);
  const end = parseDate(budget.endDate);
  if (!start || !end || !isWithinInterval(now, start, end)) {
    return { allowed: false, reason: 'out_of_window' };
  }
  const remaining = remainingBudget(site, tickets);
  if (remaining !== null && remaining < totalCost) {
    return { allowed: false, reason: 'insufficient' };
  }
  return { allowed: true };
}

module.exports = { calculateTicketTotal, budgetWindowTickets, remainingBudget, canSpend };
