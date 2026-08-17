import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C } from "../theme";
import { Backdrop, SceneFade } from "../ui";

const typed = (text: string, frame: number, start: number, cps = 24) =>
  text.slice(0, Math.max(0, Math.floor(((frame - start) * cps) / 30)));

export const Outro: React.FC<{ frames: number }> = ({ frames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 12 } });

  const lines = [
    { text: "brew tap aliarain/tap", start: 30 },
    { text: "brew install --cask cue", start: 62 },
  ];

  return (
    <SceneFade frames={frames}>
      <Backdrop>
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 48 }}>
          <div style={{ transform: `scale(${pop})`, fontSize: 100, fontWeight: 800 }}>
            ⚡ cue
          </div>
          <div
            style={{
              width: 1000,
              background: "#0d0d12",
              border: `2px solid ${C.borderStrong}`,
              borderRadius: 24,
              padding: "36px 46px",
              fontFamily: "SF Mono, Menlo, monospace",
              fontSize: 40,
              lineHeight: 1.8,
              boxShadow: "0 30px 90px rgba(0,0,0,0.5)",
            }}
          >
            {lines.map((line) => {
              const t = typed(line.text, frame, line.start);
              return (
                <div key={line.text}>
                  <span style={{ color: C.success }}>$ </span>
                  <span style={{ color: C.t1 }}>{t}</span>
                </div>
              );
            })}
            <div
              style={{
                color: C.accent,
                opacity: interpolate(frame, [96, 110], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
              }}
            >
              🍺 cue was successfully installed!
            </div>
          </div>
          <div style={{ fontSize: 40, color: C.t2 }}>
            Free & open source · github.com/aliarain/cue
          </div>
          <div style={{ fontSize: 48, fontWeight: 700 }}>
            Never miss <span style={{ color: C.accent }}>what matters.</span>
          </div>
        </AbsoluteFill>
      </Backdrop>
    </SceneFade>
  );
};
