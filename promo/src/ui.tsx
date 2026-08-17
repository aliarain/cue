import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C } from "./theme";

/** Full-frame dark backdrop with cue's radial glow. */
export const Backdrop: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse at 50% 32%, #17171f 0%, ${C.bgDeep} 72%)`,
      fontFamily: C.font,
      color: C.t1,
    }}
  >
    {children}
  </AbsoluteFill>
);

/** Fades the scene in/out at its edges. */
export const SceneFade: React.FC<{ frames: number; children: React.ReactNode }> = ({
  frames,
  children,
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(
    frame,
    [0, 12, frames - 12, frames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

/** The heads-up status pill, as in the app. */
export const HeadsUpPill: React.FC<{
  title: string;
  suffix: string;
  cta?: string;
  glow?: number;
  scale?: number;
}> = ({ title, suffix, cta, glow = 0, scale = 1 }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 18,
      background: "rgba(26,26,34,0.97)",
      border: `2px solid ${C.borderStrong}`,
      borderRadius: 999,
      padding: "16px 16px 16px 30px",
      boxShadow: `0 24px 80px rgba(0,0,0,0.5), 0 0 ${40 * glow}px rgba(255,194,51,${0.35 * glow})`,
      transform: `scale(${scale})`,
      fontFamily: C.font,
    }}
  >
    <span
      style={{
        width: 16,
        height: 16,
        borderRadius: "50%",
        background: C.success,
        flexShrink: 0,
      }}
    />
    <span style={{ fontSize: 30, color: C.t2, whiteSpace: "nowrap" }}>
      <b style={{ color: C.t1, fontWeight: 700 }}>{title}</b> {suffix}
    </span>
    {cta && (
      <span
        style={{
          background: C.accent,
          color: C.onAccent,
          fontSize: 27,
          fontWeight: 700,
          padding: "13px 30px",
          borderRadius: 999,
          whiteSpace: "nowrap",
        }}
      >
        {cta}
      </span>
    )}
    <span style={{ color: C.t3, fontSize: 24, padding: "0 12px" }}>✕</span>
  </div>
);

export const PrimaryBtn: React.FC<{ label: string; size?: number; ring?: number }> = ({
  label,
  size = 1,
  ring = 0,
}) => (
  <div
    style={{
      background: C.accent,
      color: C.onAccent,
      fontSize: 40 * size,
      fontWeight: 700,
      padding: `${30 * size}px ${72 * size}px`,
      borderRadius: 28,
      boxShadow: `0 20px 80px rgba(255,194,51,0.25), 0 0 0 ${ring * 8}px ${C.accentSoft}`,
      fontFamily: C.font,
      whiteSpace: "nowrap",
    }}
  >
    {label}
  </div>
);

export const SecondaryBtn: React.FC<{ label: string; size?: number; ring?: number }> = ({
  label,
  size = 1,
  ring = 0,
}) => (
  <div
    style={{
      background: C.control,
      border: `2px solid ${C.borderStrong}`,
      color: C.t1,
      fontSize: 34 * size,
      fontWeight: 600,
      padding: `${28 * size}px ${50 * size}px`,
      borderRadius: 28,
      boxShadow: `0 0 0 ${ring * 8}px ${C.accentSoft}`,
      fontFamily: C.font,
      whiteSpace: "nowrap",
    }}
  >
    {label}
  </div>
);

/** The full-screen alert UI, scalable so it fits mock monitors too. */
export const AlertUI: React.FC<{ seconds: number; unit?: number }> = ({ seconds, unit = 1 }) => {
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at 50% 32%, #17171f 0%, ${C.bgDeep} 72%)`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 26 * unit,
        fontFamily: C.font,
        color: C.t1,
      }}
    >
      <div
        style={{
          fontSize: 26 * unit,
          fontWeight: 700,
          letterSpacing: "0.32em",
          color: C.accent,
        }}
      >
        STARTING IN
      </div>
      <div
        style={{
          fontSize: 270 * unit,
          fontWeight: 800,
          lineHeight: 1,
          letterSpacing: "-0.02em",
          fontVariantNumeric: "tabular-nums",
          textShadow: "0 0 120px rgba(255,194,51,0.12)",
        }}
      >
        {mm}:{ss}
      </div>
      <div style={{ fontSize: 64 * unit, fontWeight: 700 }}>Command Code Weekly Sync</div>
      <div style={{ display: "flex", gap: 30 * unit, fontSize: 30 * unit, color: C.t2 }}>
        <span>9:00 PM</span>
        <span>🎥 Google Meet</span>
      </div>
      <div style={{ display: "flex", gap: 24 * unit, marginTop: 24 * unit, alignItems: "center" }}>
        <PrimaryBtn label="Join Google Meet →" size={unit} />
        <SecondaryBtn label="Snooze 2 min" size={unit} />
      </div>
      <div style={{ fontSize: 24 * unit, color: C.t3 }}>Dismiss (esc)&nbsp;&nbsp;·&nbsp;&nbsp;Mute this event</div>
    </AbsoluteFill>
  );
};
