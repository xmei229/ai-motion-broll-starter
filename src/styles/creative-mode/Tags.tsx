import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { seeded } from "../../lib/random";
import type { Aspect, TagsCard } from "../../lib/types";
import { CardFrame } from "./CardFrame";
import { useCardSec } from "./transitions";
import { clamp, pop, slam } from "./motion";
import { RootBox } from "./RootBox";
import {
  COLORS,
  FONT_CJK,
  FONT_DISPLAY,
  INK_STROKE,
  SHADOW,
} from "./tokens";

const ROOT_SEC = 0.4;
const FIRST_TAG_SEC = 1.8;
const TAIL_SEC = 1.5; // 最後一張貼紙拍入後留給觀眾讀的時間
const DRAW_SEC = 0.3; // 連線從根畫到面板的時間
const PANEL_LEAD_SEC = 0.5; // 面板比第一張貼紙早到多久
const COLS = 2;

// 標籤卡：左邊一個根，連到右邊一塊面板；面板裡的術語一張一張以貼紙拍入。
// 術語用 Bangers 當貼紙字（Creative Mode：真實術語是寫出來的字，不用等寬體）。
export const Tags: React.FC<{ card: TagsCard; aspect: Aspect }> = ({
  card,
  aspect,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const cardSec = useCardSec();
  const t = frame / fps;
  const vertical = aspect === "9:16";
  const n = Math.max(1, card.tags.length);
  const rows = Math.ceil(n / COLS);

  const margin = vertical ? 48 : 96;
  const areaTop = vertical ? 420 : 190;
  const areaH = height - areaTop - (vertical ? 220 : 70);
  const cy = areaTop + areaH / 2;
  const rootW = vertical ? 340 : 560;
  const rootH = vertical ? 260 : 360;
  const rootX = margin + 10;
  const panelX = rootX + rootW + (vertical ? 90 : 190);
  const panelW = width - margin - panelX;
  const panelTop = areaTop + 10;
  const panelH = areaH - 20;
  const cellW = panelW / COLS;
  const cellH = panelH / rows;
  const tagSize = Math.min(vertical ? 64 : 108, cellH * 0.42);

  const span = cardSec - FIRST_TAG_SEC - TAIL_SEC;
  const tagAt = card.tags.map(
    (g, i) => g.at ?? FIRST_TAG_SEC + (span * i) / n,
  );
  const panelAt = Math.min(...tagAt) - PANEL_LEAD_SEC;
  // 每個節拍只有一個粉色重點：最新拍入的那張貼紙。
  const newest = tagAt.reduce((k, at, i) => (t >= at ? i : k), -1);
  const panel = slam(t - panelAt);
  const drawn = interpolate(t, [panelAt - DRAW_SEC, panelAt], [0, 1], clamp);
  const x0 = rootX + rootW;

  return (
    <CardFrame title={card.title} margin={margin}>
      {drawn > 0 ? (
        <div
          style={{
            position: "absolute",
            left: x0,
            top: cy - (INK_STROKE + 4) / 2,
            width: (panelX - x0) * drawn,
            height: INK_STROKE + 4,
            background: COLORS.ink,
          }}
        />
      ) : null}

      <RootBox
        x={rootX}
        cy={cy}
        w={rootW}
        h={rootH}
        title={card.root.title}
        sub={card.root.sub}
        at={card.root.at ?? ROOT_SEC}
        subAt={card.root.subAt}
        vertical={vertical}
      />

      {panel.x > 0 ? (
        <div
          style={{
            position: "absolute",
            left: panelX,
            top: panelTop,
            width: panelW,
            height: panelH,
            boxSizing: "border-box",
            background: COLORS.surface,
            border: `${INK_STROKE}px solid ${COLORS.ink}`,
            boxShadow: `${SHADOW}px ${SHADOW}px 0 ${COLORS.ink}`,
            transformOrigin: "left center",
            transform: `scale(${panel.x}, ${panel.y})`,
          }}
        />
      ) : null}

      {card.tags.map((g, i) => {
        const k = slam(t - tagAt[i]);
        if (k.x === 0) return null;
        const rng = seeded(`tag-${i}`);
        const rot = (rng() - 0.5) * 10;
        const hot = i === newest;
        return (
          <div
            key={g.text}
            style={{
              position: "absolute",
              left: panelX + cellW * (i % COLS),
              top: panelTop + cellH * Math.floor(i / COLS),
              width: cellW,
              height: cellH,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                background: hot
                  ? COLORS.accent
                  : i % 2
                    ? COLORS.surface
                    : COLORS.yellow,
                color: COLORS.ink,
                fontFamily: FONT_DISPLAY,
                fontSize: tagSize,
                lineHeight: 1.1,
                letterSpacing: "0.03em",
                padding: "0.12em 0.42em 0.06em",
                whiteSpace: "nowrap",
                border: `${INK_STROKE}px solid ${COLORS.ink}`,
                boxShadow: `${SHADOW}px ${SHADOW}px 0 ${COLORS.ink}`,
                transform: `rotate(${rot}deg) scale(${k.x}, ${k.y})`,
              }}
            >
              {g.text}
            </div>
          </div>
        );
      })}

      {/* 面板的名字：壓在面板左上角 */}
      {card.panel && t >= card.panel.at ? (
        <div
          style={{
            position: "absolute",
            left: panelX + 36,
            top: panelTop - 34,
            background: COLORS.ink,
            color: COLORS.yellow,
            fontFamily: FONT_CJK,
            fontWeight: 900,
            fontSize: 44,
            lineHeight: 1.2,
            padding: "0.12em 0.5em",
            transformOrigin: "left center",
            transform: `rotate(-2deg) scale(${pop(t - card.panel.at)})`,
          }}
        >
          {card.panel.text}
        </div>
      ) : null}
    </CardFrame>
  );
};
