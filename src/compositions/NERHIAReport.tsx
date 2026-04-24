import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

type Props = {
  uvx: number; mpi: number; cai: number; iei: number; uei: number;
  pm10: number; alerta: string; city: string; weekLabel: string;
  narrative: string;
};

const MetricBar: React.FC<{
  label: string; value: number; color: string; delay: number; frame: number; fps: number;
}> = ({ label, value, color, delay, frame, fps }) => {
  const progress = spring({ frame: frame - delay, fps, config: { damping: 14, stiffness: 80 } });
  const opacity = interpolate(frame - delay, [0, 12], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const pct = Math.min(Math.max(value, 0), 100);

  return (
    <div style={{ flex: 1, opacity }}>
      <div style={{ fontSize: 10, color: "rgba(240,235,255,.45)", marginBottom: 5, letterSpacing: "0.12em" }}>
        {label}
      </div>
      <div style={{ fontSize: 30, fontWeight: 700, color, marginBottom: 6 }}>
        {value}
      </div>
      <div style={{ height: 3, background: "rgba(255,255,255,.07)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${progress * pct}%`, background: color, borderRadius: 2,
          boxShadow: `0 0 8px ${color}70`
        }} />
      </div>
      <div style={{ fontSize: 9, color: "rgba(240,235,255,.28)", marginTop: 3, letterSpacing: "0.08em" }}>
        {Math.round(progress * pct)}%
      </div>
    </div>
  );
};

export const NERHIAReport: React.FC<Props> = ({
  uvx = 71, mpi = 68, cai = 65, iei = 63, uei = 74,
  pm10 = 45, alerta = "OK", city = "Buin", weekLabel = "Semana 16", narrative = ""
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const metrics = [
    { label: "UVX", value: uvx, color: "#b088ff" },
    { label: "MPI", value: mpi, color: "#00d4ff" },
    { label: "CAI", value: cai, color: "#9c88ff" },
    { label: "IEI", value: iei, color: "#ffc400" },
    { label: "UEI", value: uei, color: "#00e676" },
  ];

  const avgScore = Math.round((uvx + mpi + cai + iei + uei) / 5);
  const alertColor = alerta === "OK" ? "#00e676" : alerta === "ALERTA" ? "#ffc400" : "#ff4757";

  // Header
  const titleOpacity = interpolate(frame, [0, 22], [0, 1], { extrapolateRight: "clamp" });
  const titleY = interpolate(frame, [0, 22], [18, 0], { extrapolateRight: "clamp" });

  // Score ring
  const scoreProgress = spring({ frame: frame - 8, fps, config: { damping: 14, stiffness: 60 } });
  const ringCircumference = 2 * Math.PI * 32;

  // Scan line (0 → 740px over first 70 frames)
  const scanY = interpolate(frame, [0, 70], [-4, 740], { extrapolateRight: "clamp" });
  const scanOpacity = interpolate(frame, [60, 70], [1, 0], { extrapolateRight: "clamp" });

  // Status cards
  const statusProgress = spring({ frame: frame - 52, fps, config: { damping: 16 } });
  const statusOpacity = interpolate(frame, [52, 66], [0, 1], { extrapolateRight: "clamp" });

  // Alert badge pulse
  const alertPulse = interpolate(Math.sin(frame * 0.14), [-1, 1], [0.65, 1]);

  // Narrative
  const narrativeOpacity = interpolate(frame, [85, 105], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{
      background: "linear-gradient(160deg,#06040f 0%,#0d0a1e 100%)",
      fontFamily: "'Courier New', monospace", padding: "48px 60px",
      color: "#f0ebff", overflow: "hidden"
    }}>
      {/* Background grid */}
      <div style={{
        position: "absolute", inset: 0, opacity: 0.025, pointerEvents: "none",
        backgroundImage: "linear-gradient(#b088ff 1px, transparent 1px), linear-gradient(90deg, #b088ff 1px, transparent 1px)",
        backgroundSize: "40px 40px"
      }} />

      {/* Scan line */}
      <div style={{
        position: "absolute", left: 0, top: scanY, width: "100%", height: 3,
        background: "linear-gradient(90deg, transparent, #b088ff20, #b088ffaa, #b088ff20, transparent)",
        opacity: scanOpacity, pointerEvents: "none"
      }} />

      {/* Header */}
      <div style={{ opacity: titleOpacity, transform: `translateY(${titleY}px)`, marginBottom: 34 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 11, color: "#b088ff", letterSpacing: "0.28em", marginBottom: 7 }}>
              ◈ NERHIA URBAN · {city.toUpperCase()}
            </div>
            <div style={{ fontSize: 42, fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
              Reporte Urbano
            </div>
            <div style={{ fontSize: 15, color: "rgba(240,235,255,.38)", marginTop: 7, letterSpacing: "0.04em" }}>
              {weekLabel}
            </div>
          </div>

          {/* Score ring */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ position: "relative", width: 80, height: 80 }}>
              <svg width="80" height="80" viewBox="0 0 80 80" style={{ position: "absolute", inset: 0 }}>
                <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(176,136,255,.12)" strokeWidth="4" />
                <circle cx="40" cy="40" r="32" fill="none" stroke="#b088ff" strokeWidth="4"
                  strokeDasharray={`${ringCircumference}`}
                  strokeDashoffset={`${ringCircumference * (1 - scoreProgress * avgScore / 100)}`}
                  strokeLinecap="round"
                  style={{ transform: "rotate(-90deg)", transformOrigin: "40px 40px" }}
                />
              </svg>
              <div style={{
                position: "absolute", inset: 0, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center"
              }}>
                <div style={{ fontSize: 19, fontWeight: 700, color: "#b088ff", lineHeight: 1 }}>
                  {Math.round(scoreProgress * avgScore)}
                </div>
              </div>
            </div>
            <div style={{ fontSize: 9, color: "rgba(240,235,255,.28)", marginTop: 5, letterSpacing: "0.12em" }}>
              ÍNDICE
            </div>
          </div>
        </div>
      </div>

      {/* Metric bars */}
      <div style={{ display: "flex", gap: 14, marginBottom: 34 }}>
        {metrics.map((m, i) => (
          <MetricBar key={m.label} {...m} delay={i * 6 + 14} frame={frame} fps={fps} />
        ))}
      </div>

      {/* PM10 + Status */}
      <div style={{
        display: "flex", gap: 14, marginBottom: 28,
        opacity: statusOpacity,
        transform: `translateX(${(1 - statusProgress) * -24}px)`
      }}>
        <div style={{
          padding: "10px 18px",
          border: `1px solid ${alertColor}35`,
          background: `${alertColor}07`, borderRadius: 3
        }}>
          <div style={{ fontSize: 9, color: "rgba(240,235,255,.38)", marginBottom: 3, letterSpacing: "0.14em" }}>PM10</div>
          <div style={{ fontSize: 25, fontWeight: 700, color: alertColor }}>{pm10} µg/m³</div>
        </div>
        <div style={{
          padding: "10px 18px",
          border: `1px solid ${alertColor}35`,
          background: `${alertColor}07`, borderRadius: 3,
          opacity: alerta !== "OK" ? alertPulse : 1
        }}>
          <div style={{ fontSize: 9, color: "rgba(240,235,255,.38)", marginBottom: 3, letterSpacing: "0.14em" }}>ESTADO</div>
          <div style={{ fontSize: 25, fontWeight: 700, color: alertColor }}>
            {alerta === "OK" ? "✓ " : alerta === "ALERTA" ? "⚠ " : "✕ "}{alerta}
          </div>
        </div>
      </div>

      {/* AI Narrative */}
      {narrative && (
        <div style={{
          opacity: narrativeOpacity,
          fontSize: 13, lineHeight: 1.8,
          color: "rgba(240,235,255,.68)",
          maxWidth: 820,
          borderLeft: "2px solid #b088ff45",
          paddingLeft: 18
        }}>
          <div style={{
            fontSize: 9, color: "#b088ff", letterSpacing: "0.22em",
            marginBottom: 8
          }}>◈ ANÁLISIS NERHIA</div>
          {narrative}
        </div>
      )}

      {/* Footer */}
      <div style={{
        position: "absolute", bottom: 34, right: 60,
        fontSize: 10, color: "rgba(240,235,255,.22)", letterSpacing: "0.18em"
      }}>
        VIBRAWORLD · NERHIA AI · VBC
      </div>
    </AbsoluteFill>
  );
};
