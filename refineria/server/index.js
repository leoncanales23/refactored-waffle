// ═══════════════════════════════════════════════════════════════
// REFINERÍA DIGITAL · server/index.js
// API Express que orquesta Claude + Remotion + entrega
// ═══════════════════════════════════════════════════════════════

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const Anthropic = require('@anthropic-ai/sdk');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, '../public')));

// Upload de clips
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['video/mp4', 'video/webm', 'video/x-matroska', 'video/quicktime'];
    cb(null, allowed.includes(file.mimetype));
  }
});

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── SYSTEM PROMPT DEL ARQUITECTO ────────────────────────────────
const ARCHITECT_PROMPT = `Eres el Arquitecto Jefe de la Refinería de Video Digital.
Tu misión: transformar "basura digital" en Videos Coherentes de Pensamiento.

LÓGICA DE REFINERÍA:
1. ANÁLISIS NARRATIVO: Extrae la esencia del guion. Identifica 3-5 momentos clave.
2. ASSET MAPPING: Asigna clips por emoción: TENSION → drama/conflicto, CALMA → reflexión, REVELACION → insight/descubrimiento, ACCION → urgencia/llamado.
3. OVERLAYS: Frases de máximo 10 palabras, impacto cinematográfico, timing en frames (30fps).
4. PACING: Intro 15%, Desarrollo 50%, Revelación 25%, CTA 10%.
5. COHERENCIA: El espectador NO debe notar que el material era "chatarra".

REGLA DE COSTOS: Diseños elegantes pero ligeros (<$0.01 costo real). Sin generación de assets pesados.

RESPONDE SOLO CON JSON VÁLIDO (sin markdown, sin explicación):
{
  "title": "string",
  "duration": frames_totales_int,
  "fps": 30,
  "scenes": [
    {
      "type": "intro|development|revelation|cta",
      "from": frame_int,
      "to": frame_int,
      "clip": "clip_N.mp4",
      "emotion": "tension|calma|revelacion|accion",
      "overlay": {
        "text": "frase de alto impacto, máx 10 palabras",
        "style": "impact|whisper|title|subtitle",
        "position": "top-left|top-center|center|bottom-center|bottom-right"
      }
    }
  ],
  "audio": {
    "mood": "industrial|ambient|upbeat|dramatic",
    "fade_in": 0,
    "fade_out": frame_int
  },
  "meta": {
    "style": "string",
    "coherence_score": 0-100,
    "emotion_arc": ["string"],
    "key_message": "mensaje central en 1 frase",
    "cost": 0.005,
    "margin_10x": true
  }
}

MANTRA: "Donde otros ven ruido, nosotros destilamos claridad."`;

// ── ENDPOINT: POST /api/refine ───────────────────────────────────
// Recibe guion + clips, devuelve JSON de Remotion
app.post('/api/refine', upload.array('clips', 20), async (req, res) => {
  const jobId = uuidv4().slice(0, 8).toUpperCase();
  const startTime = Date.now();

  try {
    const { guion, estilo = 'ensayo', duracion = 60, plan = 'estandar' } = req.body;
    const clips = req.files || [];

    if (!guion || guion.trim().length < 10) {
      return res.status(400).json({ ok: false, error: 'Guion demasiado corto (mínimo 10 chars)' });
    }

    console.log(`[REFINERIA] Job ${jobId} — ${clips.length} clips · "${guion.slice(0, 60)}…"`);

    // Construir lista de clips para Claude
    const clipList = clips.length > 0
      ? clips.map((f, i) => `clip_${i+1}.mp4 (${f.originalname})`).join('\n')
      : `stock_001.mp4 (Pexels — exterior urbano)\nstock_002.mp4 (Pexels — datos en pantalla)\nstock_003.mp4 (Pexels — persona trabajando)\nstock_004.mp4 (Pexels — ciudad nocturna)`;

    const userPrompt = `TRABAJO: ${jobId}
ESTILO DE VIDEO: ${estilo}
DURACIÓN OBJETIVO: ${duracion} segundos (${duracion * 30} frames a 30fps)
PLAN: ${plan}

GUION/IDEA A REFINAR:
${guion}

CLIPS DISPONIBLES:
${clipList}

Genera el JSON de configuración Remotion para este Video Coherente de Pensamiento.
El video debe durar exactamente ${duracion * 30} frames.`;

    // Llamada a Claude
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: ARCHITECT_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const rawJson = message.content[0]?.text || '';
    const cleanJson = rawJson.replace(/```json|```/g, '').trim();
    const remotionConfig = JSON.parse(cleanJson);

    // Agregar metadata del job
    remotionConfig.job = {
      id: jobId,
      plan,
      processTime: Date.now() - startTime,
      clipsProvided: clips.length,
      cost: 0.005,
      price: plan === 'eco' ? 0.35 : plan === 'industrial' ? 0.20 : 0.50,
    };

    console.log(`[REFINERIA] Job ${jobId} — JSON generado · Coherence: ${remotionConfig.meta?.coherence_score}/100`);

    // Limpiar uploads temporales
    clips.forEach(f => {
      try { fs.unlinkSync(f.path); } catch {}
    });

    res.json({
      ok: true,
      jobId,
      remotionConfig,
      webhook: {
        next: '/api/render',
        payload: { jobId, config: remotionConfig },
      },
      invoice: {
        plan,
        price: remotionConfig.job.price,
        cost: remotionConfig.job.cost,
        margin: `${Math.round(remotionConfig.job.price / remotionConfig.job.cost)}x`,
      },
    });

  } catch (err) {
    console.error(`[REFINERIA] Job ${jobId} ERROR:`, err.message);
    res.status(500).json({ ok: false, error: err.message, jobId });
  }
});

// ── ENDPOINT: POST /api/render ───────────────────────────────────
// Dispara Remotion Lambda (o local) con el JSON generado
app.post('/api/render', async (req, res) => {
  const { jobId, config } = req.body;

  try {
    // En producción: llamar a Remotion Lambda
    // const { renderMediaOnLambda } = require('@remotion/lambda');
    // const result = await renderMediaOnLambda({...});

    // Demo: simular render
    await new Promise(r => setTimeout(r, 1000));

    const outputUrl = `https://refineria.s3.amazonaws.com/videos/${jobId}.mp4`;

    console.log(`[RENDER] Job ${jobId} — Video listo en ${outputUrl}`);

    res.json({
      ok: true,
      jobId,
      outputUrl,
      size: '8.4 MB',
      duration: `${Math.round(config.duration / config.fps)}s`,
      message: `Tu chatarra ha sido refinada con éxito. Video listo en ${outputUrl}`,
    });

  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── ENDPOINT: POST /api/n8n-webhook ─────────────────────────────
// Receptor directo desde n8n — acepta JSON del nodo Claude
app.post('/api/n8n-webhook', async (req, res) => {
  const { guion, clips_urls, estilo, plan, cliente_email } = req.body;

  try {
    // Pipeline completo desde n8n
    const refineRes = await fetch('http://localhost:' + PORT + '/api/refine', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guion, estilo, plan }),
    });
    const refineData = await refineRes.json();

    res.json({
      ok: true,
      jobId: refineData.jobId,
      remotionConfig: refineData.remotionConfig,
      invoice: refineData.invoice,
      cliente_email,
      nextStep: 'Enviar remotionConfig al nodo Remotion de n8n',
    });

  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── ENDPOINT: GET /api/status ────────────────────────────────────
app.get('/api/status', (req, res) => {
  res.json({
    ok: true,
    service: 'Refinería Digital API',
    version: '1.0.0',
    model: 'claude-sonnet-4-20250514',
    uptime: Math.round(process.uptime()),
    endpoints: ['/api/refine', '/api/render', '/api/n8n-webhook', '/api/status'],
    pricing: {
      eco: '$0.35/video',
      estandar: '$0.50/video',
      industrial: '$0.20/video (100+)',
      costReal: '$0.005/video',
      margen: '70x-100x',
    }
  });
});

// ── SERVIR FRONTEND ──────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════╗
║  🏭 REFINERÍA DIGITAL · API SERVER          ║
║  Puerto: ${PORT}                               ║
║  Modelo: claude-sonnet-4-20250514           ║
║  Costo real: $0.005/video · Margen: 100x   ║
║                                              ║
║  "Donde otros ven ruido, destilamos          ║
║   claridad." — La Refinería Digital         ║
╚══════════════════════════════════════════════╝
`);
});

module.exports = app;
