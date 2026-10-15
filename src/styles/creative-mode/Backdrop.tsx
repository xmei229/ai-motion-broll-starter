import { AbsoluteFill } from "remotion";
import { COLORS } from "./tokens";

// 奶油色方格紙底。靜態圖樣；dot 是這一張的格線色。
export const Backdrop: React.FC<{ dot: string }> = ({ dot }) => (
  <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
    <AbsoluteFill
      style={{
        backgroundImage: `linear-gradient(${dot}22 2px, transparent 2px), linear-gradient(90deg, ${dot}22 2px, transparent 2px)`,
        backgroundSize: "64px 64px",
      }}
    />
  </AbsoluteFill>
);
