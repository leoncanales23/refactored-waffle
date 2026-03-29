# 🏭 La Refinería Digital

> **"Donde otros ven ruido, nosotros destilamos claridad."**

Motor de reciclaje de video con IA. Transforma clips fallidos, stock genérico y grabaciones crudas en **Videos Coherentes de Pensamiento**. Claude analiza. Remotion renderiza. n8n orquesta. Tú cobras.

---

## 💰 Economía del Sistema

| Plan | Precio al cliente | Costo real | Margen |
|------|-------------------|------------|--------|
| Eco-Digital | **$0.35** | $0.005 | **70x** |
| Estándar | **$0.50** | $0.005 | **100x** |
| Industrial (100+) | **$0.20** | $0.005 | **40x** |

---

## 🗂 Estructura del Repositorio

```
refineria-digital/
├── public/
│   └── index.html          ← Landing page + Demo interactivo
├── src/
│   └── remotion/
│       ├── VideoCoherence.tsx  ← Componente principal Remotion
│       └── index.ts            ← Registro de composiciones
├── server/
│   └── index.js            ← API Express (Claude + Remotion + entrega)
├── n8n/
│   └── pipeline-refineria.json ← Workflow n8n listo para importar
├── docs/
│   └── README.md           ← Este archivo
├── .env.example            ← Variables de entorno
└── package.json
```

---

## 🚀 Instalación Rápida

```bash
# 1. Clonar y entrar
git clone https://github.com/tu-usuario/refineria-digital
cd refineria-digital

# 2. Instalar dependencias
npm install

# 3. Configurar variables
cp .env.example .env
# Editar .env con tu ANTHROPIC_API_KEY

# 4. Iniciar servidor API
node server/index.js

# 5. Abrir landing page
# Abrir public/index.html en el navegador
# O: npm run dev (para Vite dev server)
```

---

## 🔄 Pipeline n8n

### Importar el workflow
1. Abrir n8n (`http://localhost:5678`)
2. **Settings → Import Workflow**
3. Seleccionar `n8n/pipeline-refineria.json`
4. Configurar credenciales (ver abajo)

### Credenciales requeridas en n8n
- **Anthropic API**: Header `x-api-key` → tu clave de Anthropic
- **SMTP**: Para envío de videos al cliente
- **Google Sheets** (opcional): Para logging de jobs

### Flujo del pipeline
```
Webhook → Validar Input → Claude (JSON config) → 
Remotion (render) → Factura → Entregar al cliente → Log GSheets
```

---

## 🧠 El Prompt Maestro (Claude)

Claude actúa como **Arquitecto Jefe** con este system prompt:

```
Eres el Arquitecto Jefe de la Refinería de Video Digital.
Tu misión: transformar "basura digital" en Videos Coherentes de Pensamiento.

PROCESO:
1. ANÁLISIS NARRATIVO: Extrae la esencia. 3-5 momentos clave.
2. ASSET MAPPING: Asigna clips por emoción:
   - TENSION → drama/conflicto
   - CALMA → reflexión
   - REVELACION → insight/descubrimiento
   - ACCION → urgencia/llamado
3. OVERLAYS: Frases ≤10 palabras, timing exacto en frames (30fps)
4. PACING: Intro 15%, Desarrollo 50%, Revelación 25%, CTA 10%

RESPONDE SOLO JSON VÁLIDO. Costo <$0.01.
```

### Ejemplo de JSON que genera Claude
```json
{
  "title": "Manifiesto de la Economía Circular Digital",
  "duration": 1800,
  "fps": 30,
  "scenes": [
    {
      "type": "intro",
      "from": 0,
      "to": 270,
      "clip": "clip_001.mp4",
      "emotion": "tension",
      "overlay": {
        "text": "El mundo genera 2.5 quintillones de datos al día.",
        "style": "impact",
        "position": "bottom-center"
      }
    }
  ],
  "meta": {
    "coherence_score": 94,
    "cost": 0.005,
    "margin_10x": true
  }
}
```

---

## 🎬 Remotion

### Desarrollo local
```bash
npm run remotion:studio
# Abre el Remotion Studio en http://localhost:3000
```

### Render local (output/video.mp4)
```bash
npm run remotion:render
```

### Render en AWS Lambda
```bash
# Primero: configurar credenciales AWS en .env
npm run remotion:lambda
```

---

## 📡 API Endpoints

### POST `/api/refine`
Analiza guion con Claude y genera JSON de Remotion.

```bash
curl -X POST http://localhost:3001/api/refine \
  -F "guion=El futuro del trabajo es creativo y colaborativo" \
  -F "estilo=ensayo" \
  -F "duracion=60" \
  -F "plan=estandar" \
  -F "clips=@mi_video.mp4"
```

**Respuesta:**
```json
{
  "ok": true,
  "jobId": "A3F7B2C1",
  "remotionConfig": { ... },
  "invoice": { "price": 0.50, "cost": 0.005, "margin": "100x" }
}
```

### POST `/api/render`
Envía el JSON a Remotion Lambda.

### POST `/api/n8n-webhook`
Receptor directo desde n8n (pipeline automático).

### GET `/api/status`
Estado del sistema y pricing.

---

## 🛠 Stack Tecnológico

| Componente | Tecnología | Costo |
|------------|------------|-------|
| IA / Arquitecto | Claude claude-sonnet-4 | ~$0.003/análisis |
| Video Rendering | Remotion + Lambda | ~$0.002/render |
| Orquestación | n8n (self-hosted) | $0/mes |
| Almacenamiento | AWS S3 | ~$0.023/GB |
| Stock de clips | Pexels API | Gratis |
| Server | Express.js | $0 (self-hosted) |

**Total: ~$0.005/video**

---

## 📈 Estrategia de Venta

Vender como **"Optimización de Activos Digitales"**:

> *"No descartes tus videos fallidos de Sora o tus clips de stock viejos. Nuestra Refinería de Pensamiento les da una narrativa coherente por solo $0.35 la pieza. Es el arte de la economía circular aplicada a los bits."*

### Ventaja competitiva
- Google/OpenAI se enfocan en **generar** contenido nuevo
- La Refinería se especializa en **dar coherencia** al contenido existente
- Primera plataforma de **reciclaje narrativo digital**
- Soberanía de costos — sin dependencia de pricing externo

---

## 📄 Licencia

Open Source — construido con Claude, Remotion y n8n.

**"Donde otros ven ruido, nosotros destilamos claridad."**
