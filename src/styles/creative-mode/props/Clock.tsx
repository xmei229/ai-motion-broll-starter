import { COLORS } from "../tokens";
import type { PropDef, PropDrawProps } from "./types";

// 鬧鐘造型的時鐘。零件：兩個鐘耳、錶面、刻度、時針、分針、中心點。
// 持續動畫：分針與時針依進場後的時間走，兩根的角度由同一個分鐘數算出，不會各走各的。
// options：
//   startHour     起始的時，預設 10
//   startMinute   起始的分，預設 10
//   minutesPerSec 每秒走幾分鐘，預設 20（3 秒走滿一小時）；0 就是停住
const Draw: React.FC<PropDrawProps> = ({ t, sw, fill, options }) => {
  const startHour = options.startHour ?? 10;
  const startMinute = options.startMinute ?? 10;
  const mps = options.minutesPerSec ?? 20;
  const minutes = startHour * 60 + startMinute + t * mps;
  const minuteAngle = (minutes % 60) * 6; // 一分鐘 6°
  const hourAngle = (minutes % 720) * 0.5; // 一分鐘 0.5°
  return (
    <g strokeLinecap="round" strokeLinejoin="round">
      <circle cx={22} cy={20} r={10} fill={fill} stroke={COLORS.ink} strokeWidth={sw} />
      <circle cx={78} cy={20} r={10} fill={fill} stroke={COLORS.ink} strokeWidth={sw} />
      <circle cx={50} cy={54} r={38} fill={COLORS.surface} stroke={COLORS.ink} strokeWidth={sw} />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i * 30 * Math.PI) / 180;
        const big = i % 3 === 0;
        const r1 = big ? 27 : 30;
        const r2 = 34;
        return (
          <line
            key={i}
            x1={50 + r1 * Math.sin(a)}
            y1={54 - r1 * Math.cos(a)}
            x2={50 + r2 * Math.sin(a)}
            y2={54 - r2 * Math.cos(a)}
            stroke={COLORS.ink}
            strokeWidth={big ? sw : sw * 0.6}
          />
        );
      })}
      <line
        x1={50}
        y1={54}
        x2={50}
        y2={36}
        stroke={COLORS.ink}
        strokeWidth={sw * 1.3}
        transform={`rotate(${hourAngle} 50 54)`}
      />
      <line
        x1={50}
        y1={54}
        x2={50}
        y2={26}
        stroke={COLORS.accent2}
        strokeWidth={sw}
        transform={`rotate(${minuteAngle} 50 54)`}
      />
      <circle cx={50} cy={54} r={3.5} fill={COLORS.ink} />
    </g>
  );
};

export const Clock: PropDef = {
  name: "時鐘",
  parts: ["鐘耳", "錶面", "刻度", "時針", "分針", "中心點"],
  tones: ["yellow", "accent", "blue"],
  options: {
    startHour: "起始的時，預設 10",
    startMinute: "起始的分，預設 10",
    minutesPerSec: "每秒走幾分鐘，預設 20；0 停住",
  },
  continuous: "時針與分針依進場後的時間走，由同一個分鐘數算出角度",
  draw: Draw,
};
