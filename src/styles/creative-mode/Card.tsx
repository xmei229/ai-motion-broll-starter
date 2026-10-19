import type { Aspect, TutorialCard } from "../../lib/types";
import { DEFAULT_TRANSITION, TransitionContext } from "./transitions";
import type { TransitionSetting } from "./transitions";
import { Bars } from "./Bars";
import { Branch } from "./Branch";
import { Chain } from "./Chain";
import { Compare } from "./Compare";
import { Icons } from "./Icons";
import { Meme } from "./Meme";
import { Picture } from "./Picture";
import { Rec } from "./Rec";
import { Slot } from "./Slot";
import { Stage } from "./Stage";
import { Tags } from "./Tags";

// Tutorial 卡片在 Creative Mode 的入口；依 kind 取對應的卡。
export const Card: React.FC<{
  card: TutorialCard;
  aspect: Aspect;
  cardTransit?: TransitionSetting;
}> = ({ card, aspect, cardTransit = DEFAULT_TRANSITION }) => (
  <TransitionContext.Provider value={cardTransit}>
    <Kind card={card} aspect={aspect} />
  </TransitionContext.Provider>
);

const Kind: React.FC<{ card: TutorialCard; aspect: Aspect }> = ({
  card,
  aspect,
}) => {
  switch (card.kind) {
    case "compare":
      return <Compare card={card} aspect={aspect} />;
    case "branch":
      return <Branch card={card} aspect={aspect} />;
    case "chain":
      return <Chain card={card} aspect={aspect} />;
    case "tags":
      return <Tags card={card} aspect={aspect} />;
    case "picture":
      return <Picture card={card} aspect={aspect} />;
    case "icons":
      return <Icons card={card} aspect={aspect} />;
    case "bars":
      return <Bars card={card} aspect={aspect} />;
    case "meme":
      return <Meme card={card} aspect={aspect} />;
    case "stage":
      return <Stage card={card} aspect={aspect} />;
    case "rec":
      return <Rec card={card} aspect={aspect} />;
    case "slot":
      return <Slot card={card} aspect={aspect} />;
  }
};
