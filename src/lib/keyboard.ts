// Physical layout of the Acer Predator ABNT2 keyboard drawn in the preview.
// Everything sits on one fine column grid so every cap aligns and the tall ISO
// Enter can span two rows. 4 columns = 1 key-unit.
// Main alpha block = cols 1-60, gutter = 61-62, numpad = cols 63-78.

export const TOTAL_COLS = 78;

export type Flags = { wasd?: boolean; logo?: boolean };

export type Key = {
  label?: string;
  /** small secondary legend in the top-left corner */
  sub?: string;
  /** column span (4 = one key-unit) */
  c: number;
  /** rows this cap spans (the tall ISO Enter) */
  rowSpan?: number;
  /** an unlabelled cap (spacebar) */
  blank?: boolean;
} & Flags;

export type FuncKey = { label?: string; w?: number; spacer?: boolean } & Flags;

export type NumKey = { label?: string; sub?: string; col: string; row: string } & Flags;

export const FUNC_ROW: FuncKey[] = [
  { label: "Esc", w: 1.2 },
  { label: "F1" }, { label: "F2" }, { label: "F3" }, { label: "F4" },
  { label: "F5" }, { label: "F6" }, { label: "F7" }, { label: "F8" },
  { label: "F9" }, { label: "F10" }, { label: "F11" }, { label: "F12" },
  { label: "PrtSc" }, { label: "Ins" }, { label: "Del" },
  { spacer: true, w: 0.7 },
  { label: "⏮" }, { label: "⏯" }, { label: "⏭" }, { label: "⏻" },
];

export const MAIN_ROWS: Key[][] = [
  [
    { label: "'", sub: '"', c: 4 }, { label: "1", sub: "!", c: 4 },
    { label: "2", sub: "@", c: 4 }, { label: "3", sub: "#", c: 4 },
    { label: "4", sub: "$", c: 4 }, { label: "5", sub: "%", c: 4 },
    { label: "6", sub: "¨", c: 4 }, { label: "7", sub: "&", c: 4 },
    { label: "8", sub: "*", c: 4 }, { label: "9", sub: "(", c: 4 },
    { label: "0", sub: ")", c: 4 }, { label: "-", sub: "_", c: 4 },
    { label: "=", sub: "+", c: 4 }, { label: "←", c: 8 },
  ],
  [
    { label: "Tab", c: 6 }, { label: "Q", c: 4 }, { label: "W", c: 4, wasd: true },
    { label: "E", c: 4 }, { label: "R", c: 4 }, { label: "T", c: 4 },
    { label: "Y", c: 4 }, { label: "U", c: 4 }, { label: "I", c: 4 },
    { label: "O", c: 4 }, { label: "P", c: 4 }, { label: "´", sub: "`", c: 4 },
    { label: "[", sub: "{", c: 4 }, { label: "↵", c: 6, rowSpan: 2 },
  ],
  [
    { label: "Fixa", c: 6 }, { label: "A", c: 4, wasd: true },
    { label: "S", c: 4, wasd: true }, { label: "D", c: 4, wasd: true },
    { label: "F", c: 4 }, { label: "G", c: 4 }, { label: "H", c: 4 },
    { label: "J", c: 4 }, { label: "K", c: 4 }, { label: "L", c: 4 },
    { label: "Ç", c: 4 }, { label: "~", sub: "^", c: 4 },
    { label: "]", sub: "}", c: 4 },
  ],
  [
    { label: "⇧", c: 4 }, { label: "\\", sub: "|", c: 4 }, { label: "Z", c: 4 },
    { label: "X", c: 4 }, { label: "C", c: 4 }, { label: "V", c: 4 },
    { label: "B", c: 4 }, { label: "N", c: 4 }, { label: "M", c: 4 },
    { label: ",", sub: "<", c: 4 }, { label: ".", sub: ">", c: 4 },
    { label: ";", sub: ":", c: 4 }, { label: "⇧", c: 4 },
    { label: "▲", c: 4, wasd: true },
  ],
  [
    { label: "Ctrl", c: 6 }, { label: "Fn", c: 4 }, { label: "⊞", c: 4 },
    { label: "Alt", c: 4 }, { blank: true, c: 16 }, { label: "Alt Gr", c: 6 },
    { label: "☰", c: 4 }, { label: "/", sub: "?", c: 4 },
    { label: "◄", c: 4, wasd: true }, { label: "▼", c: 4, wasd: true },
    { label: "►", c: 4, wasd: true },
  ],
];

export const NUMPAD: NumKey[] = [
  { logo: true, col: "63 / span 4", row: "1" },
  { label: "NumLk", col: "67 / span 4", row: "1" },
  { label: "/", col: "71 / span 4", row: "1" },
  { label: "*", col: "75 / span 4", row: "1" },
  { label: "7", sub: "Home", col: "63 / span 4", row: "2" },
  { label: "8", sub: "▲", col: "67 / span 4", row: "2" },
  { label: "9", sub: "PgUp", col: "71 / span 4", row: "2" },
  { label: "-", col: "75 / span 4", row: "2" },
  { label: "4", sub: "◄", col: "63 / span 4", row: "3" },
  { label: "5", col: "67 / span 4", row: "3" },
  { label: "6", sub: "►", col: "71 / span 4", row: "3" },
  { label: "+", col: "75 / span 4", row: "3" },
  { label: "1", sub: "End", col: "63 / span 4", row: "4" },
  { label: "2", sub: "▼", col: "67 / span 4", row: "4" },
  { label: "3", sub: "PgDn", col: "71 / span 4", row: "4" },
  { label: "Enter", col: "75 / span 4", row: "4 / span 2" },
  { label: "0", sub: "Ins", col: "63 / span 8", row: "5" },
  { label: ".", sub: "Del", col: "71 / span 4", row: "5" },
];

/** Walk a row assigning each cap its start column and horizontal centre. */
export function layoutRow(row: Key[]) {
  let col = 1;
  return row.map((k) => {
    const start = col;
    col += k.c;
    return { k, start, xFrac: (start - 1 + k.c / 2) / TOTAL_COLS };
  });
}

/** Horizontal centre (0..1) of a numpad cap from its grid-column string. */
export function colFrac(col: string): number {
  const m = col.match(/(\d+)\s*\/\s*span\s*(\d+)/);
  const start = m ? +m[1] : parseInt(col, 10);
  const span = m ? +m[2] : 1;
  return (start - 1 + span / 2) / TOTAL_COLS;
}

/** Which of the 4 lighting zones a cap at `xFrac` belongs to (0-indexed). */
export const zoneOf = (xFrac: number) => Math.min(3, Math.floor(xFrac * 4));
