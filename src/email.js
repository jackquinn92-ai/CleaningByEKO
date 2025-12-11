function sendEmail({ to, subject, html }) {
  // Stubbed transport: log the payload for now.
  const payload = { to, subject, html };
  console.log('Email payload (stub):', JSON.stringify(payload, null, 2));
  return Promise.resolve();
}

module.exports = { sendEmail };
