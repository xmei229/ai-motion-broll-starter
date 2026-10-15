import { Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { seeded } from "../../lib/random";
import type { Aspect, MemeCard } from "../../lib/types";
import { CardFrame } from "./CardFrame";
import { Label } from "./Label";
import { slam } from "./motion";
import { COLORS, FONT_CJK, INK_STROKE, SHADOW } from "./tokens";

const GAP = 28;

// 梗圖卡：上下幾格，每格左邊是一張反應圖（從同一張圖裁出來），右邊是被唸到才拍入的項目。
// 判定貼紙蓋在右邊的格子上，x、y 是格內 0 到 1 的位置。
export const Meme: React.FC<{ card: MemeCard; aspect: Aspect }> = ({
  card,
  aspect,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const vertical = aspect === "9:16";
  const n = Math.max(1, card.panels.length);

  const margin = vertical ? 48 : 96;
  const areaTop = vertical ? 300 : 172;
  const areaH = height - areaTop - 60;
  const rowH = (areaH - GAP * (n - 1)) / n;
  const photoW = vertical ? 320 : rowH; // 反應圖是正方形
  const textX = margin + photoW;
  const textW = width - margin - textX;

  // 每個節拍只有一個粉色重點：全卡最新拍入的那個項目。
  const newest = card.panels.reduce(
    (best, p, pi) =>
      p.items.reduce(
        (b, it, i) =>
          t >= it.at && it.at >= b.at ? { panel: pi, item: i, at: it.at } : b,
        best,
      ),
    { panel: -1, item: -1, at: -Infinity },
  );

  return (
    <CardFrame title={card.title} margin={margin}>
      {card.panels.map((p, pi) => {
        const k = slam(t - p.at);
        if (k.x === 0) return null;
        const top = areaTop + (rowH + GAP) * pi;
        const [cx, cy, cw, ch] = p.crop;
        const zoom = Math.max(photoW / cw, rowH / ch);
        return (
          <div key={pi}>
            <div
              style={{
                position: "absolute",
                left: margin,
                top,
                width: photoW + textW,
                height: rowH,
                boxSizing: "border-box",
                display: "flex",
                background: COLORS.surface,
                border: `${INK_STROKE}px solid ${COLORS.ink}`,
                boxShadow: `${SHADOW}px ${SHADOW}px 0 ${COLORS.ink}`,
                transformOrigin: "left center",
                transform: `scale(${k.x}, ${k.y})`,
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: photoW,
                  flexShrink: 0,
                  overflow: "hidden",
                  borderRight: `${INK_STROKE}px solid ${COLORS.ink}`,
                }}
              >
                <Img
                  src={staticFile(card.src)}
                  style={{
                    position: "absolute",
                    left: -cx * zoom,
                    top: -cy * zoom,
                    width: card.size[0] * zoom,
                    height: card.size[1] * zoom,
                    maxWidth: "none",
                  }}
                />
              </div>
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  alignContent: "center",
                  justifyContent: p.align === "left" ? "flex-start" : "center",
                  gap: "26px 30px",
                  padding: "0 44px",
                }}
              >
                {p.items.map((it, i) => {
                  const s = slam(t - it.at);
                  const hot = newest.panel === pi && newest.item === i;
                  const rot = (seeded(`meme-${pi}-${i}`)() - 0.5) * 6;
                  return (
                    <div
                      key={it.text}
                      style={{
                        // 還沒唸到的項目先佔位置，其他項目才不會在它出現時被擠開
                        visibility: s.x === 0 ? "hidden" : "visible",
                        background: hot ? COLORS.accent : COLORS.yellow,
                        color: COLORS.ink,
                        fontFamily: FONT_CJK,
                        fontWeight: 900,
                        fontSize: vertical ? 38 : 54,
                        lineHeight: 1.2,
                        padding: "0.15em 0.5em",
                        whiteSpace: "nowrap",
                        border: `${INK_STROKE}px solid ${COLORS.ink}`,
                        boxShadow: `${SHADOW}px ${SHADOW}px 0 ${COLORS.ink}`,
                        transform: `rotate(${rot}deg) scale(${s.x || 1}, ${s.y || 1})`,
                      }}
                    >
                      {it.text}
                    </div>
                  );
                })}
              </div>
            </div>

            {(p.stamps ?? []).map((st, i) => {
              const s = slam(t - st.at);
              if (s.x === 0) return null;
              return (
                <Label
                  key={st.text}
                  sticker={st}
                  left={textX + textW * st.x}
                  top={top + rowH * st.y}
                  rot={(seeded(`meme-stamp-${pi}-${i}`)() - 0.5) * 16}
                  scale={s}
                />
              );
            })}
          </div>
        );
      })}
    </CardFrame>
  );
};
