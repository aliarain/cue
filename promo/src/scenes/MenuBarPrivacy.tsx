import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C } from "../theme";
import { SceneFade } from "../ui";

const menuItems = [
  { label: "Next: Design Review — 9:00 PM", dim: true },
  { label: "Join Next Meeting" },
  { label: "Quick Reminder…    ⌥Space" },
  { label: "Pause Reminders    ▸" },
  { label: "Show Test Alert" },
  { label: "Settings…" },
];

const chips = ["🔒 No accounts", "☁️ No cloud", "🛡 100% on-device"];

export const MenuBarPrivacy: React.FC<{ frames: number }> = ({ frames }) => {
  const frame = useCurrentFrame();

  const pulse = 1 + 0.06 * Math.sin(frame / 6);
  const chipsStart = Math.round(frames * 0.52);
  // Dropdown shows while the VO talks about the menu bar, then hands the
  // stage to the privacy chips.
  const menuIn = interpolate(
    frame,
    [26, 44, chipsStart - 24, chipsStart - 8],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <SceneFade frames={frames}>
      <AbsoluteFill style={{ background: C.bgDeep, fontFamily: C.font, color: C.t1 }}>
        {/* macOS menu bar */}
        <div
          style={{
            height: 66,
            background: "rgba(30,30,38,0.95)",
            borderBottom: `1px solid ${C.borderStrong}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 40,
            padding: "0 50px",
            fontSize: 30,
            color: C.t2,
          }}
        >
          <span
            style={{
              color: C.t1,
              fontWeight: 700,
              background: C.accentSoft,
              border: `2px solid ${C.accent}`,
              borderRadius: 12,
              padding: "4px 18px",
              transform: `scale(${pulse})`,
            }}
          >
            ⚡ 12m
          </span>
          <span>🔋</span>
          <span>📶</span>
          <span>Mon 8:48 PM</span>
        </div>

        {/* Dropdown */}
        <div
          style={{
            position: "absolute",
            top: 76,
            right: 330,
            width: 560,
            background: "rgba(26,26,34,0.98)",
            border: `1px solid ${C.borderStrong}`,
            borderRadius: 22,
            padding: "16px 0 20px",
            boxShadow: "0 30px 90px rgba(0,0,0,0.6)",
            opacity: menuIn,
            transform: `translateY(${(1 - menuIn) * -16}px)`,
          }}
        >
          {menuItems.map((item, i) => (
            <div
              key={i}
              style={{
                padding: "16px 30px",
                fontSize: 30,
                color: item.dim ? C.t3 : C.t1,
                borderBottom: i === 0 || i === 3 ? `1px solid ${C.border}` : "none",
              }}
            >
              {item.label}
            </div>
          ))}
        </div>

        {/* Privacy chips */}
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", paddingTop: 220 }}>
          <div
            style={{
              fontSize: 72,
              fontWeight: 800,
              marginBottom: 60,
              opacity: interpolate(frame, [chipsStart - 14, chipsStart], [0.25, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            Quiet until it matters.
          </div>
          <div style={{ display: "flex", gap: 40 }}>
            {chips.map((chip, i) => {
              const inAt = chipsStart + i * 12;
              const o = interpolate(frame, [inAt, inAt + 12], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });
              return (
                <div
                  key={chip}
                  style={{
                    opacity: o,
                    transform: `translateY(${(1 - o) * 30}px)`,
                    background: C.raised,
                    border: `2px solid ${C.borderStrong}`,
                    borderRadius: 999,
                    padding: "22px 44px",
                    fontSize: 40,
                    fontWeight: 700,
                  }}
                >
                  {chip}
                </div>
              );
            })}
          </div>
          <div
            style={{
              marginTop: 50,
              fontSize: 34,
              color: C.t2,
              opacity: interpolate(frame, [chipsStart + 40, chipsStart + 55], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            Your calendar is read locally with EventKit. Nothing leaves your Mac.
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
    </SceneFade>
  );
};
