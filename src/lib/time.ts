export const FPS = 30;

export const secToFrame = (sec: number, fps: number = FPS): number =>
  Math.round(sec * fps);

export const frameToSec = (frame: number, fps: number = FPS): number =>
  frame / fps;
