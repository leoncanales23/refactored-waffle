"use strict";
const express  = require("express");
const cors     = require("cors");
const path     = require("path");
const os       = require("os");
const fs       = require("fs");
const Anthropic = require("@anthropic-ai/sdk").default;

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

const PORT    = process.env.PORT || 8090;
const VERSION = "0.4.0";
const STARTED = Date.now();
const ts = () => new Date().toISOString();

/* ── Helpers ── */
function parseMetrics(body = {}) {
  return {
    city:      typeof body.city      === "string" ? body.city.trim()      : "Buin",
    weekLabel: typeof body.weekLabel === "string" ? body.weekLabel.trim() : "Semana actual",
    uvx:  clamp(body.uvx,  71),
    mpi:  clamp(body.mpi,  68),
    cai:  clamp(body.cai,  65),
    iei:  clamp(body.iei,  63),
    uei:  clamp(body.uei,  74),
    pm10: clamp(body.pm10, 45, 0, 600),
    alerta: ["OK","ALERTA","CRITICO"].includes(body.alerta) ? body.alerta : "OK",
  };
}
function clamp(val, def, min=0, max=200) {
  const n = parseFloat(val);
  return isNaN(n) ? def : Math.min(Math.max(n, min), max);
}

/* ── Claude narrative ── */
async function generateNarrative(data) {
  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const r = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 220,
      messages: [{ role: "user", content:
        `Eres NERHIA, el sistema de inteligencia urbana de ${data.city}. ` +
        `Genera un párrafo técnico (máx 3 oraciones) resumiendo la semana urbana: ` +
        `UVX=${data.uvx}, MPI=${data.mpi}, CAI=${data.cai}, IEI=${data.iei}, UEI=${data.uei}, ` +
        `PM10=${data.pm10} µg/m³, Alerta=${data.alerta}, Semana=${data.weekLabel}. ` +
        `Tono: analítico, conciso. Sin saludos.`
      }]
    });
    return r.content[0].text.trim();
  } catch(e) {
    console.error(`[${ts()}][NERHIA] Claude error:`, e.message);
    return `Semana operacional en ${data.city}. Índices dentro del rango nominal.`;
  }
}

/* ── GET /status ── */
app.get("/status", (_req, res) => res.json({
  ok: true, service: "refactored-waffle", version: VERSION,
  uptimeSeconds: Math.floor((Date.now()-STARTED)/1000), timestamp: ts()
}));

/* ── GET /health ── */
app.get("/health", (_req, res) => res.json({ ok: true, version: VERSION }));

/* ── GET /narrative ── */
app.get("/narrative", async (req, res) => {
  const data = parseMetrics(req.query);
  try {
    const narrative = await generateNarrative(data);
    res.json({ ok: true, city: data.city, weekLabel: data.weekLabel, narrative });
  } catch(err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* ── GET /preview ── */
app.get("/preview", (req, res) => {
  const data = parseMetrics(req.query);
  res.json({ ok: true, composition: "NERHIAReport", props: data });
});

/* ── POST /render ── ── ── ── ── NUEVO: render real ── */
app.post("/render", async (req, res) => {
  const data = parseMetrics(req.body);
  const jobId = `nerhia-${Date.now()}`;
  console.log(`[${ts()}][render] Iniciando job ${jobId} para ${data.city}…`);

  try {
    // 1. Generar narrativa con Claude
    const narrative = await generateNarrative(data);
    const inputProps = { ...data, narrative };
    console.log(`[${ts()}][render] Narrativa generada ✓`);

    // 2. Bundle de Remotion (se cachea tras el primer uso)
    const { bundle } = require("@remotion/bundler");
    const bundlePath = await bundle({
      entryPoint: path.join(__dirname, "../src/index.ts"),
      outDir: path.join(os.tmpdir(), "remotion-bundle"),
    });
    console.log(`[${ts()}][render] Bundle listo ✓`);

    // 3. Seleccionar composición
    const { selectComposition, renderMedia } = require("@remotion/renderer");
    const composition = await selectComposition({
      serveUrl: bundlePath,
      id: "NERHIAReport",
      inputProps,
    });
    console.log(`[${ts()}][render] Composición seleccionada: ${composition.id} (${composition.durationInFrames} frames) ✓`);

    // 4. Renderizar a MP4
    const outPath = path.join(os.tmpdir(), `${jobId}.mp4`);
    await renderMedia({
      composition,
      serveUrl: bundlePath,
      codec: "h264",
      outputLocation: outPath,
      inputProps,
      chromiumOptions: {
        // Usar el Chromium instalado en el contenedor
        executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
        disableWebSecurity: true,
      },
      onProgress: ({ progress }) => {
        if (Math.round(progress * 100) % 20 === 0) {
          console.log(`[${ts()}][render] Progreso: ${Math.round(progress * 100)}%`);
        }
      },
    });
    console.log(`[${ts()}][render] MP4 generado → ${outPath} ✓`);

    // 5. Enviar archivo y limpiar
    res.setHeader("Content-Type", "video/mp4");
    res.setHeader("Content-Disposition", `attachment; filename="nerhia-${data.city}-${data.weekLabel}.mp4"`);
    const stream = fs.createReadStream(outPath);
    stream.pipe(res);
    stream.on("end", () => {
      try { fs.unlinkSync(outPath); } catch(_) {}
      console.log(`[${ts()}][render] Entregado y limpiado ✓`);
    });

  } catch(err) {
    console.error(`[${ts()}][render] Error:`, err.message);
    res.status(500).json({ ok: false, error: err.message, jobId });
  }
});

app.listen(PORT, () =>
  console.log(`[${ts()}][Waffle] v${VERSION} activa · puerto ${PORT}`)
);
