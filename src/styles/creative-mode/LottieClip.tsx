import { Lottie, LottieAnimationData } from "@remotion/lottie";
import { useEffect, useState } from "react";
import {
  Sequence,
  cancelRender,
  continueRender,
  delayRender,
  staticFile,
} from "remotion";

// 卡片裡的一小塊 Lottie 動畫。src 相對於 public/；從 from 幀開始播，播完循環。
export const LottieClip: React.FC<{
  src: string;
  from: number;
  width: number;
  height: number;
}> = ({ src, from, width, height }) => {
  const [handle] = useState(() => delayRender(`Loading ${src}`));
  const [animationData, setAnimationData] =
    useState<LottieAnimationData | null>(null);

  useEffect(() => {
    fetch(staticFile(src))
      .then((res) => res.json())
      .then((json) => {
        setAnimationData(json);
        continueRender(handle);
      })
      .catch((err) => cancelRender(err));
  }, [handle, src]);

  return (
    <div style={{ width, height, flexShrink: 0 }}>
      {animationData ? (
        <Sequence from={from} layout="none">
          <Lottie
            animationData={animationData}
            loop
            style={{ width: "100%", height: "100%" }}
          />
        </Sequence>
      ) : null}
    </div>
  );
};
