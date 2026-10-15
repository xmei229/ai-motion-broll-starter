import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { seeded } from "../../lib/random";
import { COLORS, FONT_CJK, INK_STROKE, SHADOW } from "./tokens";

const SLAM_SEC = 0.16; // 落下
const SETTLE_SEC = 0.3; // 壓扁回彈完成
const EXIT_SEC = 0.2; // 縮小消失

// 貼紙拍入：at 幀開始，從大縮放加旋轉落下，壓扁後回彈；hold 幀後縮小消失。
// 全程只依 frame 計算；旋轉角度由 seedKey 決定，同一貼紙每次渲染相同。
export const Sticker: React.FC<{
  text: string;
  at: number;
  holdFrames: number;
  seedKey: string | number;
  fontSize: number;
  background?: string;
  color?: string;
}> = ({
  text,
  at,
  holdFrames,
  seedKey,
  fontSize,
  background = COLORS.yellow,
  color = COLORS.ink,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = (frame - at) / fps;
  const exitStart = holdFrames / fps;
  if (t < 0 || t > exitStart + EXIT_SEC) return null;

  const rng = seeded(seedKey);
  const finalRot = (rng() < 0.5 ? -1 : 1) * (3 + rng() * 4); // 3–7°
  const startRot = finalRot + (rng() < 0.5 ? -1 : 1) * 25;

  const slamScale = interpolate(
    t,
    [0, SLAM_SEC, SLAM_SEC + 0.06, SETTLE_SEC],
    [3, 0.88, 1.06, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const rot = interpolate(t, [0, SLAM_SEC], [startRot, finalRot], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const exitScale = interpolate(t, [exitStart, exitStart + EXIT_SEC], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  // 落地瞬間壓扁：縱向略小於橫向，回彈後回到 1。
  const squash = interpolate(
    t,
    [SLAM_SEC, SLAM_SEC + 0.06, SETTLE_SEC],
    [0.85, 1.05, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <div
      style={{
        display: "inline-block",
        background,
        color,
        fontFamily: FONT_CJK,
        fontWeight: 900,
        fontSize,
        lineHeight: 1.2,
        padding: "0.2em 0.6em",
        border: `${INK_STROKE}px solid ${COLORS.ink}`,
        boxShadow: `${SHADOW}px ${SHADOW}px 0 ${COLORS.ink}`,
        transform: `rotate(${rot}deg) scale(${slamScale * exitScale}, ${
          slamScale * exitScale * squash
        })`,
      }}
    >
      {text}
    </div>
  );
};
