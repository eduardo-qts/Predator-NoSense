import { createTheme, MantineColorsTuple, rem } from "@mantine/core";

// Predator blood-red: the primary accent pulled straight from the logo's
// dripping "PREDATOR" wordmark over a near-black hull.
const predator: MantineColorsTuple = [
  "#ffe9e9",
  "#ffd0d0",
  "#fa9d9d",
  "#f56767",
  "#f23c3c",
  "#f02222",
  "#f01212", // primaryShade — the signature red
  "#d40606",
  "#bd0000",
  "#a30000",
];

// Cold steel grey — the predator's armored skin / laptop hull in the art.
const steel: MantineColorsTuple = [
  "#f4f5f7",
  "#e7e9ed",
  "#cbcfd6",
  "#aab1bd",
  "#8d96a6",
  "#7b8598",
  "#717c91",
  "#5f6a7e",
  "#535d71",
  "#454e60",
];

export const theme = createTheme({
  primaryColor: "predator",
  primaryShade: 6,
  colors: { predator, steel },
  white: "#f5f6f8",
  black: "#08090b",
  fontFamily:
    "'Rajdhani', 'Oswald', 'Inter', -apple-system, Segoe UI, Roboto, sans-serif",
  fontFamilyMonospace:
    "'JetBrains Mono', 'Fira Code', ui-monospace, SFMono-Regular, Menlo, monospace",
  headings: {
    fontFamily:
      "'Rajdhani', 'Oswald', 'Inter', -apple-system, Segoe UI, sans-serif",
    fontWeight: "700",
  },
  defaultRadius: "md",
  radius: { md: rem(12), lg: rem(16) },
  components: {
    Paper: {
      defaultProps: {
        withBorder: true,
      },
      styles: {
        root: {
          background:
            "linear-gradient(180deg, rgba(24,12,13,0.55), rgba(10,10,12,0.65))",
          borderColor: "rgba(240,18,18,0.10)",
          backdropFilter: "blur(6px)",
        },
      },
    },
    Button: {
      defaultProps: { radius: "md" },
    },
  },
});
