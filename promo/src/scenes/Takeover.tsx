import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { C } from "../theme";
import { AlertUI, SceneFade } from "../ui";

/** Full takeover, then zoom out to show it on three monitors at once. */
export const Takeover: React.FC<{ frames: number }> = ({ frames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const seconds = Math.max(43, 59 - Math.floor(frame / fps));
  const splitAt = Math.round(frames * 0.62);
  const fullOpacity = interpolate(frame, [splitAt - 10, splitAt + 6], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const multiOpacity = 1 - fullOpacity;
  const zoomIn = interpolate(frame, [0, 30], [1.05, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <SceneFade frames={frames}>
      <AbsoluteFill style={{ background: C.bgDeep, fontFamily: C.font }}>
        {/* Stage 1: the takeover itself */}
        <AbsoluteFill style={{ opacity: fullOpacity, transform: `scale(${zoomIn})` }}>
          <AlertUI seconds={seconds} />
        </AbsoluteFill>

        {/* Stage 2: every monitor */}
        <AbsoluteFill
          style={{
            opacity: multiOpacity,
            alignItems: "center",
            justifyContent: "center",
            gap: 50,
          }}
        >
          <div style={{ display: "flex", gap: 56, alignItems: "flex-end" }}>
            {[0.62, 0.85, 0.62].map((s, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div
                  style={{
                    width: 720 * s,
                    height: 440 * s,
                    borderRadius: 18,
                    border: `3px solid ${C.borderStrong}`,
                    overflow: "hidden",
                    position: "relative",
                    boxShadow: "0 30px 90px rgba(0,0,0,0.55)",
                  }}
                >
                  <AlertUI seconds={seconds} unit={0.22 * s * 1.6} />
                </div>
                <div
                  style={{
                    width: 90 * s,
                    height: 54 * s,
                    background: C.raised,
                    clipPath: "polygon(20% 0, 80% 0, 100% 100%, 0 100%)",
                  }}
                />
              </div>
            ))}
          </div>
          <div style={{ fontSize: 58, fontWeight: 800 }}>
            Every monitor. Every Space.{" "}
            <span style={{ color: C.accent }}>Impossible to miss.</span>
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
    </SceneFade>
  );
};
