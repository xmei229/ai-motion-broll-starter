import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { CardLead } from "../../lib/types";
import { clamp, pop, slam } from "./motion";
import { COLORS, FONT_CJK, INK_STROKE, SHADOW } from "./tokens";

// 開場主題：一個黃色大框先獨佔畫面，until 秒縮小退場，把畫面讓給卡片本體。
export const Lead: React.FC<{ lead: CardLead; cx: number; cy: number }> = ({
  lead,
  cx,
  cy,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const enter = slam(t - (lead.at ?? 0.5));
  const exit = interpolate(t, [lead.until - 0.2, lead.until], [1, 0], clamp);
  if (enter.x * exit <= 0) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: cx - 400,
        top: cy - 210,
        width: 800,
        height: 420,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        background: COLORS.yellow,
        border: `${INK_STROKE + 2}px solid ${COLORS.ink}`,
        boxShadow: `${SHADOW + 4}px ${SHADOW + 4}px 0 ${COLORS.ink}`,
        fontFamily: FONT_CJK,
        fontWeight: 900,
        color: COLORS.ink,
        transform: `rotate(-2deg) scale(${enter.x * exit}, ${enter.y * exit})`,
      }}
    >
      <div style={{ fontSize: 150, lineHeight: 1.15 }}>{lead.title}</div>
      {lead.sub ? (
        <div
          style={{
            fontSize: 56,
            transform:
              lead.subAt === undefined
                ? undefined
                : `scale(${pop(t - lead.subAt)})`,
          }}
        >
          {lead.sub}
        </div>
      ) : null}
    </div>
  );
};
