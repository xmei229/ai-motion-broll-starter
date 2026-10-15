import { useCurrentFrame, useVideoConfig } from "remotion";
import type { CardNote } from "../../lib/types";
import { pop } from "./motion";
import { COLORS, FONT_CJK, INK_STROKE, SHADOW } from "./tokens";

// 旁白框：黃底（或警示色）的說明框，前面可帶一個黑底小標。放在動作留下的空處。
// 靠左就給 left，靠右就給 right；文字裡的換行字元是指定的斷行位置。
export const NoteBox: React.FC<{
  note: CardNote;
  top: number;
  left?: number;
  right?: number;
  fontSize: number;
}> = ({ note, top, left, right, fontSize }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  if (t < note.at) return null;

  return (
    <div
      style={{
        position: "absolute",
        left,
        right,
        top,
        display: "flex",
        alignItems: "center",
        gap: 20,
        padding: "14px 28px 14px 14px",
        background: note.tone === "warn" ? COLORS.warn : COLORS.yellow,
        border: `${INK_STROKE}px solid ${COLORS.ink}`,
        boxShadow: `${SHADOW}px ${SHADOW}px 0 ${COLORS.ink}`,
        fontFamily: FONT_CJK,
        fontWeight: 900,
        fontSize,
        lineHeight: 1.3,
        color: COLORS.ink,
        whiteSpace: "pre-line",
        transformOrigin: right === undefined ? "left center" : "right center",
        transform: `scale(${pop(t - note.at)})`,
      }}
    >
      {note.tag ? (
        <span
          style={{
            background: COLORS.ink,
            color: COLORS.yellow,
            fontSize: 32,
            padding: "4px 16px",
            whiteSpace: "nowrap",
          }}
        >
          {note.tag}
        </span>
      ) : null}
      {note.text}
    </div>
  );
};
