import type { Aspect, FilmBeat, StyleId, TutorialCard } from "../lib/types";
import { Card as CreativeModeCard } from "./creative-mode/Card";
import { TutorialFilm as CreativeModeFilm } from "./creative-mode/TutorialFilm";
import type { TransitionSetting } from "./creative-mode/transitions";

export type CardComponent = React.FC<{
  card: TutorialCard;
  aspect: Aspect;
  cardTransit?: TransitionSetting;
}>;

export type FilmComponent = React.FC<{
  beats: FilmBeat[];
  aspect: Aspect;
  audio?: string;
  sfx?: boolean;
}>;

// 新增風格：在 styles/ 下建一個資料夾，然後在這裡登記。
export const CARDS: Partial<Record<StyleId, CardComponent>> = {
  "creative-mode": CreativeModeCard,
};

export const FILMS: Partial<Record<StyleId, FilmComponent>> = {
  "creative-mode": CreativeModeFilm,
};
