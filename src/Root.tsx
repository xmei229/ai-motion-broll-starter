import { Composition } from "remotion";
import {
  Tutorial,
  calculateTutorialMetadata,
  tutorialDefaultProps,
} from "./compositions/Tutorial";
import { FPS } from "./lib/time";

// 只負責登記 Composition，不放畫面。一個類型一個 Composition。
export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Tutorial"
      component={Tutorial}
      durationInFrames={FPS}
      fps={FPS}
      width={1920}
      height={1080}
      defaultProps={tutorialDefaultProps}
      calculateMetadata={calculateTutorialMetadata}
    />
  );
};
