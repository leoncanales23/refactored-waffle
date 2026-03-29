// ═══════════════════════════════════════════════════════════════
// REFINERÍA DIGITAL · Remotion Entry Point
// ═══════════════════════════════════════════════════════════════

import { Composition } from 'remotion';
import { VideoCoherence } from './VideoCoherence';

// Datos de ejemplo para el Remotion Studio
const DEMO_DATA = {
  title: "Demo Refinería Digital",
  duration: 1800,
  fps: 30,
  scenes: [
    {
      type: "intro" as const,
      from: 0,
      to: 150,
      clip: "clip_001.mp4",
      emotion: "tension" as const,
      overlay: {
        text: "El mundo genera 2.5 quintillones de datos al día.",
        style: "impact" as const,
        position: "bottom-center" as const,
      }
    },
    {
      type: "development" as const,
      from: 150,
      to: 450,
      clip: "clip_002.mp4",
      emotion: "calma" as const,
      overlay: {
        text: "La mayoría se pierde como basura digital.",
        style: "whisper" as const,
        position: "center" as const,
      }
    },
    {
      type: "revelation" as const,
      from: 450,
      to: 900,
      clip: "clip_003.mp4",
      emotion: "revelacion" as const,
      overlay: {
        text: "LA REFINERÍA DIGITAL",
        style: "title" as const,
        position: "center" as const,
      }
    },
    {
      type: "cta" as const,
      from: 900,
      to: 1800,
      clip: "clip_004.mp4",
      emotion: "accion" as const,
      overlay: {
        text: "Donde otros ven ruido, nosotros destilamos claridad.",
        style: "subtitle" as const,
        position: "bottom-center" as const,
      }
    },
  ],
  audio: {
    mood: "industrial" as const,
    fade_in: 0,
    fade_out: 1620,
  },
  meta: {
    style: "ensayo",
    coherence_score: 94,
    emotion_arc: ["tension", "calma", "revelacion", "accion"],
    cost: 0.005,
    margin_10x: true,
  }
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="VideoCoherence"
        component={VideoCoherence}
        durationInFrames={DEMO_DATA.duration}
        fps={DEMO_DATA.fps}
        width={1920}
        height={1080}
        defaultProps={{ data: DEMO_DATA }}
      />
      <Composition
        id="VideoCoherenceShort"
        component={VideoCoherence}
        durationInFrames={900}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ data: { ...DEMO_DATA, duration: 900 } }}
      />
    </>
  );
};
