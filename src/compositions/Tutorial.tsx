import { CalculateMetadataFunction } from "remotion";
import { CARDS, FILMS } from "../styles";
import { FPS, secToFrame } from "../lib/time";
import type { TutorialProps } from "../lib/types";

export const tutorialDefaultProps: TutorialProps = {
  card: {
    kind: "compare",
    title: "",
    left: { title: "" },
    right: { title: "" },
    rows: [],
  },
  style: "creative-mode",
  aspect: "16:9",
  durationSec: 8,
};

export const calculateTutorialMetadata: CalculateMetadataFunction<
  TutorialProps
> = ({ props }) => {
  const vertical = props.aspect === "9:16";
  // 整片：長度至少到最後一段結束
  const lastEnd = Math.max(0, ...(props.beats ?? []).map((b) => b.end));
  return {
    fps: FPS,
    durationInFrames: Math.max(
      1,
      secToFrame(Math.max(props.durationSec, lastEnd), FPS),
    ),
    width: vertical ? 1080 : 1920,
    height: vertical ? 1920 : 1080,
  };
};

// 教學片的 B-roll。給 card：一張卡一支短片，沒有旁白與字幕。
// 給 beats：把整集的每一段依旁白時間接成一支，含轉場、旁白與轉場音效。
export const Tutorial: React.FC<TutorialProps> = ({
  card,
  beats,
  audio,
  sfx,
  style,
  aspect,
  transitionIn = "dots",
  transitionOut = "none",
  transitionAnchor = [0.5, 0.5],
  transitionAnchorIn,
}) => {
  if (beats) {
    const Film = FILMS[style];
    if (!Film) throw new Error(`風格 ${style} 還沒有整片（Film）`);
    return <Film beats={beats} aspect={aspect} audio={audio} sfx={sfx} />;
  }
  const Card = CARDS[style];
  if (!Card) throw new Error(`風格 ${style} 還沒有 Tutorial 卡片`);
  if (!card) throw new Error("Tutorial 要給 card（單卡）或 beats（整片）");
  return (
    <Card
      card={card}
      aspect={aspect}
      cardTransit={{
        intro: transitionIn,
        outro: transitionOut,
        anchor: transitionAnchor,
        anchorIn: transitionAnchorIn,
      }}
    />
  );
};
