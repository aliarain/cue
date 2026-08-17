import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C } from "../theme";
import { Backdrop, SceneFade } from "../ui";

export const Logo: React.FC<{ frames: number }> = ({ frames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const pop = spring({ frame, fps, config: { damping: 11, mass: 0.7 } });
  const tagIn = interpolate(frame, [24, 44], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <SceneFade frames={frames}>
      <Backdrop>
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          <div
            style={{
              transform: `scale(${pop})`,
              fontSize: 220,
              lineHeight: 1,
              textShadow: "0 0 160px rgba(255,194,51,0.45)",
            }}
          >
            ⚡
          </div>
          <div
            style={{
              transform: `scale(${pop})`,
              fontSize: 160,
              fontWeight: 800,
              letterSpacing: "-0.03em",
              marginTop: 10,
            }}
          >
            cue
          </div>
          <div
            style={{
              opacity: tagIn,
              transform: `translateY(${(1 - tagIn) * 24}px)`,
              fontSize: 44,
              color: C.t2,
              marginTop: 26,
            }}
          >
            Your Mac won't let you forget.
          </div>
        </AbsoluteFill>
      </Backdrop>
    </SceneFade>
  );
};
