import { COLORS } from "../tokens";
import type { PropDef, PropDrawProps } from "./types";

// 麥克風。零件：收音頭、網格、支架弧、立桿、底座、聲波。
// 持續動畫：進場 0.25 秒後，兩側各三道聲波輪流向外擴散淡出，每圈 0.67 秒。
const WAVE_START = 0.25;
const WAVE_CYCLE_SEC = 0.67;

// 以 (50, 31) 為圓心的一道弧，side 是左右，r 是半徑，張角正負 42°。
const arc = (side: 1 | -1, r: number): string => {
  const a = (42 * Math.PI) / 180;
  const cx = 50;
  const cy = 31;
  const x1 = cx + side * r * Math.cos(a);
  const y1 = cy - r * Math.sin(a);
  const y2 = cy + r * Math.sin(a);
  return `M${x1} ${y1} A${r} ${r} 0 0 ${side === 1 ? 1 : 0} ${x1} ${y2}`;
};

const Draw: React.FC<PropDrawProps> = ({ t, sw, fill }) => {
  const waves = [0, 1, 2].map((k) => {
    const phase = ((((t - WAVE_START) / WAVE_CYCLE_SEC + k / 3) % 1) + 1) % 1;
    return { r: 34 + phase * 16, o: t < WAVE_START ? 0 : 1 - phase };
  });
  return (
    <g strokeLinecap="round" strokeLinejoin="round">
      {waves.map((w, i) => (
        <g key={i} opacity={w.o} fill="none" stroke={COLORS.ink} strokeWidth={sw}>
          <path d={arc(1, w.r)} />
          <path d={arc(-1, w.r)} />
        </g>
      ))}
      <path
        d="M29 42 C29 70 71 70 71 42"
        fill="none"
        stroke={COLORS.ink}
        strokeWidth={sw}
      />
      <line x1={50} y1={66} x2={50} y2={84} stroke={COLORS.ink} strokeWidth={sw} />
      <rect x={30} y={84} width={40} height={9} rx={3} fill={COLORS.ink} />
      <rect
        x={36}
        y={6}
        width={28}
        height={50}
        rx={14}
        fill={fill}
        stroke={COLORS.ink}
        strokeWidth={sw}
      />
      {[20, 29, 38].map((y) => (
        <line
          key={y}
          x1={41}
          y1={y}
          x2={59}
          y2={y}
          stroke={COLORS.ink}
          strokeWidth={sw * 0.7}
        />
      ))}
    </g>
  );
};

export const Mic: PropDef = {
  name: "麥克風",
  parts: ["收音頭", "網格", "支架弧", "立桿", "底座", "聲波"],
  tones: ["yellow", "accent", "blue", "white"],
  options: {},
  continuous: "聲波：進場 0.25 秒後兩側各三道輪流向外擴散淡出，每圈 0.67 秒",
  draw: Draw,
};
