import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C } from "../theme";
import { SceneFade } from "../ui";

const codeLine = (w: number, indent: number, tint: string) => (
  <div
    style={{
      height: 22,
      width: w,
      marginLeft: indent,
      marginBottom: 20,
      borderRadius: 8,
      background: tint,
    }}
  />
);

export const Problem: React.FC<{ frames: number }> = ({ frames }) => {
  const frame = useCurrentFrame();

  const notifX = interpolate(frame, [18, 34, 92, 108], [480, 0, 0, 40], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const notifOpacity = interpolate(frame, [18, 34, 92, 108], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const missedIn = interpolate(frame, [128, 146], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <SceneFade frames={frames}>
      <AbsoluteFill style={{ background: C.bgDeep, fontFamily: C.font }}>
        {/* Fake editor window the user is lost inside */}
        <div
          style={{
            position: "absolute",
            inset: "120px 240px",
            background: C.surface,
            border: `2px solid ${C.border}`,
            borderRadius: 24,
            padding: "70px 80px",
            opacity: 0.85,
          }}
        >
          <div style={{ display: "flex", gap: 14, marginBottom: 50 }}>
            {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
              <div key={c} style={{ width: 20, height: 20, borderRadius: "50%", background: c }} />
            ))}
          </div>
          {codeLine(420, 0, "rgba(255,194,51,0.25)")}
          {codeLine(620, 60, "rgba(255,255,255,0.10)")}
          {codeLine(520, 60, "rgba(255,255,255,0.10)")}
          {codeLine(720, 120, "rgba(122,162,255,0.18)")}
          {codeLine(380, 120, "rgba(255,255,255,0.10)")}
          {codeLine(560, 60, "rgba(53,199,90,0.16)")}
          {codeLine(300, 0, "rgba(255,255,255,0.10)")}
          {codeLine(660, 60, "rgba(255,255,255,0.08)")}
        </div>

        {/* The notification that slips away */}
        <div
          style={{
            position: "absolute",
            top: 60,
            right: 60,
            transform: `translateX(${notifX}px)`,
            opacity: notifOpacity,
            background: "rgba(40,40,48,0.95)",
            border: `1px solid ${C.borderStrong}`,
            borderRadius: 20,
            padding: "22px 30px",
            width: 420,
            boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          }}
        >
          <div style={{ fontSize: 22, fontWeight: 700, color: C.t1, marginBottom: 6 }}>
            📅 Calendar
          </div>
          <div style={{ fontSize: 24, color: C.t2 }}>Design Review in 5 minutes</div>
        </div>

        {/* The damage */}
        <AbsoluteFill
          style={{
            alignItems: "center",
            justifyContent: "center",
            opacity: missedIn,
          }}
        >
          <div
            style={{
              background: "rgba(8,8,12,0.85)",
              padding: "60px 90px",
              borderRadius: 32,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 100, fontWeight: 800, color: C.danger }}>
              Meeting missed.
            </div>
            <div style={{ fontSize: 40, color: C.t2, marginTop: 20 }}>
              The notification was there. You weren't looking.
            </div>
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
    </SceneFade>
  );
};
