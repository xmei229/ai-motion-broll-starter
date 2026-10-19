import type { Aspect, SlotCard } from "../../lib/types";
import { CardFrame } from "./CardFrame";
import { COLORS, FONT_CJK, INK_STROKE, SHADOW } from "./tokens";

// 段落卡佔位：虛線框加段落名稱，表示「這裡後製時放段落卡片」。靜態畫面，沒有動作。
export const Slot: React.FC<{ card: SlotCard; aspect: Aspect }> = ({
  card,
  aspect,
}) => {
  const vertical = aspect === "9:16";
  const margin = vertical ? 48 : 96;
  const top = vertical ? 300 : 172;
  return (
    <CardFrame title={card.title} margin={margin}>
      <div
        style={{
          position: "absolute",
          left: margin,
          right: margin,
          top,
          bottom: margin,
          border: `${INK_STROKE}px dashed ${COLORS.ink}`,
          background: COLORS.surface,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 28,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: FONT_CJK,
            fontWeight: 900,
            fontSize: vertical ? 72 : 110,
            color: COLORS.ink,
            background: COLORS.accent,
            border: `${INK_STROKE}px solid ${COLORS.ink}`,
            boxShadow: `${SHADOW}px ${SHADOW}px 0 ${COLORS.ink}`,
            padding: "0.1em 0.5em",
          }}
        >
          {card.label}
        </div>
        <div style={{ fontFamily: FONT_CJK, fontWeight: 700, fontSize: 34, color: COLORS.muted }}>
          此處後製時放段落卡片
          {card.timecode ? `  ${card.timecode}` : ""}
        </div>
      </div>
    </CardFrame>
  );
};
