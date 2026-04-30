// api.js v0.4.0 — NERHIA API con cola de renders, webhook y notificaciones
const express = require('express');
const path = require('path');
const fs = require('fs');
const Anthropic = require('@anthropic-ai/sdk');
const queue = require('./queue');
const { startWorker } = require('./worker');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

const PORT = process.env.PORT || 8090;
const START_TIME = Date.now();

function parseMetrics(body) {
  const clamp = (v, min, max) => Math.min(max, Math.max(min, Number(v) || 0));
  return { pm25: clamp(body.pm25,0,500), no2: clamp(body.no2,0,500), co2: clamp(body.co2,0,5000), temperatura: clamp(body.temperatura,-10,60), humedad: clamp(body.humedad,0,100), location: body.location||'Ciudad desconocida', timestamp: body.timestamp||new Date().toISOString() };
}

app.get('/status', (req, res) => res.json({ status:'ok', version:'0.4.0', uptime: Math.floor((Date.now()-START_TIME)/1000), queue: queue.stats(), timestamp: new Date().toISOString() }));

app.get('/preview', (req, res) => res.json({ composition:'NERHIAReport', props:{ pm25:45,no2:30,co2:800,temperatura:22,humedad:65,location:'CDMX Sample',timestamp:new Date().toISOString(),narrative:'Calidad del aire moderada. Se recomienda precaución.' } }));

app.post('/narrative', async (req, res) => {
  try {
    const metrics = parseMetrics(req.body);
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const msg = await client.messages.create({ model: 'claude-opus-4-5', max_tokens: 300, messages: [{ role: 'user', content: `Analiza estas métricas ambientales de NERHIA y da una narrativa de 2 oraciones en español:\n${JSON.stringify(metrics)}` }] });
    res.json({ narrative: msg.content[0].text, metrics });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/render/enqueue', (req, res) => {
  try {
    const metrics = parseMetrics(req.body);
    const job = queue.add(metrics, req.body.webhookUrl, req.body.notifyEmail);
    res.status(202).json({ message:'Job encolado', job, statusUrl:`/render/status/${job.id}` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/render/status/:id', (req, res) => {
  const job = queue.get(req.params.id);
  if (!job) return res.status(404).json({ error:'Job no encontrado' });
  res.json(job);
});

app.get('/render/jobs', (req, res) => {
  const limit = parseInt(req.query.limit)||20;
  res.json(queue.list().slice(0, limit));
});

app.get('/render/download/:id', (req, res) => {
  const job = queue.get(req.params.id);
  if (!job||job.status!=='done') return res.status(404).json({ error:'Video no disponible' });
  res.download(job.outputPath, `nerhia-${job.id}.mp4`);
});

app.post('/render', (req, res) => {
  const metrics = parseMetrics(req.body);
  const job = queue.add(metrics, null, null);
  res.status(202).json({ message:'Render encolado (usa /render/status/:id para seguimiento)', jobId: job.id, statusUrl:`/render/status/${job.id}` });
});

app.listen(PORT, () => { console.log(`[NERHIA API v0.4.0] Puerto ${PORT}`); startWorker(); });