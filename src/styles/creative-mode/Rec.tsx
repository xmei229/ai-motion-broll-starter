import type { Aspect, RecCard } from "../../lib/types";
import { CardFrame } from "./CardFrame";
import { COLORS, FONT_CJK, FONT_DISPLAY, INK_STROKE, SHADOW } from "./tokens";

// 錄屏佔位卡：斜紋框加大字的編號與說明，表示「這一段後製時蓋上螢幕錄影」。
// 靜態畫面，沒有動作；進退場由 CardFrame 的轉場負責。
export const Rec: React.FC<{ card: RecCard; aspect: Aspect }> = ({
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
          boxShadow: `${SHADOW}px ${SHADOW}px 0 ${COLORS.ink}`,
          backgroundImage: `repeating-linear-gradient(45deg, ${COLORS.surface} 0, ${COLORS.surface} 28px, ${COLORS.bg} 28px, ${COLORS.bg} 56px)`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 28,
          textAlign: "center",
          padding: 48,
        }}
      >
        <div
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: vertical ? 96 : 150,
            lineHeight: 1,
            color: COLORS.ink,
            background: COLORS.yellow,
            border: `${INK_STROKE}px solid ${COLORS.ink}`,
            boxShadow: `${SHADOW}px ${SHADOW}px 0 ${COLORS.ink}`,
            padding: "0.12em 0.4em",
          }}
        >
          {card.id.toUpperCase()}
        </div>
        {card.note ? (
          <div
            style={{
              fontFamily: FONT_CJK,
              fontWeight: 900,
              fontSize: vertical ? 44 : 56,
              color: COLORS.ink,
              maxWidth: "80%",
            }}
          >
            {card.note}
          </div>
        ) : null}
        <div
          style={{
            fontFamily: FONT_CJK,
            fontWeight: 700,
            fontSize: 34,
            color: COLORS.muted,
          }}
        >
          此處後製時放螢幕錄影
          {card.timecode ? `  ${card.timecode}` : ""}
        </div>
      </div>
    </CardFrame>
  );
};
