// Creative Mode tokens：奶油底、飽和糖果色、粗墨線、硬偏移陰影。
// 色票與字型取自 HyperFrames 的 Creative Mode 範本頁（https://www.hyperframes.dev/design/creative-mode），
// 數值是從該頁預覽讀出來的：Primary #EFE9D9、Secondary #0F0F0F、Tertiary #E4DCC4、Accent #F06CA8，
// 額外色 Ink 2 #2A2A2A、Green #1F8A4C、Orange #E85A1F、Yellow #F5C518。
// 範本的字型是 Archivo Black（標題）與 Space Grotesk（內文）；這裡的內容是繁體中文，
// 中文一律用 Noto Sans TC，Archivo Black 只給拉丁字母的大字。
// 範本頁沒有給字級、線寬、陰影，那幾個數字是這個專案自己定的。
import { loadFont as loadArchivoBlack } from "@remotion/google-fonts/ArchivoBlack";
import { loadFont as loadNotoSansTC } from "@remotion/google-fonts/NotoSansTC";

export const COLORS = {
  bg: "#EFE9D9", // Primary：奶油底
  surface: "#FFFDF5", // 卡片底，比奶油亮一階
  ink: "#0F0F0F", // Secondary：墨色
  muted: "#5A564C",
  accent: "#F06CA8", // Accent：粉
  accent2: "#1F8A4C", // 綠
  warn: "#E85A1F", // 橘
  ok: "#1F8A4C",
  yellow: "#F5C518",
} as const;

// 背景方格線的顏色（Backdrop 的 dot 參數會拿來疊色）。
export const CHAPTER_DOTS = [COLORS.accent, COLORS.accent2, COLORS.yellow];

// loadFont() 會在字體載入完成前擋住渲染。
const cjk = loadNotoSansTC("normal", {
  weights: ["700", "900"],
  subsets: ["chinese-traditional", "latin"],
});
const display = loadArchivoBlack("normal", {
  weights: ["400"],
  subsets: ["latin"],
});
export const FONT_CJK = `${cjk.fontFamily}, sans-serif`;
export const FONT_DISPLAY = `${display.fontFamily}, ${FONT_CJK}`;

// 字級（px），1920×1080；直式不得低於這些數值。
export const SIZE = {
  display: 150,
  h1: 84,
  h2: 56,
  body: 34,
  label: 32,
  note: 30,
  subtitle: 42,
  chapterTag: 34,
} as const;

export const INK_STROKE = 6; // 墨線寬
export const SHADOW = 8; // 硬偏移陰影
