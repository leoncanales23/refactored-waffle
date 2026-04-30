// notify.js — Notificaciones al terminar un render
const https = require('https');
const http = require('http');

async function notifyWebhook(url, payload) {
  if (!url) return;
  try {
    const body = JSON.stringify(payload);
    const parsed = new URL(url);
    const lib = parsed.protocol === 'https:' ? https : http;
    await new Promise((resolve, reject) => {
      const req = lib.request(parsed, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } }, res => { console.log(`[Notify] Webhook → ${url} (${res.statusCode})`); resolve(); });
      req.on('error', reject);
      req.write(body);
      req.end();
    });
  } catch (err) { console.warn(`[Notify] Webhook falló: ${err.message}`); }
}

async function notifyEmail(to, job) {
  const MAILGUN_KEY = process.env.MAILGUN_API_KEY;
  const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN;
  if (!MAILGUN_KEY || !MAILGUN_DOMAIN || !to) return;
  const subject = job.status === 'done' ? `✅ NERHIA render listo — ${job.id}` : `❌ NERHIA render falló — ${job.id}`;
  const text = job.status === 'done' ? `Tu render NERHIA está listo.\n\nJob ID: ${job.id}\nArchivo: ${job.outputPath}\nTiempo: ${job.startedAt} → ${job.finishedAt}` : `El render falló.\n\nJob ID: ${job.id}\nError: ${job.error}`;
  try {
    const body = new URLSearchParams({ from: `NERHIA API <noreply@${MAILGUN_DOMAIN}>`, to, subject, text }).toString();
    await new Promise((resolve, reject) => {
      const req = https.request({ hostname: 'api.mailgun.net', path: `/v3/${MAILGUN_DOMAIN}/messages`, method: 'POST', headers: { 'Authorization': 'Basic ' + Buffer.from(`api:${MAILGUN_KEY}`).toString('base64'), 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body) } }, res => { console.log(`[Notify] Email → ${to} (${res.statusCode})`); resolve(); });
      req.on('error', reject);
      req.write(body);
      req.end();
    });
  } catch (err) { console.warn(`[Notify] Email falló: ${err.message}`); }
}

module.exports = { notifyWebhook, notifyEmail };