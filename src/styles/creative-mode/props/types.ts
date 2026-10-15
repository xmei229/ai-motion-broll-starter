import type { StageItem } from "../../../lib/types";

// 道具的繪圖元件拿到的東西。畫在 0 0 100 100 的座標系裡，外面由 Stage 縮放與擺位。
export type PropDrawProps = {
  t: number; // 從進場起算的秒數；道具自己的持續動畫（時針走、聲波跳）用它
  sw: number; // 墨線寬，已換算成 viewBox 單位，所有描邊都用它，不要寫死
  fill: string; // 主色，由 tone 決定
  options: Record<string, number>;
};

export type PropDef = {
  name: string; // 中文名，給審稿頁與目錄用
  parts: string[]; // 可各自動的零件
  tones: NonNullable<StageItem["tone"]>[]; // 這個道具試過哪些主色
  options: Record<string, string>; // 參數名 → 說明與預設值
  continuous: string; // 持續動畫的說明；沒有就寫「無」
  draw: React.FC<PropDrawProps>;
};
