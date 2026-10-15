import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { Backdrop } from "./Backdrop";
import { COLORS, FONT_CJK, INK_STROKE, SHADOW, SIZE } from "./tokens";
import {
  CoverLayer,
  contentShift,
  useCardSec,
  useTransition,
  useTransitionPhase,
} from "./transitions";

const PUSH = 0.025; // 全片慢速推近

// 每張 Tutorial 卡共用的外框：漫畫紙底、左上角卡片名、慢速推近、開場與結尾的轉場。
export const CardFrame: React.FC<{
  title: string;
  margin: number;
  intro?: boolean; // false：接續上一張卡，不做開場轉場，推近也從上一張停下的地方接著走
  children: React.ReactNode;
}> = ({ title, margin, intro = true, children }) => {
  const frame = useCurrentFrame();
  const { width, fps } = useVideoConfig();
  const cardSec = useCardSec();
  const setting = useTransition();
  const introName = intro ? setting.intro : "none";
  const { inP, outP } = useTransitionPhase(
    introName,
    setting.outro,
    setting.totalSec,
  );
  const shift = contentShift(introName, setting.outro, inP, outP, width);
  const push =
    1 +
    PUSH *
      ((intro ? 0 : 1) +
        frame /
          Math.max(
            1,
            Math.round(cardSec * fps) - 1,
          ));

  return (
    <AbsoluteFill>
      <Backdrop dot={COLORS.accent2} />
      <AbsoluteFill
        style={{
          transform: `translateX(${shift}px) scale(${push})`,
        }}
      >
        <div
          style={{
            position: "absolute",
            zIndex: 1, // 卡片名永遠壓在卡片內容上面
            top: margin - 24,
            left: margin,
            background: COLORS.yellow,
            border: `${INK_STROKE}px solid ${COLORS.ink}`,
            boxShadow: `${SHADOW}px ${SHADOW}px 0 ${COLORS.ink}`,
            padding: "8px 24px",
            fontFamily: FONT_CJK,
            fontWeight: 900,
            fontSize: SIZE.chapterTag,
            color: COLORS.ink,
          }}
        >
          {title}
        </div>
        {children}
      </AbsoluteFill>

      <CoverLayer
        name={introName}
        phase="in"
        progress={inP}
        anchor={setting.anchorIn ?? setting.anchor}
      />
      <CoverLayer name={setting.outro} phase="out" progress={outP} anchor={setting.anchor} />
    </AbsoluteFill>
  );
};
