import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

type Props = {
  uvx: number; mpi: number; cai: number; iei: number; uei: number;
  pm10: number; alerta: string; city: string; weekLabel: string;
  narrative: string;
};

export const NERHIAReport: React.FC<Props> = ({
  uvx=71, mpi=68, cai=65, iei=63, uei=74,
  pm10=45, alerta="OK", city="Buin", weekLabel="Semana 16", narrative=""
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const metrics = [
    { label:"UVX", value:uvx, color:"#b088ff" },
    { label:"MPI", value:mpi, color:"#00d4ff" },
    { label:"CAI", value:cai, color:"#9c88ff" },
    { label:"IEI", value:iei, color:"#ffc400" },
    { label:"UEI", value:uei, color:"#00e676" },
  ];

  const titleOpacity = interpolate(frame, [0, 20], [0, 1]);
  const alertColor = alerta === "OK" ? "#00e676" : alerta === "ALERTA" ? "#ffc400" : "#ff4757";

  return (
    <AbsoluteFill style={{
      background: "linear-gradient(160deg,#06040f 0%,#0d0a1e 100%)",
      fontFamily: "'Courier New', monospace", padding: 60, color: "#f0ebff"
    }}>
      {/* Header */}
      <div style={{ opacity: titleOpacity, marginBottom: 40 }}>
        <div style={{ fontSize: 14, color: "#b088ff", letterSpacing: "0.2em", marginBottom: 8 }}>
          NERHIA URBAN · {city.toUpperCase()}
        </div>
        <div style={{ fontSize: 48, fontWeight: 700, lineHeight: 1.1 }}>
          Reporte Urbano
        </div>
        <div style={{ fontSize: 20, color: "rgba(240,235,255,.5)", marginTop: 8 }}>
          {weekLabel} · {new Date().toLocaleDateString("es-CL")}
        </div>
      </div>

      {/* Metric bars */}
      <div style={{ display: "flex", gap: 16, marginBottom: 40 }}>
        {metrics.map((m, i) => {
          const barWidth = spring({ frame: frame - i * 4, fps, config: { damping: 12 } });
          return (
            <div key={m.label} style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: "rgba(240,235,255,.5)", marginBottom: 6,
                letterSpacing: "0.1em" }}>{m.label}</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: m.color, marginBottom: 8 }}>
                {m.value}
              </div>
              <div style={{ height: 3, background: "rgba(255,255,255,.1)", borderRadius: 2 }}>
                <div style={{ height: "100%", width: `${barWidth * m.value}%`,
                  background: m.color, borderRadius: 2, transition: "width .3s" }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* PM10 + Status */}
      <div style={{ display:"flex", gap:20, marginBottom:32 }}>
        <div style={{ padding:"12px 20px", border:`1px solid ${alertColor}40`,
          background:`${alertColor}10`, borderRadius:4 }}>
          <div style={{ fontSize:11, color:"rgba(240,235,255,.5)", marginBottom:4 }}>PM10</div>
          <div style={{ fontSize:28, fontWeight:700, color:alertColor }}>{pm10} µg/m³</div>
        </div>
        <div style={{ padding:"12px 20px", border:`1px solid ${alertColor}40`,
          background:`${alertColor}10`, borderRadius:4 }}>
          <div style={{ fontSize:11, color:"rgba(240,235,255,.5)", marginBottom:4 }}>ESTADO</div>
          <div style={{ fontSize:28, fontWeight:700, color:alertColor }}>{alerta}</div>
        </div>
      </div>

      {/* AI Narrative */}
      {narrative && (
        <div style={{ fontSize:14, lineHeight:1.7, color:"rgba(240,235,255,.7)",
          maxWidth:800, borderLeft:"2px solid #b088ff40", paddingLeft:20 }}>
          {narrative}
        </div>
      )}

      {/* Footer */}
      <div style={{ position:"absolute", bottom:40, right:60,
        fontSize:11, color:"rgba(240,235,255,.3)", letterSpacing:"0.15em" }}>
        VIBRAWORLD · NERHIA AI · VBC
      </div>
    </AbsoluteFill>
  );
};
