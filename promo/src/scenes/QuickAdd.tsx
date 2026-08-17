import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C } from "../theme";
import { Backdrop, SceneFade } from "../ui";

const typed = (text: string, frame: number, start: number, cps = 16) =>
  text.slice(0, Math.max(0, Math.floor(((frame - start) * cps) / 30)));

const Key: React.FC<{ label: string }> = ({ label }) => (
  <span
    style={{
      display: "inline-block",
      background: C.control,
      border: `2px solid ${C.borderStrong}`,
      borderBottomWidth: 6,
      borderRadius: 14,
      padding: "10px 26px",
      fontSize: 40,
      fontWeight: 700,
      margin: "0 8px",
    }}
  >
    {label}
  </span>
);

export const QuickAdd: React.FC<{ frames: number }> = ({ frames }) => {
  const frame = useCurrentFrame();

  // Two demo entries, one after the other.
  const firstStart = 40;
  const secondStart = Math.round(frames * 0.55);
  const first = "tea in 10m";
  const second = "call Ahmed at 9pm";
  const inSecond = frame >= secondStart;
  const text = inSecond ? typed(second, frame, secondStart) : typed(first, frame, firstStart);
  const done = inSecond
    ? text.length === second.length
    : text.length === first.length;
  const hint = inSecond ? "⏰ call Ahmed — 9:00 PM (in 47m)" : "⏰ tea — 9:41 PM (in 10m)";

  const caret = Math.floor(frame / 14) % 2 === 0;
  const keysIn = interpolate(frame, [6, 24], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <SceneFade frames={frames}>
      <Backdrop>
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 60 }}>
          <div style={{ opacity: keysIn, fontSize: 40, color: C.t2 }}>
            Press <Key label="⌥" /> <Key label="space" /> anywhere
          </div>
          <div
            style={{
              width: 1180,
              background: "rgba(18,18,24,0.97)",
              border: `2px solid ${C.borderStrong}`,
              borderRadius: 30,
              padding: "34px 44px 26px",
              boxShadow: "0 36px 100px rgba(0,0,0,0.55)",
            }}
          >
            <div style={{ fontSize: 52, fontWeight: 500, minHeight: 64 }}>
              {text}
              <span style={{ opacity: caret ? 1 : 0, color: C.accent }}>|</span>
              {text.length === 0 && (
                <span style={{ color: C.t3 }}>tea in 10m · call Ahmed at 9pm…</span>
              )}
            </div>
            <div
              style={{
                marginTop: 18,
                fontSize: 30,
                color: done ? C.success : C.t2,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {done ? `✓ ${hint}` : text.length > 3 ? hint : "Enter to save · Esc to close"}
            </div>
          </div>
          <div style={{ fontSize: 58, fontWeight: 800 }}>
            Plain English → <span style={{ color: C.accent }}>full-screen reminder.</span>
          </div>
        </AbsoluteFill>
      </Backdrop>
    </SceneFade>
  );
};
