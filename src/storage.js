const fs = require('fs');
const path = require('path');

const STORAGE_PATH = path.join(process.cwd(), 'data', 'storage.json');

const defaultData = {
  companies: [],
  sites: [],
  tickets: [],
};

function ensureStorage() {
  if (!fs.existsSync(STORAGE_PATH)) {
    fs.writeFileSync(STORAGE_PATH, JSON.stringify(defaultData, null, 2));
  }
}

function readStorage() {
  ensureStorage();
  const raw = fs.readFileSync(STORAGE_PATH, 'utf8');
  const parsed = JSON.parse(raw || '{}');
  return {
    companies: parsed.companies || [],
    sites: parsed.sites || [],
    tickets: parsed.tickets || [],
  };
}

function writeStorage(data) {
  fs.writeFileSync(STORAGE_PATH, JSON.stringify(data, null, 2));
}

module.exports = { readStorage, writeStorage };
