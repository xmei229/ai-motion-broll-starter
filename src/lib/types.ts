export type Aspect = "16:9" | "9:16";
export type StyleId = "creative-mode";

// Tutorial 類型：教學片的 B-roll 卡片。一張卡一支短片，沒有旁白音檔與字幕。
export type CompareRow = {
  label: string; // 這一列比的是什麼；空字串則不畫標籤
  left: string;
  right: string;
  at?: number; // 這一列拍入的秒數；省略時在片長內等間隔
  rightAt?: number; // 右格另外的拍入秒數；省略時緊跟左格
};
export type CompareSide = {
  title: string;
  sub?: string;
  at?: number; // 標題貼紙拍入的秒數
  subAt?: number; // 副標出現的秒數；省略時緊跟標題
};
// 開場主題：先獨佔畫面，until 秒退場。subAt 是副標出現的秒數。
export type CardLead = {
  title: string;
  sub?: string;
  at?: number;
  subAt?: number;
  until: number;
};
export type CompareCard = {
  kind: "compare";
  title: string; // 左上角的卡片名
  mark?: string; // 中央星爆裡的字，預設 VS
  markAt?: number; // 星爆彈出的秒數
  lead?: CardLead; // 退場的那一刻兩塊面板拍入
  left: CompareSide;
  right: CompareSide;
  rows: CompareRow[];
  stickers?: CardSticker[]; // 疊在對照卡上的貼紙；x、y 是畫面上的像素座標
};
// 分支卡與標籤卡左邊的根。subAt 是副標出現的秒數，省略時跟著標題一起出現。
export type RootSide = { title: string; sub?: string; at?: number; subAt?: number };
// 旁白框：tag 是前面的黑底小標，at 是出現的秒數，tone 為 warn 時用警示色。
export type CardNote = { tag?: string; text: string; at: number; tone?: "warn" };
export type BranchCard = {
  kind: "branch";
  title: string; // 左上角的卡片名
  note?: CardNote; // 根下方的旁白框
  root: RootSide;
  // 3–6 個。at 是拍入的秒數；mark 取代圓盤裡的編號；tone 為 warn 時圓盤用警示色。
  children: {
    title: string;
    note?: string;
    at?: number;
    mark?: string;
    tone?: "warn";
  }[];
};
// 欄位意義同 BranchCard 的 children。
export type ChainStep = {
  title: string; // 有 lottie 時可以留空，動畫就佔滿整格
  note?: string;
  at?: number;
  mark?: string; // 取代圓盤裡的編號；空字串則不畫圓盤
  tone?: "warn";
  op?: string; // 這一步前面不畫箭頭，改寫這個運算符（+、=）
  lottie?: string; // assets 裡的 Lottie 檔名：畫在標題上方，這一步拍入時開始播，播完循環
};
export type ChainCard = {
  kind: "chain";
  title: string; // 左上角的卡片名
  intro?: boolean; // false：接續上一張卡，不做開場擦除
  lead?: CardLead;
  // 蓋在第 step 步（從 0 起算）上的貼紙；place 為 above 時是框上方的小貼紙。
  stamps?: {
    lane?: number; // 第幾條鏈，預設第一條
    step: number;
    text: string;
    at: number;
    tone?: "warn";
    place?: "above";
  }[];
  note?: CardNote; // 右下角的旁白框
  steps?: ChainStep[]; // 只有一條鏈時用這個：3–4 步，由左到右
  // 上下並列的幾條鏈；label 是鏈名，at 是鏈名拍入的秒數。有 lanes 就不看 steps。
  lanes?: { label?: string; at?: number; steps: ChainStep[] }[];
};
export type TagsCard = {
  kind: "tags";
  title: string; // 左上角的卡片名
  root: RootSide;
  panel?: { text: string; at: number }; // 面板的名字與出現的秒數
  tags: { text: string; at?: number }[]; // 術語貼紙，兩欄排列；at 是拍入的秒數
};
// 貼紙字。display 為 true 時用漫畫字體（只適合拉丁字母）；size 是字級。
export type CardSticker = {
  text: string;
  at: number;
  x: number;
  y: number;
  tone?: "yellow" | "accent" | "ink" | "white" | "warn";
  display?: boolean;
  size?: number;
};
// 圖片卡：一張插圖當場景。x、y 都是原圖上的像素座標。
export type PictureCard = {
  kind: "picture";
  title: string; // 左上角的卡片名
  src: string; // assets 裡的圖檔名
  size: [number, number]; // 原圖的寬高（像素）
  // 鏡頭取景：at 秒出發，移到以 (x, y) 為中心、放大 zoom 倍；zoom 1 是整張圖。第一個是開場的取景。
  shots: { at: number; x: number; y: number; zoom: number }[];
  stickers: CardSticker[]; // 釘在圖上的貼紙；x、y 是原圖上的像素座標
};
// 圖示卡：一組由 SVG 拆出來的圖示繞著畫面拍入，中間留給貼紙。
export type IconsCard = {
  kind: "icons";
  title: string; // 左上角的卡片名
  src: string; // assets 裡的圖示資料檔（.json）
  scale?: number; // 原圖一個單位畫成幾個像素，預設 2.5
  firstAt?: number; // 第一個圖示拍入的秒數
  gap?: number; // 圖示之間相隔幾秒
  shakeAt?: number; // 這一秒整組圖示被震一下（配合判定貼紙）
  stickers: CardSticker[]; // x、y 是畫面上的像素座標
};
// 量表卡：比相對長短的條紋量表。value 是 0 到 0.82 的相對長度（留位置給尾端的字），不是數據。
export type BarsCard = {
  kind: "bars";
  title: string; // 左上角的卡片名
  rows: {
    label: string; // 左邊的名牌
    value: number;
    rank?: string; // 量表尾端的字
    note?: string; // 名次後面的黑底附註
    noteAt?: number; // 附註出現的秒數
    at?: number; // 這一條出現的秒數
    tone?: "accent" | "warn"; // 預設是藍
  }[];
};
// 梗圖卡：上下幾格，左邊反應圖、右邊項目。
export type MemeCard = {
  kind: "meme";
  title: string; // 左上角的卡片名
  src: string; // assets 裡的圖檔名
  size: [number, number]; // 原圖的寬高（像素）
  panels: {
    crop: [number, number, number, number]; // 這一格的反應圖在原圖上的 x、y、寬、高
    at: number; // 這一格拍入的秒數
    align?: "left"; // 項目靠左排，右邊留給貼紙；預設置中
    items: { text: string; at: number }[];
    stamps?: CardSticker[]; // 蓋在右邊格子上的貼紙；x、y 是格內 0 到 1 的位置
  }[];
};
// 道具場景卡：把道具庫裡的道具擺在畫面上，各自進場、強調、退場。
// 動作名稱與數字見 src/styles/creative-mode/MOTION.md「道具動作」。
export type EnterAction = "pop" | "slam" | "spinIn" | "dropIn" | "slideIn";
export type EmphasisAction = "wobble" | "pulse" | "jump" | "shake";
export type ExitAction = "popOut" | "slideOut" | "spinOut";
export type StageItem = {
  prop: string; // 道具表的 ID，要在 styles/creative-mode/props/index.ts 登記過
  x: number; // 中心點，畫面比例 0 到 1
  y: number;
  size?: number; // 邊長（px，以 1080 高為準），預設 300
  at: number; // 進場的秒數
  enter?: EnterAction; // 預設 pop
  from?: "left" | "right"; // slideIn 的來向，預設 right
  emphasis?: { at: number; action: EmphasisAction }[];
  exit?: { at: number; action?: ExitAction }; // 預設 popOut
  tone?: "yellow" | "accent" | "blue" | "white" | "warn"; // 道具主色，預設 yellow
  options?: Record<string, number>; // 各道具自己的參數，見該道具檔頭
  text?: string; // 需要文字的道具（例如輸入框）用；沒給就用該道具的預設字
};
export type StageCard = {
  kind: "stage";
  title: string; // 左上角的卡片名
  items: StageItem[];
  stickers?: CardSticker[]; // x、y 是畫面上的像素座標
};
// 錄屏佔位卡：這一段的畫面是使用者另外錄的螢幕錄影，後製（DaVinci Resolve 等）時蓋上去。
// 這裡只出一張標明「此處放錄影」的卡，讓整片的時間軸完整、使用者知道要放哪一支。
export type RecCard = {
  kind: "rec";
  title: string; // 左上角的卡片名
  id: string; // 道具表裡的錄製項目 ID，例如 rec-04
  note?: string; // 要錄什麼（取自稿裡的標記說明）
  timecode?: string; // 這一段在整片的起訖，例如 "00:12.0–00:30.0"，給後製對位用
};
// 段落卡佔位：稿裡「##」「###」的段落卡片，使用者在後製（DaVinci Resolve）放入。
// 旁白在這裡有約 3 秒的停頓，Remotion 只出一張標明段落名稱的佔位，讓時間軸完整。
export type SlotCard = {
  kind: "slot";
  title: string; // 左上角的卡片名
  label: string; // 段落名稱，例如「2-2 Remotion」
  timecode?: string; // 這一段在整片的起訖，給後製對位用
};
export type TutorialCard =
  | SlotCard
  | RecCard
  | StageCard
  | CompareCard
  | BranchCard
  | ChainCard
  | TagsCard
  | PictureCard
  | IconsCard
  | BarsCard
  | MemeCard;
// 卡片與卡片之間的轉場。每張卡各管自己的「進」和「出」；none 是不做。
// 名稱的意義與數字見 src/styles/creative-mode/MOTION.md。
export type TransitionName =
  | "dots"
  | "push"
  | "blocks"
  | "doors"
  | "iris"
  | "carry"
  | "none";
// 影片版（Film）裡的一段：start、end 是整支旁白上的秒數（取自人工校過的字幕）。
// 轉場：transitionOut 是這一段接下一段的方式；下一段沒寫 transitionIn 就沿用它，所以兩邊不會對不上。
export type FilmBeat = {
  id: string; // 對應分鏡表的 Beat 編號，例如 "01"
  start: number;
  end: number;
  card: TutorialCard;
  transitionIn?: TransitionName;
  transitionOut?: TransitionName;
  transitionAnchor?: [number, number]; // 出場用（iris 圓心、carry 線頭）
  transitionAnchorIn?: [number, number]; // 進場用（carry 接點）；沒寫就用 transitionAnchor
};
// 兩種用法擇一：
//   單卡：給 card，渲成一支短片（一張卡一支）；
//   整片：給 beats，把每段依旁白時間接成一支，轉場在段與段之間，並掛上旁白與轉場音效。
export type TutorialProps = {
  card?: TutorialCard;
  beats?: FilmBeat[];
  audio?: string; // 整片的旁白，相對於 --public-dir，給 staticFile()
  sfx?: boolean; // 整片是否掛轉場音效，預設 false（要掛請設 true，音效檔要先放進 assets/sfx/）
  style: StyleId;
  aspect: Aspect;
  durationSec: number; // 整片時給的是下限，實際長度取它與最後一段結束時間的較大者
  fps?: number; // 幀率，預設 30。要跟後製軟體的時間軸一致（DaVinci 時間軸是 24 就寫 24）
  transitionIn?: TransitionName; // 單卡：開場的進場方式，預設 dots（網點縮開）
  transitionOut?: TransitionName; // 單卡：結尾的退場方式，預設 none（維持原本沒有退場）
  transitionAnchor?: [number, number]; // iris 的圓心、carry 的線頭（出），畫面比例 0 到 1，預設畫面中央
  transitionAnchorIn?: [number, number]; // carry 的接點（進）；沒寫就用 transitionAnchor
};
