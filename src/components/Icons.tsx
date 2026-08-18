// Inline SVGs lifted from the design. All draw on currentColor at 16x16.
type P = { size?: number };
const svg = (size: number, extra?: object) => ({
  width: size,
  height: size,
  viewBox: "0 0 16 16",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  ...extra,
});

export const IconKeyboard = ({ size = 16 }: P) => (
  <svg {...svg(size)}>
    <rect x="1.3" y="3.6" width="13.4" height="8.8" rx="1.8" />
    <path d="M4 6.4h.01M6.4 6.4h.01M8.8 6.4h.01M11.2 6.4h.01M4 9.6h7.5" />
  </svg>
);

export const IconProfiles = ({ size = 16 }: P) => (
  <svg {...svg(size, { strokeLinejoin: "round" })}>
    <path d="M8 1.7l6 3.1-6 3.1-6-3.1 6-3.1z" />
    <path d="M2 8.6l6 3.1 6-3.1" />
    <path d="M2 11.9l6 3.1 6-3.1" opacity=".5" />
  </svg>
);

export const IconSettings = ({ size = 16 }: P) => (
  <svg {...svg(size)}>
    <path d="M1.6 4.4h12.8M1.6 8h12.8M1.6 11.6h12.8" />
    <circle cx="10.4" cy="4.4" r="1.9" fill="#0a0c0e" />
    <circle cx="5.2" cy="8" r="1.9" fill="#0a0c0e" />
    <circle cx="11.2" cy="11.6" r="1.9" fill="#0a0c0e" />
  </svg>
);

export const IconInfo = ({ size = 16 }: P) => (
  <svg {...svg(size)}>
    <circle cx="8" cy="8" r="6.3" />
    <path d="M8 7.2v4M8 5.1h.01" />
  </svg>
);

export const IconWarning = ({ size = 16 }: P) => (
  <svg {...svg(size, { strokeWidth: 1.4 })}>
    <path d="M8 1.9l6.3 11H1.7L8 1.9z" />
    <path d="M8 6.2v3.2M8 11.4h.01" />
  </svg>
);

export const IconBolt = ({ size = 16 }: P) => (
  <svg {...svg(size, { strokeWidth: 1.8, strokeLinejoin: "round" })}>
    <path d="M8.6 1.6L3 9.2h4l-.6 5.2L12 6.8H8z" />
  </svg>
);

export const IconSpinner = ({ size = 16 }: P) => (
  <svg {...svg(size, { strokeWidth: 1.8 })} style={{ animation: "spin 700ms linear infinite" }}>
    <path d="M8 1.8a6.2 6.2 0 1 1-6.2 6.2" opacity=".35" />
    <path d="M8 1.8a6.2 6.2 0 0 1 6.2 6.2" />
  </svg>
);

export const IconCheck = ({ size = 16 }: P) => (
  <svg {...svg(size, { strokeWidth: 2, strokeLinejoin: "round" })}>
    <path d="M3 8.4l3.2 3.2L13 4.8" />
  </svg>
);

export const IconRefresh = ({ size = 16 }: P) => (
  <svg {...svg(size, { strokeWidth: 1.6, strokeLinejoin: "round" })}>
    <path d="M2.4 8a5.6 5.6 0 1 0 1.9-4.2" />
    <path d="M2.2 2.6v2.9h2.9" />
  </svg>
);

export const IconImport = ({ size = 16 }: P) => (
  <svg {...svg(size, { strokeWidth: 1.6, strokeLinejoin: "round" })}>
    <path d="M8 10.4V2.2" />
    <path d="M4.8 5.4L8 2.2l3.2 3.2" />
    <path d="M2.4 12.2v1.4h11.2v-1.4" />
  </svg>
);

export const IconExport = ({ size = 16 }: P) => (
  <svg {...svg(size, { strokeWidth: 1.6, strokeLinejoin: "round" })}>
    <path d="M8 2.2v8.2" />
    <path d="M4.8 7.2L8 10.4l3.2-3.2" />
    <path d="M2.4 12.2v1.4h11.2v-1.4" />
  </svg>
);

export const IconPlus = ({ size = 16 }: P) => (
  <svg {...svg(size, { strokeWidth: 1.9 })}>
    <path d="M8 3.2v9.6M3.2 8h9.6" />
  </svg>
);

export const IconTrash = ({ size = 16 }: P) => (
  <svg {...svg(size)}>
    <path d="M2.6 4.4h10.8" />
    <path d="M6.4 4.4V2.8h3.2v1.6" />
    <path d="M4 4.4l.7 8.8h6.6l.7-8.8" />
  </svg>
);

export const IconFile = ({ size = 16 }: P) => (
  <svg {...svg(size)}>
    <path d="M9.2 1.9H4a1.4 1.4 0 0 0-1.4 1.4v9.4A1.4 1.4 0 0 0 4 14.1h8a1.4 1.4 0 0 0 1.4-1.4V6.1z" />
    <path d="M9.2 1.9v4.2h4.2" />
  </svg>
);

export const IconArrowLeft = ({ size = 16 }: P) => (
  <svg {...svg(size, { strokeWidth: 1.6, strokeLinejoin: "round" })}>
    <path d="M13 8H3.4" />
    <path d="M7 4L3 8l4 4" />
  </svg>
);

export const IconArrowRight = ({ size = 16 }: P) => (
  <svg {...svg(size, { strokeWidth: 1.6, strokeLinejoin: "round" })}>
    <path d="M3 8h9.6" />
    <path d="M9 4l4 4-4 4" />
  </svg>
);

export const IconClose = ({ size = 12 }: P) => (
  <svg width={size} height={size} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4">
    <path d="M2.6 2.6l6.8 6.8M9.4 2.6l-6.8 6.8" />
  </svg>
);

export const IconMinimize = ({ size = 12 }: P) => (
  <svg width={size} height={size} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3">
    <path d="M2 6h8" />
  </svg>
);

export const IconMaximize = ({ size = 12 }: P) => (
  <svg width={size} height={size} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3">
    <rect x="2.2" y="2.2" width="7.6" height="7.6" rx="1.2" />
  </svg>
);

export const IconGitHub = ({ size = 14 }: P) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 .5a7.5 7.5 0 0 0-2.37 14.62c.37.07.5-.16.5-.36v-1.3c-2.09.46-2.53-1-2.53-1-.34-.87-.83-1.1-.83-1.1-.68-.47.05-.46.05-.46.75.05 1.15.77 1.15.77.67 1.15 1.76.82 2.19.63.07-.49.26-.82.47-1.01-1.67-.19-3.42-.83-3.42-3.71 0-.82.29-1.49.77-2.01-.08-.19-.34-.95.07-1.98 0 0 .63-.2 2.05.77a7.1 7.1 0 0 1 3.73 0c1.42-.97 2.04-.77 2.04-.77.42 1.03.16 1.79.08 1.98.48.52.77 1.19.77 2.01 0 2.89-1.76 3.52-3.43 3.7.27.24.51.7.51 1.41v2.09c0 .2.13.44.51.36A7.5 7.5 0 0 0 8 .5z" />
  </svg>
);

// ---- lighting mode glyphs ----

export const IconStatic = ({ size = 14 }: P) => (
  <svg {...svg(size)}>
    <circle cx="8" cy="8" r="4.6" />
  </svg>
);
export const IconBreath = ({ size = 14 }: P) => (
  <svg {...svg(size)}>
    <circle cx="8" cy="8" r="2.6" />
    <circle cx="8" cy="8" r="6" opacity=".4" />
  </svg>
);
export const IconNeon = ({ size = 14 }: P) => (
  <svg {...svg(size)}>
    <circle cx="8" cy="8" r="5.6" />
    <path d="M8 2.4a5.6 5.6 0 0 1 0 11.2" strokeWidth="2.4" />
  </svg>
);
export const IconWave = ({ size = 14 }: P) => (
  <svg {...svg(size)}>
    <path d="M1.4 9.6c1.6-4 3.3-4 4.9 0s3.3 4 4.9 0" />
    <path d="M12.2 6.6l2 1.6-2 1.6" />
  </svg>
);
export const IconShifting = ({ size = 14 }: P) => (
  <svg {...svg(size)}>
    <path d="M2 8h9.4" />
    <path d="M8.8 4.8L12 8l-3.2 3.2" />
    <path d="M14 4.6v6.8" opacity=".5" />
  </svg>
);
export const IconZoom = ({ size = 14 }: P) => (
  <svg {...svg(size)}>
    <circle cx="8" cy="8" r="1.6" />
    <path d="M8 2.4v2.2M8 11.4v2.2M2.4 8h2.2M11.4 8h2.2" />
  </svg>
);
