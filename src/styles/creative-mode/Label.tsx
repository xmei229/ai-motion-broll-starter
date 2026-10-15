import type { CardSticker } from "../../lib/types";
import {
  COLORS,
  FONT_CJK,
  FONT_DISPLAY,
  INK_STROKE,
  SHADOW,
} from "./tokens";

const TONES = {
  yellow: { background: COLORS.yellow, color: COLORS.ink },
  accent: { background: COLORS.accent, color: COLORS.ink },
  ink: { background: COLORS.ink, color: COLORS.yellow },
  white: { background: COLORS.surface, color: COLORS.ink },
  warn: { background: COLORS.warn, color: COLORS.ink },
} as const;

// 一張貼紙字：以 (left, top) 為中心，rot 是傾斜角度，scale 是拍入動態算出來的縮放。
export const Label: React.FC<{
  sticker: CardSticker;
  left: number;
  top: number;
  rot: number;
  scale: { x: number; y: number };
}> = ({ sticker: s, left, top, rot, scale }) => (
  <div
    style={{
      position: "absolute",
      left,
      top,
      width: 0,
      height: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <div
      style={{
        ...TONES[s.tone ?? "yellow"],
        fontFamily: s.display ? FONT_DISPLAY : FONT_CJK,
        fontWeight: s.display ? 400 : 900,
        fontSize: s.size ?? 56,
        lineHeight: 1.2,
        letterSpacing: s.display ? "0.04em" : undefined,
        padding: s.display ? "0.1em 0.45em 0.02em" : "0.15em 0.5em",
        whiteSpace: "nowrap",
        border: `${INK_STROKE}px solid ${COLORS.ink}`,
        boxShadow: `${SHADOW}px ${SHADOW}px 0 ${COLORS.ink}`,
        transform: `rotate(${rot}deg) scale(${scale.x}, ${scale.y})`,
      }}
    >
      {s.text}
    </div>
  </div>
);
