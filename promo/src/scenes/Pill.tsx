import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C } from "../theme";
import { HeadsUpPill, SceneFade } from "../ui";

export const Pill: React.FC<{ frames: number }> = ({ frames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const drop = spring({ frame: frame - 14, fps, config: { damping: 13 } });
  const glow = interpolate(frame, [frames - 70, frames - 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const label = interpolate(frame, [40, 58], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <SceneFade frames={frames}>
      <AbsoluteFill style={{ background: C.bgDeep, fontFamily: C.font }}>
        {/* Dimmed workspace behind */}
        <div
          style={{
            position: "absolute",
            inset: "160px 200px 120px",
            background: C.surface,
            border: `2px solid ${C.border}`,
            borderRadius: 24,
            opacity: 0.5,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 60,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            transform: `translateY(${(drop - 1) * 140}px)`,
            opacity: Math.min(1, drop * 1.4),
          }}
        >
          <HeadsUpPill
            title="Design Review"
            suffix="starts in 3 minutes"
            cta="Join Google Meet"
            glow={glow}
          />
        </div>
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", paddingTop: 160 }}>
          <div style={{ opacity: label, textAlign: "center" }}>
            <div style={{ fontSize: 76, fontWeight: 800 }}>A heads-up, not a hijack.</div>
            <div style={{ fontSize: 38, color: C.t2, marginTop: 18 }}>
              Floats above every app · never steals your keyboard
            </div>
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
    </SceneFade>
  );
};
