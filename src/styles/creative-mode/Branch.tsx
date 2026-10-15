import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { seeded } from "../../lib/random";
import type { Aspect, BranchCard } from "../../lib/types";
import { CardFrame } from "./CardFrame";
import { useCardSec } from "./transitions";
import { clamp, pop, slam } from "./motion";
import { NoteBox } from "./NoteBox";
import { RootBox } from "./RootBox";
import {
  COLORS,
  FONT_CJK,
  FONT_DISPLAY,
  INK_STROKE,
  SHADOW,
} from "./tokens";

const ROOT_SEC = 0.4;
const FIRST_CHILD_SEC = 1.6;
const TAIL_SEC = 1.5; // 最後一個分支拍入後留給觀眾讀的時間
const DRAW_SEC = 0.35; // 連線從根畫到分支的時間；畫到底的那一刻分支拍入
const GAP = 40;

// 分支卡：左邊一個根，墨線一條一條畫到右邊的分支；每個分支在自己的時間拍入。
export const Branch: React.FC<{ card: BranchCard; aspect: Aspect }> = ({
  card,
  aspect,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const cardSec = useCardSec();
  const t = frame / fps;
  const vertical = aspect === "9:16";
  const n = Math.max(1, card.children.length);

  const margin = vertical ? 48 : 96;
  const areaTop = vertical ? 420 : 190;
  const areaH = height - areaTop - (vertical ? 220 : 70);
  const cy = areaTop + areaH / 2;
  const rootW = vertical ? 340 : 560;
  const rootH = vertical ? 260 : 360;
  const rootX = margin + 10;
  const childX = rootX + rootW + (vertical ? 150 : 320);
  const childW = width - margin - childX;
  const childH = Math.min(210, (areaH - GAP * (n - 1)) / n);
  const top = cy - (childH * n + GAP * (n - 1)) / 2;
  const tall = childH >= 150; // 夠高才把說明放到標題下面
  const titleSize = tall ? 76 : 46;
  const noteSize = tall ? 42 : 34;
  const disc = Math.min(124, childH - 56);

  const rootAt = card.root.at ?? ROOT_SEC;
  const span = cardSec - FIRST_CHILD_SEC - TAIL_SEC;
  const childAt = card.children.map(
    (c, i) => c.at ?? FIRST_CHILD_SEC + (span * i) / n,
  );
  // 每個節拍只有一個粉色重點：最新拍入的那個分支。
  const newest = childAt.reduce((k, at, i) => (t >= at ? i : k), -1);
  const x0 = rootX + rootW;

  return (
    <CardFrame title={card.title} margin={margin}>
      {/* 連線畫在最底層；pathLength=1 讓虛線位移直接等於畫出的比例 */}
      <svg
        width={width}
        height={height}
        style={{ position: "absolute", left: 0, top: 0 }}
      >
        {card.children.map((c, i) => {
          const y1 = top + (childH + GAP) * i + childH / 2;
          const drawn = interpolate(
            t,
            [childAt[i] - DRAW_SEC, childAt[i]],
            [0, 1],
            clamp,
          );
          if (drawn <= 0) return null;
          const bend = (childX - x0) * 0.55;
          return (
            <path
              key={c.title}
              d={`M ${x0} ${cy} C ${x0 + bend} ${cy}, ${childX - bend} ${y1}, ${childX} ${y1}`}
              fill="none"
              stroke={COLORS.ink}
              strokeWidth={INK_STROKE + 2}
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - drawn}
            />
          );
        })}
      </svg>

      <RootBox
        x={rootX}
        cy={cy}
        w={rootW}
        h={rootH}
        title={card.root.title}
        sub={card.root.sub}
        at={rootAt}
        subAt={card.root.subAt}
        vertical={vertical}
      />

      {card.children.map((c, i) => {
        const s = slam(t - childAt[i]);
        if (s.x === 0) return null;
        const rot = (seeded(`branch-${i}`)() - 0.5) * 3;
        const hot = i === newest;
        const warn = c.tone === "warn"; // 缺少的、代價：用警示色
        return (
          <div
            key={c.title}
            style={{
              position: "absolute",
              left: childX,
              top: top + (childH + GAP) * i,
              width: childW,
              height: childH,
              boxSizing: "border-box",
              display: "flex",
              alignItems: "center",
              gap: 36,
              padding: "0 40px",
              background: COLORS.surface,
              border: `${INK_STROKE}px solid ${COLORS.ink}`,
              boxShadow: `${SHADOW}px ${SHADOW}px 0 ${COLORS.ink}`,
              fontFamily: FONT_CJK,
              color: COLORS.ink,
              transformOrigin: "left center",
              transform: `rotate(${rot}deg) scale(${s.x}, ${s.y})`,
            }}
          >
            <div
              style={{
                flexShrink: 0,
                width: disc,
                height: disc,
                borderRadius: "50%",
                background: warn
                  ? COLORS.warn
                  : hot
                    ? COLORS.accent
                    : COLORS.ink,
                color: warn || hot ? COLORS.ink : COLORS.yellow,
                border: `${INK_STROKE - 2}px solid ${COLORS.ink}`,
                boxSizing: "border-box",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: FONT_DISPLAY,
                fontSize: disc * 0.62,
                lineHeight: 1,
              }}
            >
              {c.mark ?? i + 1}
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: tall ? "column" : "row",
                alignItems: tall ? "flex-start" : "baseline",
                gap: tall ? 6 : 24,
              }}
            >
              <div
                style={{ fontWeight: 900, fontSize: titleSize, lineHeight: 1.2 }}
              >
                {c.title}
              </div>
              {c.note ? (
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: noteSize,
                    lineHeight: 1.3,
                    color: COLORS.muted,
                    transformOrigin: "left center",
                    transform: `scale(${pop(t - childAt[i] - 0.25)})`,
                  }}
                >
                  {c.note}
                </div>
              ) : null}
            </div>
          </div>
        );
      })}

      {card.note ? (
        <NoteBox
          note={card.note}
          left={rootX}
          top={cy + rootH / 2 + 46}
          fontSize={38}
        />
      ) : null}
    </CardFrame>
  );
};
