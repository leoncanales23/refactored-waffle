// ═══════════════════════════════════════════════════════════════
// REFINERÍA DIGITAL · VideoCoherence.tsx
// Componente Remotion que renderiza el JSON de Claude
// Transforma "basura digital" en Videos Coherentes de Pensamiento
// ═══════════════════════════════════════════════════════════════

import { AbsoluteFill, Video, useCurrentFrame, useVideoConfig, interpolate, spring, Img, Audio } from 'remotion';

// ── TIPOS ──────────────────────────────────────────────────────
interface Overlay {
  text: string;
  style: 'impact' | 'whisper' | 'title' | 'subtitle';
  position: 'top-left' | 'top-center' | 'center' | 'bottom-center' | 'bottom-right';
}

interface Scene {
  type: 'intro' | 'development' | 'revelation' | 'cta';
  from: number;
  to: number;
  clip: string;
  emotion: 'tension' | 'calma' | 'revelacion' | 'accion';
  overlay: Overlay;
  imageUrl?: string;
}

interface AudioConfig {
  mood: 'industrial' | 'ambient' | 'upbeat' | 'dramatic';
  fade_in: number;
  fade_out: number;
  src?: string;
}

interface RefineriaJSON {
  title: string;
  duration: number;
  fps: number;
  scenes: Scene[];
  audio: AudioConfig;
  meta: {
    style: string;
    coherence_score: number;
    emotion_arc: string[];
    cost: number;
  };
}

// ── PALETA POR EMOCIÓN ──────────────────────────────────────────
const EMOTION_PALETTES = {
  tension:   { primary: '#ef4444', secondary: '#dc2626', accent: '#fca5a5' },
  calma:     { primary: '#06b6d4', secondary: '#0891b2', accent: '#a5f3fc' },
  revelacion:{ primary: '#f59e0b', secondary: '#d97706', accent: '#fde68a' },
  accion:    { primary: '#39d353', secondary: '#22c55e', accent: '#bbf7d0' },
};

// ── POSICIONES DE OVERLAY ────────────────────────────────────────
const POSITIONS: Record<string, React.CSSProperties> = {
  'top-left':     { top: '8%', left: '6%', textAlign: 'left', maxWidth: '55%' },
  'top-center':   { top: '8%', left: '50%', transform: 'translateX(-50%)', textAlign: 'center', maxWidth: '70%' },
  'center':       { top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center', maxWidth: '75%' },
  'bottom-center':{ bottom: '10%', left: '50%', transform: 'translateX(-50%)', textAlign: 'center', maxWidth: '75%' },
  'bottom-right': { bottom: '8%', right: '6%', textAlign: 'right', maxWidth: '55%' },
};

// ── ESTILOS DE TEXTO ─────────────────────────────────────────────
const TEXT_STYLES: Record<string, React.CSSProperties> = {
  impact:   { fontSize: '52px', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.1, fontFamily: "'Bebas Neue', cursive" },
  whisper:  { fontSize: '22px', fontWeight: 400, letterSpacing: '0.08em', lineHeight: 1.6, fontFamily: "'Share Tech Mono', monospace", opacity: 0.85 },
  title:    { fontSize: '72px', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 0.95, fontFamily: "'Bebas Neue', cursive" },
  subtitle: { fontSize: '32px', fontWeight: 600, letterSpacing: '0.04em', lineHeight: 1.3, fontFamily: "'Rajdhani', sans-serif" },
};

// ── COMPONENTE OVERLAY ───────────────────────────────────────────
function TextOverlay({ scene, frame }: { scene: Scene; frame: number }) {
  const localFrame = frame - scene.from;
  const palette = EMOTION_PALETTES[scene.emotion];

  // Animación de entrada — diferente por estilo
  const opacity = interpolate(localFrame, [0, 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const translateY = interpolate(localFrame, [0, 20], [scene.overlay.style === 'impact' ? 30 : 10, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  // Fade out suave al final de la escena
  const fadeOut = interpolate(frame, [scene.to - 20, scene.to], [1, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  return (
    <div style={{
      position: 'absolute',
      ...POSITIONS[scene.overlay.position],
      opacity: opacity * fadeOut,
      transform: `${POSITIONS[scene.overlay.position]?.transform || ''} translateY(${translateY}px)`,
      zIndex: 10,
    }}>
      {/* Fondo semi-transparente para legibilidad */}
      {scene.overlay.style !== 'whisper' && (
        <div style={{
          position: 'absolute', inset: '-8px -12px',
          background: `linear-gradient(135deg, ${palette.primary}22, transparent)`,
          borderLeft: `3px solid ${palette.primary}`,
        }} />
      )}

      <p style={{
        color: scene.overlay.style === 'whisper' ? palette.accent : '#ffffff',
        textShadow: `0 0 40px ${palette.primary}80, 0 2px 8px rgba(0,0,0,0.8)`,
        margin: 0,
        position: 'relative',
        ...TEXT_STYLES[scene.overlay.style],
      }}>
        {scene.overlay.text}
      </p>

      {/* Línea decorativa debajo para impact/title */}
      {(scene.overlay.style === 'impact' || scene.overlay.style === 'title') && (
        <div style={{
          height: '2px',
          background: `linear-gradient(90deg, ${palette.primary}, transparent)`,
          marginTop: '8px',
          width: `${interpolate(localFrame, [10, 30], [0, 100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}%`,
        }} />
      )}
    </div>
  );
}

// ── COMPONENTE ESCENA ────────────────────────────────────────────
function SceneLayer({ scene, frame }: { scene: Scene; frame: number }) {
  const palette = EMOTION_PALETTES[scene.emotion];
  const isActive = frame >= scene.from && frame < scene.to;
  if (!isActive) return null;

  // Transición entre escenas — cross-fade suave
  const sceneOpacity = interpolate(frame, [scene.from, scene.from + 12, scene.to - 12, scene.to], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ opacity: sceneOpacity }}>
      {/* VIDEO CLIP */}
      {scene.imageUrl ? (
        <Img src={scene.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <AbsoluteFill style={{
          background: `radial-gradient(ellipse 70% 60% at 50% 40%, ${palette.primary}18, ${palette.secondary}08 50%, #04010a 90%)`,
        }}>
          {/* Noise texture overlay */}
          <AbsoluteFill style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E")`,
            opacity: 0.5,
          }} />
          {/* Animated grid lines */}
          <AbsoluteFill style={{
            backgroundImage: `linear-gradient(${palette.primary}06 1px, transparent 1px), linear-gradient(90deg, ${palette.primary}06 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }} />
        </AbsoluteFill>
      )}

      {/* COLOR GRADE por emoción */}
      <AbsoluteFill style={{
        background: `linear-gradient(135deg, ${palette.primary}12, transparent 50%, ${palette.secondary}08)`,
        mixBlendMode: 'overlay',
      }} />

      {/* Scan line efecto industrial */}
      <div style={{
        position: 'absolute', left: 0, right: 0, height: '1px',
        background: `linear-gradient(90deg, transparent, ${palette.primary}60, transparent)`,
        top: `${(frame * 3) % 100}%`,
        opacity: 0.4,
      }} />

      {/* TEXT OVERLAY */}
      <TextOverlay scene={scene} frame={frame} />

      {/* INDICADOR DE EMOCIÓN — esquina */}
      <div style={{
        position: 'absolute', bottom: '4%', right: '3%',
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase',
        color: `${palette.accent}70`,
        opacity: interpolate(frame, [scene.from + 20, scene.from + 35], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
      }}>
        {scene.emotion} · {scene.type}
      </div>
    </AbsoluteFill>
  );
}

// ── WATERMARK REFINERÍA ──────────────────────────────────────────
function RefineriaWatermark({ frame }: { frame: number }) {
  const opacity = interpolate(frame, [0, 20, 40], [0, 0.6, 0.6], { extrapolateRight: 'clamp' });
  return (
    <div style={{
      position: 'absolute', top: '3%', left: '3%', zIndex: 20,
      display: 'flex', alignItems: 'center', gap: '8px', opacity,
    }}>
      <div style={{
        width: '20px', height: '20px', background: '#f59e0b',
        clipPath: 'polygon(0 0,100% 0,100% 75%,87% 100%,0 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '10px', color: '#0a0602', fontWeight: 900,
      }}>R</div>
      <span style={{
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase',
        color: 'rgba(245,158,11,0.7)',
      }}>REFINERÍA DIGITAL</span>
    </div>
  );
}

// ── COMPONENTE PRINCIPAL ─────────────────────────────────────────
export function VideoCoherence({ data }: { data: RefineriaJSON }) {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  return (
    <AbsoluteFill style={{ background: '#04010a', width, height }}>
      {/* ESCENAS */}
      {data.scenes.map((scene, i) => (
        <SceneLayer key={i} scene={scene} frame={frame} />
      ))}

      {/* WATERMARK */}
      <RefineriaWatermark frame={frame} />

      {/* COHERENCE SCORE — corner inferior */}
      <div style={{
        position: 'absolute', bottom: '3%', left: '3%', zIndex: 20,
        fontFamily: "'Share Tech Mono', monospace", fontSize: '9px',
        letterSpacing: '0.14em', textTransform: 'uppercase',
        color: 'rgba(245,158,11,0.45)',
        opacity: interpolate(frame, [data.duration - 60, data.duration - 40], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
      }}>
        COHERENCE: {data.meta.coherence_score}/100 · ${data.meta.cost}
      </div>
    </AbsoluteFill>
  );
}

export default VideoCoherence;
