// cue design tokens, mirrored from src/index.css of the app.
export const C = {
  bgDeep: "#08080c",
  surface: "#121218",
  raised: "#1a1a22",
  control: "#22222c",
  border: "rgba(255,255,255,0.08)",
  borderStrong: "rgba(255,255,255,0.18)",
  t1: "#f5f5f7",
  t2: "#a6a6b0",
  t3: "#67676f",
  accent: "#ffc233",
  accentSoft: "rgba(255,194,51,0.14)",
  onAccent: "#1a1200",
  danger: "#ff6b5e",
  success: "#35c75a",
  font: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif',
};

export const eyebrow: React.CSSProperties = {
  fontSize: 26,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.32em",
  color: C.accent,
};
