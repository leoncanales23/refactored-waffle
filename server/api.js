"use strict";
const express = require("express");
const cors    = require("cors");
const path    = require("path");
const Anthropic = require("@anthropic-ai/sdk").default;

const app  = express();
app.use(cors()); app.use(express.json());

const PORT = process.env.PORT || 8090;

/* ── Generar narrativa con Claude ── */
async function generateNarrative(data) {
  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const r = await client.messages.create({
      model: "claude-haiku-4-5-20251001", max_tokens: 200,
      messages: [{ role:"user", content:
        `Eres NERHIA, el sistema de inteligencia urbana de ${data.city}. ` +
        `Genera un párrafo técnico (máx 3 oraciones) resumiendo la semana urbana con estos datos: ` +
        `UVX=${data.uvx}, MPI=${data.mpi}, CAI=${data.cai}, IEI=${data.iei}, UEI=${data.uei}, ` +
        `PM10=${data.pm10} µg/m³, Alerta=${data.alerta}. Tono: analítico, conciso.`
      }]
    });
    return r.content[0].text;
  } catch(e) {
    return `Semana operacional en ${data.city}. Índices dentro del rango nominal. Sistema NERHIA activo.`;
  }
}

/* ── POST /render — genera video completo ── */
app.post("/render", async (req, res) => {
  const data = { city:"Buin", weekLabel:"Semana actual",
    uvx:71, mpi:68, cai:65, iei:63, uei:74, pm10:45, alerta:"OK",
    ...req.body };

  try {
    const { bundle }   = require("@remotion/bundler");
    const { renderMedia, selectComposition } = require("@remotion/renderer");
    const os = require("os"), fs = require("fs");

    const narrative = await generateNarrative(data);
    data.narrative  = narrative;

    const bundleDir = await bundle({ entryPoint: path.join(__dirname,"../src/index.ts") });
    const comp = await selectComposition({ serveUrl:bundleDir, id:"NERHIAReport", inputProps:data });

    const outPath = path.join(os.tmpdir(), `nerhia-${Date.now()}.mp4`);
    await renderMedia({ composition:comp, serveUrl:bundleDir, codec:"h264",
      outputLocation:outPath, inputProps:data });

    res.download(outPath, "nerhia-report.mp4", () => fs.unlinkSync(outPath));
  } catch(err) {
    res.status(500).json({ ok:false, error:err.message });
  }
});

/* ── GET /health ── */
app.get("/health", (req, res) => res.json({ ok:true, service:"refactored-waffle", version:"0.1.0" }));

app.listen(PORT, () => console.log("[Waffle] Refinería activa · puerto", PORT));
