import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C } from "../theme";
import { Backdrop, PrimaryBtn, SceneFade, SecondaryBtn } from "../ui";

const highlight = (frame: number, start: number, end: number) =>
  interpolate(frame, [start, start + 10, end - 10, end], [0, 1, 1, 0.25], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

export const Actions: React.FC<{ frames: number }> = ({ frames }) => {
  const frame = useCurrentFrame();
  const third = frames / 3;

  const joinH = highlight(frame, 8, third);
  const snoozeH = highlight(frame, third, third * 2);
  const dismissH = highlight(frame, third * 2, frames - 8);

  const item = (
    h: number,
    btn: React.ReactNode,
    caption: string,
  ): React.ReactNode => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 34,
        opacity: 0.35 + 0.65 * h,
        transform: `scale(${1 + h * 0.07})`,
      }}
    >
      {btn}
      <div style={{ fontSize: 34, color: C.t2, opacity: h }}>{caption}</div>
    </div>
  );

  return (
    <SceneFade frames={frames}>
      <Backdrop>
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 90 }}>
          <div style={{ fontSize: 70, fontWeight: 800 }}>One decision. One click.</div>
          <div style={{ display: "flex", gap: 80, alignItems: "flex-start" }}>
            {item(joinH, <PrimaryBtn label="Join →" ring={joinH} />, "straight into the call")}
            {item(snoozeH, <SecondaryBtn label="Snooze 2 min" ring={snoozeH} />, "it always comes back")}
            {item(
              dismissH,
              <div
                style={{
                  fontSize: 36,
                  color: C.t3,
                  padding: "30px 40px",
                  border: `2px dashed ${C.borderStrong}`,
                  borderRadius: 28,
                }}
              >
                Dismiss (esc)
              </div>,
              "back to work",
            )}
          </div>
        </AbsoluteFill>
      </Backdrop>
    </SceneFade>
  );
};
