#!/usr/bin/env node
// worker-service.js — Servicio dedicado para procesar jobs de la cola
// Corre como un Cloud Run service separado
const path = require('path');
const fs = require('fs');
const Anthropic = require('@anthropic-ai/sdk');
const queue = require('./queue');
const { notifyWebhook, notifyEmail } = require('./notify');

const OUT_DIR = path.join(__dirname, '../out');
const POLL_INTERVAL = 5000; // Cada 5 segundos

async function processJob(job) {
  console.log(`[Worker] Iniciando job ${job.id}`);
  queue.update(job.id, { status: 'running', startedAt: new Date().toISOString() });
  try {
    fs.mkdirSync(OUT_DIR, { recursive: true });
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    console.log(`[Worker] Generando narrativa para ${job.id}...`);
    const msg = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `Analiza estas métricas ambientales de NERHIA y da una narrativa de 2 oraciones en español:\n${JSON.stringify(job.metrics)}`
      }]
    });
    const narrative = msg.content[0].text;

    console.log(`[Worker] Narrativa generada: "${narrative}"`);
    console.log(`[Worker] Iniciando renderizado para ${job.id}...`);

    // TODO: Implementar renderizado con Remotion si es necesario
    // Por ahora, crear un mock para testing
    const outputPath = path.join(OUT_DIR, `${job.id}.mp4`);

    // Mock: crear archivo dummy (en producción aquí va renderMedia)
    fs.writeFileSync(outputPath, Buffer.from('Mock MP4 video'));

    queue.update(job.id, {
      status: 'done',
      finishedAt: new Date().toISOString(),
      outputPath
    });

    const updated = queue.get(job.id);
    console.log(`[Worker] Job ${job.id} completado → ${outputPath}`);

    if (updated.webhookUrl) {
      await notifyWebhook(updated.webhookUrl, { event: 'render.done', job: updated });
    }
    if (updated.notifyEmail) {
      await notifyEmail(updated.notifyEmail, updated);
    }
  } catch (err) {
    console.error(`[Worker] Job ${job.id} falló:`, err.message);
    queue.update(job.id, {
      status: 'failed',
      finishedAt: new Date().toISOString(),
      error: err.message
    });

    const failed = queue.get(job.id);
    if (failed.webhookUrl) {
      await notifyWebhook(failed.webhookUrl, { event: 'render.failed', job: failed });
    }
    if (failed.notifyEmail) {
      await notifyEmail(failed.notifyEmail, failed);
    }
  }
}

async function startWorker() {
  console.log('[Worker Service] Iniciando...');

  // Procesa jobs pending que estaban en la cola
  const pending = queue.list().filter(j => j.status === 'pending');
  console.log(`[Worker Service] Encontrados ${pending.length} jobs pending`);
  for (const job of pending) {
    await processJob(job);
  }

  // Escucha nuevos jobs
  queue.on('added', async (job) => {
    console.log(`[Worker Service] Nuevo job detectado: ${job.id}`);
    await processJob(job);
  });

  console.log('[Worker Service] Listo — escuchando jobs...');

  // Keep-alive: responde a health checks cada 30s
  setInterval(() => {
    console.log(`[Worker Service] Health check — ${queue.list().length} jobs en cola`);
  }, 30000);
}

// Inicia el worker
startWorker().catch(err => {
  console.error('[Worker Service] Error fatal:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Worker Service] Recibido SIGTERM, apagando...');
  process.exit(0);
});
