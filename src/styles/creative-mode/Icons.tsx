import { useEffect, useState } from "react";
import {
  cancelRender,
  continueRender,
  delayRender,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { seeded } from "../../lib/random";
import type { Aspect, IconsCard } from "../../lib/types";
import { CardFrame } from "./CardFrame";
import { Label } from "./Label";
import { slam } from "./motion";

const FIRST_SEC = 0.8;
const GAP_SEC = 0.22;
const SHAKE_SEC = 0.3;
const SHAKE_PX = 12; // Creative Mode：震動只給真實的衝擊，不超過 14 px、0.32 秒

// 圖示表的資料檔：由 SVG 拆出來的一個個圖示，共用一份樣式與裁切定義。
type Sheet = {
  viewBox: [number, number, number, number];
  css: string;
  defs: string;
  icons: { name: string; box: [number, number, number, number]; html: string }[];
};

// 圖示卡：一組圖示照原圖的相對位置繞著畫面拍入，中間留給貼紙下判定。
// 貼紙的 x、y 是畫面上的像素座標。
export const Icons: React.FC<{ card: IconsCard; aspect: Aspect }> = ({
  card,
  aspect,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const vertical = aspect === "9:16";
  const margin = vertical ? 48 : 96;

  const [handle] = useState(() => delayRender(`Loading ${card.src}`));
  const [sheet, setSheet] = useState<Sheet | null>(null);
  useEffect(() => {
    fetch(staticFile(card.src))
      .then((res) => res.json())
      .then((json) => {
        setSheet(json);
        continueRender(handle);
      })
      .catch((err) => cancelRender(err));
  }, [handle, card.src]);

  const first = card.firstAt ?? FIRST_SEC;
  const gap = card.gap ?? GAP_SEC;
  const unit = card.scale ?? 2.5; // 原圖一個單位畫成幾個像素
  const areaTop = vertical ? 300 : 170;
  const areaH = height - areaTop - 110;
  const areaW = width - margin * 2 - 80;

  // 判定貼紙拍下的那一刻，整組圖示被震一下：有種子、衰減、逐幀量化。
  const since = card.shakeAt === undefined ? -1 : t - card.shakeAt;
  const amp =
    since >= 0 && since < SHAKE_SEC ? SHAKE_PX * (1 - since / SHAKE_SEC) : 0;
  const rng = seeded(`shake-${frame}`);
  const shake = amp ? [(rng() - 0.5) * 2 * amp, (rng() - 0.5) * 2 * amp] : [0, 0];

  return (
    <CardFrame title={card.title} margin={margin}>
      {sheet ? (
        <>
          <style dangerouslySetInnerHTML={{ __html: sheet.css }} />
          <svg width={0} height={0} style={{ position: "absolute" }}>
            <defs dangerouslySetInnerHTML={{ __html: sheet.defs }} />
          </svg>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              transform: `translate(${shake[0]}px, ${shake[1]}px)`,
            }}
          >
            {sheet.icons.map((icon, i) => {
              const k = slam(t - first - gap * i);
              if (k.x === 0) return null;
              const [x, y, w, h] = icon.box;
              const rot = (seeded(`icon-${i}`)() - 0.5) * 6;
              return (
                <svg
                  key={icon.name}
                  viewBox={icon.box.join(" ")}
                  width={w * unit}
                  height={h * unit}
                  style={{
                    position: "absolute",
                    left:
                      margin +
                      40 +
                      ((x + w / 2) / sheet.viewBox[2]) * areaW -
                      (w * unit) / 2,
                    top:
                      areaTop +
                      ((y + h / 2) / sheet.viewBox[3]) * areaH -
                      (h * unit) / 2,
                    overflow: "visible",
                    transform: `rotate(${rot}deg) scale(${k.x}, ${k.y})`,
                  }}
                  dangerouslySetInnerHTML={{ __html: icon.html }}
                />
              );
            })}
          </div>
        </>
      ) : null}

      {card.stickers.map((s, i) => {
        const k = slam(t - s.at);
        if (k.x === 0) return null;
        return (
          <Label
            key={s.text}
            sticker={s}
            left={s.x}
            top={s.y}
            rot={(seeded(`icon-label-${i}`)() - 0.5) * 8}
            scale={k}
          />
        );
      })}
    </CardFrame>
  );
};
