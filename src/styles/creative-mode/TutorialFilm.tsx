import {
  AbsoluteFill,
  Audio,
  Sequence,
  staticFile,
  useVideoConfig,
} from "remotion";
import { secToFrame } from "../../lib/time";
import type { Aspect, FilmBeat, TransitionName } from "../../lib/types";
import { Backdrop } from "./Backdrop";
import { Card } from "./Card";
import { SFX_VOLUME, TRANSITION_SFX } from "./sfx";
import { BLOCK_STEPS, TRANSITION_SEC } from "./transitions";
import { COLORS } from "./tokens";

const TAIL_SEC = 0.3; // 音效在轉場結束後多留的秒數，讓尾音自然收掉

type Cue = { at: number; length: number; file: string };

// 每個轉場要掛的音效。blocks 每跳一聲（無聲的階梯容易被看成卡頓），其他整段一聲。
const cuesFor = (beats: FilmBeat[]): Cue[] => {
  const cues: Cue[] = [];
  beats.forEach((b, i) => {
    const name = b.transitionOut ?? "none";
    if (name === "none") return;
    const sec = TRANSITION_SEC[name];
    const file = TRANSITION_SFX[name];
    const outAt = b.end - sec.out;
    if (name === "blocks") {
      const next = beats[i + 1];
      const hit = (at: number) => cues.push({ at, length: 0.25, file });
      BLOCK_STEPS.slice(1).forEach(([p]) => hit(outAt + p * sec.out));
      if (next) {
        // 進場是倒過來退開：進度越過 1 − 門檻的那一刻跳一格
        BLOCK_STEPS.slice(1).forEach(([p]) => hit(next.start + (1 - p) * sec.in));
      }
    } else {
      cues.push({ at: outAt, length: sec.out + sec.in + TAIL_SEC, file });
    }
  });
  return cues;
};

// 整片：把每一段依旁白時間接起來。段與段之間照分鏡表的轉場；每段是先退場、下一段再進場，
// 不重疊，所以單卡渲染的畫面和放進整片的畫面一致。
export const TutorialFilm: React.FC<{
  beats: FilmBeat[];
  aspect: Aspect;
  audio?: string;
  sfx?: boolean;
}> = ({ beats, aspect, audio, sfx = false }) => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      {/* 段與段之間若有空檔，露出的是紙底 */}
      <Backdrop dot={COLORS.accent2} />
      {audio ? <Audio src={staticFile(audio)} /> : null}
      {beats.map((b, i) => {
        const from = secToFrame(b.start, fps);
        const frames = Math.max(1, secToFrame(b.end, fps) - from);
        const intro: TransitionName =
          b.transitionIn ?? beats[i - 1]?.transitionOut ?? "none";
        return (
          <Sequence key={b.id} from={from} durationInFrames={frames}>
            <Card
              card={b.card}
              aspect={aspect}
              cardTransit={{
                intro,
                outro: b.transitionOut ?? "none",
                anchor: b.transitionAnchor ?? [0.5, 0.5],
                anchorIn: b.transitionAnchorIn,
                totalSec: frames / fps,
              }}
            />
          </Sequence>
        );
      })}
      {sfx
        ? cuesFor(beats).map((c, i) => (
            <Sequence
              key={`sfx-${i}`}
              from={secToFrame(c.at, fps)}
              durationInFrames={Math.max(1, secToFrame(c.length, fps))}
              layout="none"
            >
              <Audio src={staticFile(`sfx/${c.file}`)} volume={SFX_VOLUME} />
            </Sequence>
          ))
        : null}
    </AbsoluteFill>
  );
};
