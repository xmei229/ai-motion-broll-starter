import { Clock } from "./Clock";
import { Mic } from "./Mic";
import { TypeBox } from "./TypeBox";
import type { PropDef } from "./types";

// 道具登記處：key 就是道具表（asset-list.md）的 ID，分鏡表靠它引用。
// 新增道具：寫一個檔、在這裡登記、再補進 MOTION.md 的道具目錄。
export const PROPS: Record<string, PropDef> = {
  mic: Mic,
  clock: Clock,
  typebox: TypeBox,
};
