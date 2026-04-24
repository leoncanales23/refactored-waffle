"use strict";
const express  = require("express");
const cors     = require("cors");
const path     = require("path");
const Anthropic = require("@anthropic-ai/sdk").default;

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8090;

/* ── Helpers ── */
function parseMetrics(body = {}) {
  return {
    city:      typeof body.city      === "string" ? body.city.trim() : "Buin",
    weekLabel: typeof body.weekLabel === "string" ? body.weekLabel.trim() : "Semana actual",
    uvx:  clampMetric(body.uvx,  71),
    mpi:  clampMetric(body.mpi,  68),
    cai:  clampMetric(body.cai,  65),
    iei:  clampMetric(body.iei,  63),
    uei:  clampMetric(body.uei,  74),
    pm10: clampMetric(body.pm10, 45, 0, 600),
    alerta: ["OK", "ALERTA", "CRITICO"].includes(body.alerta) ? body.alerta : "OK",
  };
}

function clampMetric(val, def, min = 0, max = 200) {
  const n = parseFloat(val);
  if (isNaN(n)) return def;
  return Math.min(Math.max(n, min), max);
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
        `Genera un párrafo técnico (máx 3 oraciones, máx 220 tokens) resumiendo la semana urbana: ` +
        `UVX=${data.uvx}, MPI=${data.mpi}, CAI=${data.cai}, IEI=${data.iei}, UEI=${data.uei}, ` +
        `PM10=${data.pm10} µg/m³, Alerta=${data.alerta}, Semana=${data.weekLabel}. ` +
        `Tono: analítico, conciso. Sin saludos.`
      }]
    });
    return r.content[0].text.trim();
  } catch (e) {
    console.error("[NERHIA] Claude error:", e.message);
    return `Semana operacional en ${data.city}. Índices dentro del rango nominal. Sistema NERHIA activo.`;
  }
}

/* ── GET /narrative — genera sólo el texto (sin render) ── */
app.get("/narrative", async (req, res) => {
  const data = parseMetrics(req.query);
  try {
    const narrative = await generateNarrative(data);
    res.json({ ok: true, city: data.city, weekLabel: data.weekLabel, narrative });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* ── GET /preview — retorna los props del video sin renderizar ── */
app.get("/preview", (req, res) => {
  const data = parseMetrics(req.query);
  res.json({ ok: true, composition: "NERHIAReport", props: data });
});

/* ── POST /render — genera video completo ── */
app.post("/render", async (req, res) => {
  const data = parseMetrics(req.body);

  try {
    const { bundle }   = require("@remotion/bundler");
    const { renderMedia, selectComposition } = require("@remotion/renderer");
    const os = require("os");
    const fs = require("fs");

    const narrative = await generateNarrative(data);
    data.narrative  = narrative;

    console.log(`[Waffle] Bundling para ${data.city} / ${data.weekLabel}…`);
    const bundleDir = await bundle({
      entryPoint: path.join(__dirname, "../src/index.ts")
    });

    const comp = await selectComposition({
      serveUrl: bundleDir, id: "NERHIAReport", inputProps: data
    });

    const outPath = path.join(os.tmpdir(), `nerhia-${Date.now()}.mp4`);
    await renderMedia({
      composition: comp, serveUrl: bundleDir,
      codec: "h264", outputLocation: outPath, inputProps: data
    });

    console.log(`[Waffle] Render listo → ${outPath}`);
    res.download(outPath, "nerhia-report.mp4", () => {
      try { fs.unlinkSync(outPath); } catch (_) {}
    });
  } catch (err) {
    console.error("[Waffle] Render error:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* ── GET /health ── */
app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "refactored-waffle", version: "0.2.0" });
});

app.listen(PORT, () =>
  console.log(`[Waffle] Refinería activa · puerto ${PORT}`)
);
