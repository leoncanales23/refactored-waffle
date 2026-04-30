// worker.js — Procesa jobs de la cola uno a uno
const { bundle } = require('@remotion/bundler');
const { renderMedia, selectComposition } = require('@remotion/renderer');
const path = require('path');
const fs = require('fs');
const Anthropic = require('@anthropic-ai/sdk');
const queue = require('./queue');
const { notifyWebhook, notifyEmail } = require('./notify');

const OUT_DIR = path.join(__dirname, '../out');

async function processJob(job) {
  console.log(`[Worker] Iniciando job ${job.id}`);
  queue.update(job.id, { status: 'running', startedAt: new Date().toISOString() });
  try {
    fs.mkdirSync(OUT_DIR, { recursive: true });
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const msg = await client.messages.create({ model: 'claude-opus-4-5', max_tokens: 300, messages: [{ role: 'user', content: `Analiza estas métricas ambientales de NERHIA y da una narrativa de 2 oraciones en español:\n${JSON.stringify(job.metrics)}` }] });
    const narrative = msg.content[0].text;
    const bundled = await bundle(path.join(__dirname, '../src/index.ts'));
    const comp = await selectComposition({ serveUrl: bundled, id: 'NERHIAReport' });
    const outputPath = path.join(OUT_DIR, `${job.id}.mp4`);
    await renderMedia({ composition: comp, serveUrl: bundled, codec: 'h264', outputLocation: outputPath, inputProps: { ...job.metrics, narrative } });
    queue.update(job.id, { status: 'done', finishedAt: new Date().toISOString(), outputPath });
    const updated = queue.get(job.id);
    await notifyWebhook(job.webhookUrl, { event: 'render.done', job: updated });
    await notifyEmail(job.notifyEmail, updated);
    console.log(`[Worker] Job ${job.id} completado → ${outputPath}`);
  } catch (err) {
    console.error(`[Worker] Job ${job.id} falló:`, err.message);
    queue.update(job.id, { status: 'failed', finishedAt: new Date().toISOString(), error: err.message });
    const failed = queue.get(job.id);
    await notifyWebhook(job.webhookUrl, { event: 'render.failed', job: failed });
    await notifyEmail(job.notifyEmail, failed);
  }
}

async function startWorker() {
  const pending = queue.list().filter(j => j.status === 'pending');
  for (const job of pending) { await processJob(job); }
  queue.on('added', async (job) => { await processJob(job); });
  console.log('[Worker] Listo — esperando jobs');
}

module.exports = { startWorker };