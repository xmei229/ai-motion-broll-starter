import { useCurrentFrame, useVideoConfig } from "remotion";
import { pop, slam } from "./motion";
import { COLORS, FONT_CJK, INK_STROKE, SHADOW, SIZE } from "./tokens";

// 分支卡與標籤卡左邊的根：黃色大框，at 秒拍入；副標可以晚一點才出現。
export const RootBox: React.FC<{
  x: number;
  cy: number;
  w: number;
  h: number;
  title: string;
  sub?: string;
  at: number;
  subAt?: number;
  vertical: boolean;
}> = ({ x, cy, w, h, title, sub, at, subAt, vertical }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const root = slam(t - at);

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: cy - h / 2,
        width: w,
        height: h,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        background: COLORS.yellow,
        border: `${INK_STROKE + 2}px solid ${COLORS.ink}`,
        boxShadow: `${SHADOW + 4}px ${SHADOW + 4}px 0 ${COLORS.ink}`,
        fontFamily: FONT_CJK,
        color: COLORS.ink,
        transform: `rotate(-2deg) scale(${root.x}, ${root.y})`,
      }}
    >
      <div
        style={{
          fontWeight: 900,
          fontSize: vertical ? SIZE.h1 : 108,
          lineHeight: 1.15,
        }}
      >
        {title}
      </div>
      {sub ? (
        <div
          style={{
            fontWeight: 900,
            fontSize: 40,
            transform:
              subAt === undefined ? undefined : `scale(${pop(t - subAt)})`,
          }}
        >
          {sub}
        </div>
      ) : null}
    </div>
  );
};
