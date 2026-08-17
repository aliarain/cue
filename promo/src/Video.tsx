import React from "react";
import {
  AbsoluteFill,
  Audio,
  interpolate,
  Sequence,
  Series,
  staticFile,
} from "remotion";
import durations from "./vo-durations.json";
import { Problem } from "./scenes/Problem";
import { Logo } from "./scenes/Logo";
import { Pill } from "./scenes/Pill";
import { Takeover } from "./scenes/Takeover";
import { QuickAdd } from "./scenes/QuickAdd";
import { Outro } from "./scenes/Outro";

export const FPS = 30;
const PAD = 0.5; // silence before/after each VO line

type SceneDef = {
  vo: keyof typeof durations;
  minSec: number;
  Component: React.FC<{ frames: number }>;
};

const SCENES: SceneDef[] = [
  { vo: "scene1", minSec: 4.6, Component: Problem },
  { vo: "scene2", minSec: 3.6, Component: Logo },
  { vo: "scene3", minSec: 5.4, Component: Pill },
  { vo: "scene4", minSec: 5.6, Component: Takeover },
  { vo: "scene5", minSec: 6, Component: QuickAdd },
  { vo: "scene6", minSec: 6, Component: Outro },
];

export const sceneFrames = (scene: SceneDef) =>
  Math.round(Math.max(durations[scene.vo] + PAD * 2, scene.minSec) * FPS);

export const totalFrames = () => SCENES.reduce((sum, s) => sum + sceneFrames(s), 0);

export const CueIntro: React.FC = () => {
  const total = totalFrames();
  return (
    <AbsoluteFill>
      <Series>
        {SCENES.map((scene) => {
          const frames = sceneFrames(scene);
          return (
            <Series.Sequence key={scene.vo} durationInFrames={frames}>
              <scene.Component frames={frames} />
              <Sequence from={Math.round(PAD * FPS)}>
                <Audio src={staticFile(`vo/${scene.vo}.wav`)} />
              </Sequence>
            </Series.Sequence>
          );
        })}
      </Series>
      {/* Ambient bed under everything, ducked below the voice. */}
      <Audio
        src={staticFile("music.wav")}
        volume={(f) =>
          interpolate(f, [0, 30, total - 70, total - 8], [0, 0.5, 0.5, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        }
      />
    </AbsoluteFill>
  );
};
