const { budgetWindowTickets, remainingBudget } = require('../budget');
const { readStorage, writeStorage } = require('../storage');

function requireAdmin(req) {
  const token = process.env.ADMIN_TOKEN || 'changeme';
  return req.headers['x-admin-token'] === token;
}

function parseBody(req, res) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Invalid JSON' }));
      }
    });
  });
}

function writeJson(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(JSON.stringify(payload));
  return true;
}

async function handleAdmin(req, res, pathParts) {
  if (!requireAdmin(req)) {
    return writeJson(res, 401, { message: 'Unauthorized' });
  }

  const data = readStorage();

  if (req.method === 'GET' && pathParts[2] === 'companies') {
    return writeJson(res, 200, data.companies);
  }

  if (req.method === 'POST' && pathParts[2] === 'companies') {
    const body = await parseBody(req, res);
    if (!body.name) return writeJson(res, 400, { message: 'Invalid company' });
    const company = { id: `c-${Date.now()}`, name: body.name };
    data.companies.push(company);
    writeStorage(data);
    return writeJson(res, 201, company);
  }

  if (pathParts[2] === 'companies' && pathParts[3]) {
    const id = pathParts[3];
    const idx = data.companies.findIndex((c) => c.id === id);
    if (idx === -1) return writeJson(res, 404, { message: 'Not found' });

    if (req.method === 'PUT') {
      const body = await parseBody(req, res);
      if (!body.name) return writeJson(res, 400, { message: 'Invalid company' });
      data.companies[idx].name = body.name;
      writeStorage(data);
      return writeJson(res, 200, data.companies[idx]);
    }

    if (req.method === 'DELETE') {
      data.companies = data.companies.filter((c) => c.id !== id);
      data.sites = data.sites.filter((s) => s.companyId !== id);
      data.tickets = data.tickets.filter((t) => t.companyId !== id);
      writeStorage(data);
      res.writeHead(204);
      res.end();
      return true;
    }
  }

  if (req.method === 'GET' && pathParts[2] === 'sites' && !pathParts[3]) {
    return writeJson(res, 200, data.sites);
  }

  if (req.method === 'POST' && pathParts[2] === 'sites') {
    const body = await parseBody(req, res);
    if (!body.companyId || !body.siteName || !body.pin || !body.pricing) {
      return writeJson(res, 400, { message: 'Invalid site' });
    }
    const site = {
      id: `s-${Date.now()}`,
      companyId: body.companyId,
      siteName: body.siteName,
      siteAddress: body.siteAddress,
      pin: String(body.pin),
      pricing: body.pricing,
      budget: body.budget,
    };
    data.sites.push(site);
    writeStorage(data);
    return writeJson(res, 201, site);
  }

  if (pathParts[2] === 'sites' && pathParts[3]) {
    const siteId = pathParts[3];
    const idx = data.sites.findIndex((s) => s.id === siteId);
    if (idx === -1) return writeJson(res, 404, { message: 'Not found' });

    if (req.method === 'PUT') {
      const body = await parseBody(req, res);
      data.sites[idx] = { ...data.sites[idx], ...body };
      writeStorage(data);
      return writeJson(res, 200, data.sites[idx]);
    }

    if (req.method === 'DELETE') {
      data.sites = data.sites.filter((s) => s.id !== siteId);
      data.tickets = data.tickets.filter((t) => t.siteId !== siteId);
      writeStorage(data);
      res.writeHead(204);
      res.end();
      return true;
    }

    if (req.method === 'GET' && pathParts[4] === 'budget-usage') {
      const site = data.sites.find((s) => s.id === siteId);
      if (!site || !site.budget) return writeJson(res, 404, { message: 'Not found' });
      const tickets = budgetWindowTickets(site, data.tickets);
      const used = tickets.reduce((sum, t) => sum + t.totalCost, 0);
      return writeJson(res, 200, {
        budget: site.budget,
        used,
        remaining: site.budget.amount - used,
      });
    }
  }

  if (req.method === 'GET' && pathParts[2] === 'tickets') {
    const term = (new URL(req.url, 'http://localhost')).searchParams.get('search') || '';
    const search = term.toLowerCase();
    const filtered = search
      ? data.tickets.filter(
          (t) =>
            t.guardName.toLowerCase().includes(search) ||
            t.siteName.toLowerCase().includes(search) ||
            t.companyName.toLowerCase().includes(search)
        )
      : data.tickets;
    return writeJson(res, 200, filtered);
  }

  if (req.method === 'GET' && pathParts[2] === 'reports' && pathParts[3] === 'monthly') {
    const url = new URL(req.url, 'http://localhost');
    const month = Number(url.searchParams.get('month'));
    const year = Number(url.searchParams.get('year'));
    if (!month || !year) return writeJson(res, 400, { message: 'month and year required' });
    const monthIdx = month - 1;
    const rows = data.sites.map((site) => {
      const company = data.companies.find((c) => c.id === site.companyId);
      const tickets = data.tickets.filter((t) => {
        const date = new Date(t.createdAt);
        return date.getMonth() === monthIdx && date.getFullYear() === year && t.siteId === site.id;
      });
      const garments = {};
      tickets.forEach((t) => {
        Object.entries(t.items).forEach(([key, qty]) => {
          garments[key] = (garments[key] || 0) + Number(qty || 0);
        });
      });
      const totalAmount = tickets.reduce((sum, t) => sum + t.totalCost, 0);
      return {
        company: company ? company.name : 'Unknown',
        site: site.siteName,
        ticketCount: tickets.length,
        garments,
        totalAmount,
        budget: site.budget,
        budgetRemaining: remainingBudget(site, data.tickets),
      };
    });
    return writeJson(res, 200, rows);
  }

  return false;
}

module.exports = { handleAdmin };
