import { Composition } from "remotion";
import { NERHIAReport } from "./compositions/NERHIAReport";

export const Root = () => (
  <>
    <Composition
      id="NERHIAReport"
      component={NERHIAReport}
      durationInFrames={270}
      fps={30}
      width={1280}
      height={720}
      defaultProps={{
        uvx: 71, mpi: 68, cai: 65, iei: 63, uei: 74,
        pm10: 45, alerta: "OK", city: "Buin",
        weekLabel: "Semana 16", narrative: ""
      }}
    />
  </>
);
