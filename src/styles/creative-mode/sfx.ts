// 轉場音效對照表。檔案是 Mixkit 的免費音效，原始網址在 tutorial/download-sfx.mjs。
// 本專案不附音效檔。
// 路徑相對於 sfx 根目錄；渲染時要先下載到該集的 assets/sfx/（node tutorial/download-sfx.mjs <epNN>）。
import type { TransitionName } from "../../lib/types";

export const TRANSITION_SFX: Record<Exclude<TransitionName, "none">, string> = {
  dots: "transition/swoosh-quick.mp3", // Fast small sweep transition
  push: "transition/whoosh-fast.mp3", // Fast whoosh transition
  blocks: "ui/switch-click-quick.mp3", // Quick switch click：每一跳一聲，見 TutorialFilm
  doors: "mech/door-open-futuristic.mp3", // Futuristic door open
  iris: "transition/air-zoom-vacuum.mp3", // Air zoom vacuum
  carry: "text/marker-pen-line.mp3", // Pen marker line：線在畫的聲音
  sweep: "camera/zoom-swipe-fast.mp3", // Fast swipe zoom：板子掃過
  match: "camera/ui-zoom-in.mp3", // User interface zoom in：推近
};

export const SFX_VOLUME = 0.5;
