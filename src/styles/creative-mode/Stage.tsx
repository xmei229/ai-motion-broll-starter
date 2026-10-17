import { useCurrentFrame, useVideoConfig } from "remotion";
import { seeded } from "../../lib/random";
import type { Aspect, StageCard, StageItem } from "../../lib/types";
import { CardFrame } from "./CardFrame";
import { Label } from "./Label";
import { slam } from "./motion";
import { EXIT_SEC, compose, emphasisXf, enterXf, exitXf } from "./props/actions";
import { PROPS } from "./props";
import { COLORS, INK_STROKE, SHADOW } from "./tokens";

const TONE_FILL = {
  yellow: COLORS.yellow,
  accent: COLORS.accent,
  blue: COLORS.accent2,
  white: COLORS.surface,
  warn: COLORS.warn,
} as const;

const DEFAULT_SIZE = 300; // 以 1080 高為準

const Item: React.FC<{ item: StageItem; now: number }> = ({ item, now }) => {
  const { width, height } = useVideoConfig();
  const def = PROPS[item.prop];
  if (!def) throw new Error(`道具 ${item.prop} 沒有登記，見 props/index.ts`);

  const t = now - item.at;
  if (t < 0) return null;
  const exitAction = item.exit ? (item.exit.action ?? "popOut") : null;
  const te = item.exit ? now - item.exit.at : -1;
  if (exitAction && te > EXIT_SEC[exitAction]) return null;

  let xf = enterXf(item.enter ?? "pop", t, item.from);
  for (const e of item.emphasis ?? []) {
    xf = compose(xf, emphasisXf(e.action, now - e.at));
  }
  if (exitAction) xf = compose(xf, exitXf(exitAction, te));
  if (xf.sx === 0 || xf.sy === 0) return null;

  const size = (item.size ?? DEFAULT_SIZE) * (height / 1080);
  const sw = (INK_STROKE * 100) / size;
  const Draw = def.draw;
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      style={{
        position: "absolute",
        left: item.x * width - size / 2,
        top: item.y * height - size / 2,
        overflow: "visible",
        opacity: xf.o,
        filter: `drop-shadow(${SHADOW}px ${SHADOW}px 0 ${COLORS.ink})`,
        transform: `translate(${xf.x * size}px, ${xf.y * size}px) rotate(${xf.rot}deg) scale(${xf.sx}, ${xf.sy})`,
      }}
    >
      <Draw
        t={t}
        sw={sw}
        fill={TONE_FILL[item.tone ?? "yellow"]}
        options={item.options ?? {}}
        text={item.text}
      />
    </svg>
  );
};

// 道具場景卡：道具各自按秒數進場、強調、退場，貼紙用來下判定。
export const Stage: React.FC<{ card: StageCard; aspect: Aspect }> = ({
  card,
  aspect,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const now = frame / fps;
  const margin = aspect === "9:16" ? 48 : 96;
  return (
    <CardFrame title={card.title} margin={margin}>
      {card.items.map((item, i) => (
        <Item key={`${item.prop}-${i}`} item={item} now={now} />
      ))}
      {(card.stickers ?? []).map((s, i) => {
        const k = slam(now - s.at);
        if (k.x === 0) return null;
        return (
          <Label
            key={`${s.text}-${i}`}
            sticker={s}
            left={s.x}
            top={s.y}
            rot={(seeded(`stage-label-${i}`)() - 0.5) * 8}
            scale={k}
          />
        );
      })}
    </CardFrame>
  );
};
