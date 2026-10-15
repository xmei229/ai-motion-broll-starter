import {
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { seeded } from "../../lib/random";
import type { Aspect, PictureCard } from "../../lib/types";
import { CardFrame } from "./CardFrame";
import { Label } from "./Label";
import { clamp, slam } from "./motion";
import { COLORS, SHADOW } from "./tokens";

const ENTER_SEC = 0.3;
const MOVE_SEC = 0.7; // 鏡頭從上一個取景移到下一個的時間

// 圖片卡：一張插圖當場景，鏡頭依口白移到不同的地方；貼紙釘在圖上的位置，被唸到時拍入。
// 取景與貼紙的 x、y 都是原圖上的像素座標。
export const Picture: React.FC<{ card: PictureCard; aspect: Aspect }> = ({
  card,
  aspect,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const vertical = aspect === "9:16";
  const margin = vertical ? 48 : 96;
  const [imgW, imgH] = card.size;

  // zoom 1 = 整張圖剛好放進卡片名下方的區域
  const areaTop = vertical ? 300 : 120;
  const areaH = height - areaTop - 50;
  const fit = Math.min(areaH / imgH, (width - margin * 2) / imgW);
  const viewX = width / 2;
  const viewY = areaTop + areaH / 2;

  // 鏡頭：每個取景在自己的 at 秒出發，MOVE_SEC 後到位。
  const cam = card.shots.reduce(
    (from, shot, i) => {
      if (i === 0) return from;
      const p = interpolate(t, [shot.at, shot.at + MOVE_SEC], [0, 1], {
        ...clamp,
        easing: Easing.inOut(Easing.cubic),
      });
      return {
        x: from.x + (shot.x - from.x) * p,
        y: from.y + (shot.y - from.y) * p,
        zoom: from.zoom + (shot.zoom - from.zoom) * p,
      };
    },
    { x: card.shots[0].x, y: card.shots[0].y, zoom: card.shots[0].zoom },
  );
  const scale = fit * cam.zoom;
  const enter = slam(t - ENTER_SEC);
  // 拉遠看全圖時貼紙跟著縮小，才不會蓋滿整張圖
  const stickerScale = interpolate(cam.zoom, [1, 1.5], [0.7, 1], clamp);

  return (
    <CardFrame title={card.title} margin={margin}>
      {enter.x > 0 ? (
        <Img
          src={staticFile(card.src)}
          style={{
            position: "absolute",
            left: viewX - cam.x * scale,
            top: viewY - cam.y * scale,
            width: imgW * scale,
            height: imgH * scale,
            maxWidth: "none",
            // 墨色硬陰影，讓去背的插圖像一張貼在紙上的貼紙
            filter: `drop-shadow(${SHADOW}px ${SHADOW}px 0 ${COLORS.ink})`,
            transformOrigin: `${cam.x * scale}px ${cam.y * scale}px`,
            transform: `scale(${enter.x}, ${enter.y})`,
          }}
        />
      ) : null}

      {card.stickers.map((s, i) => {
        const k = slam(t - s.at);
        if (k.x === 0) return null;
        const rot = (seeded(`pic-${i}`)() - 0.5) * 10;
        return (
          <Label
            key={s.text}
            sticker={s}
            left={viewX + (s.x - cam.x) * scale}
            top={viewY + (s.y - cam.y) * scale}
            rot={rot}
            scale={{ x: k.x * stickerScale, y: k.y * stickerScale }}
          />
        );
      })}
    </CardFrame>
  );
};
