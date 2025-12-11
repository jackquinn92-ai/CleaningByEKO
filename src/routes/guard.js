const { calculateTicketTotal, canSpend } = require('../budget');
const { sendEmail } = require('../email');
const { readStorage, writeStorage } = require('../storage');

const GARMENT_KEYS = [
  'Jacket',
  'Trousers',
  'Waistcoat',
  'Shirt',
  'Dress',
  'Skirt',
  'Coat',
  'High-vis coat',
  'High-vis vest',
  'Tie',
  'Top',
  'MISC',
  'Raincoat',
  'Rain jacket',
  'Jumpers',
  'Aprons',
  'Table covers',
];

function validatePinPayload(body) {
  return body && typeof body.pin === 'string' && body.pin.length > 0 && body.pin.length <= 10;
}

function validateTicketPayload(body) {
  if (!body || typeof body !== 'object') return false;
  const required = ['pin', 'guardName', 'phone', 'email', 'items'];
  for (const key of required) {
    if (!body[key]) return false;
  }
  if (typeof body.pin !== 'string' || body.pin.length === 0 || body.pin.length > 10) return false;
  if (typeof body.guardName !== 'string') return false;
  if (typeof body.phone !== 'string') return false;
  if (typeof body.email !== 'string' || !body.email.includes('@')) return false;
  if (typeof body.items !== 'object') return false;
  const hasQuantity = Object.values(body.items).some((qty) => Number(qty) > 0);
  return hasQuantity;
}

function generateRef(seed) {
  const now = Date.now().toString();
  const sum = (seed || 'eko').split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const hash = (parseInt(now, 10) + sum).toString();
  const lastFour = hash.slice(-4).padStart(4, '0');
  return lastFour === '0000' ? '0001' : lastFour;
}

function renderEmail(ticket, site, companyName) {
  const itemsList = GARMENT_KEYS.filter((key) => ticket.items[key] && ticket.items[key] > 0)
    .map((key) => `<li>${key}: ${ticket.items[key]}</li>`)
    .join('');
  return `
    <h2>Order ${ticket.ref}</h2>
    <p>${new Date(ticket.createdAt).toLocaleString()}</p>
    <p><strong>${companyName}</strong> – ${site.siteName}</p>
    <p>${site.siteAddress || ''}</p>
    <p>Guard: ${ticket.guardName} (${ticket.email}, ${ticket.phone})</p>
    <ul>${itemsList}</ul>
    ${ticket.notes ? `<p>Notes: ${ticket.notes}</p>` : ''}
    <p>Please print and include the ticket with the garments.</p>
  `;
}

async function handleGuard(req, res, path) {
  if (req.method === 'POST' && path === '/api/guard/pin') {
    const body = await parseBody(req, res);
    if (!validatePinPayload(body)) {
      return writeJson(res, 400, { message: 'Invalid request' });
    }
    const data = readStorage();
    const site = data.sites.find((s) => s.pin === body.pin);
    if (!site) {
      return writeJson(res, 400, { message: 'Invalid PIN. Please check with your supervisor.' });
    }
    const budgetCheck = canSpend(site, data.tickets, 0);
    if (!budgetCheck.allowed) {
      return writeJson(res, 403, {
        message: "This site’s allocation is not currently active or has been used. Please contact your manager.",
      });
    }
    const company = data.companies.find((c) => c.id === site.companyId);
    return writeJson(res, 200, {
      companyName: company ? company.name : 'Unknown company',
      siteName: site.siteName,
      siteAddress: site.siteAddress,
      pricing: site.pricing,
      budget: site.budget,
    });
  }

  if (req.method === 'POST' && path === '/api/guard/tickets') {
    const body = await parseBody(req, res);
    if (!validateTicketPayload(body)) {
      return writeJson(res, 400, { message: 'Invalid request' });
    }
    const data = readStorage();
    const site = data.sites.find((s) => s.pin === body.pin);
    if (!site) {
      return writeJson(res, 400, { message: 'Invalid PIN. Please check with your supervisor.' });
    }
    const company = data.companies.find((c) => c.id === site.companyId);
    const totalCost = calculateTicketTotal(site.pricing, body.items);
    const budgetCheck = canSpend(site, data.tickets, totalCost);
    if (!budgetCheck.allowed) {
      return writeJson(res, 403, {
        message: "This site’s allocation is not currently active or has been used. Please contact your manager.",
      });
    }
    const ticket = {
      id: `t-${Date.now()}`,
      ref: generateRef(body.email),
      createdAt: new Date().toISOString(),
      companyId: site.companyId,
      companyName: company ? company.name : 'Unknown company',
      siteId: site.id,
      siteName: site.siteName,
      guardName: body.guardName,
      phone: body.phone,
      email: body.email,
      items: body.items,
      notes: body.notes,
      totalCost,
    };
    data.tickets.push(ticket);
    writeStorage(data);

    const recipients = [body.email];
    if (process.env.INTERNAL_MAIL_RECIPIENT) {
      recipients.push(process.env.INTERNAL_MAIL_RECIPIENT);
    }

    await sendEmail({
      to: recipients,
      subject: `Cleaning by EKO order ${ticket.ref}`,
      html: renderEmail(ticket, site, company ? company.name : ''),
    });

    return writeJson(res, 201, {
      message: 'Ticket submitted',
      ticket,
      budgetRemaining: site.budget ? site.budget.amount - totalCost : null,
    });
  }

  return false;
}

function parseBody(req, res) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      try {
        const parsed = data ? JSON.parse(data) : {};
        resolve(parsed);
      } catch (e) {
        writeJson(res, 400, { message: 'Invalid JSON' });
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

module.exports = { handleGuard };
