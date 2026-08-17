import React from "react";
import { Audio, Sequence, Series, staticFile } from "remotion";
import durations from "./vo-durations.json";
import { Problem } from "./scenes/Problem";
import { Logo } from "./scenes/Logo";
import { Pill } from "./scenes/Pill";
import { Takeover } from "./scenes/Takeover";
import { Actions } from "./scenes/Actions";
import { QuickAdd } from "./scenes/QuickAdd";
import { MenuBarPrivacy } from "./scenes/MenuBarPrivacy";
import { Outro } from "./scenes/Outro";

export const FPS = 30;
const PAD = 0.55; // silence before/after each VO line

type SceneDef = {
  vo: keyof typeof durations;
  minSec: number;
  Component: React.FC<{ frames: number }>;
};

const SCENES: SceneDef[] = [
  { vo: "scene1", minSec: 0, Component: Problem },
  { vo: "scene2", minSec: 4, Component: Logo },
  { vo: "scene3", minSec: 0, Component: Pill },
  { vo: "scene4", minSec: 0, Component: Takeover },
  { vo: "scene5", minSec: 0, Component: Actions },
  { vo: "scene6", minSec: 9.5, Component: QuickAdd },
  { vo: "scene7", minSec: 0, Component: MenuBarPrivacy },
  { vo: "scene8", minSec: 7, Component: Outro },
];

export const sceneFrames = (scene: SceneDef) =>
  Math.round(Math.max(durations[scene.vo] + PAD * 2, scene.minSec) * FPS);

export const totalFrames = () => SCENES.reduce((sum, s) => sum + sceneFrames(s), 0);

export const CueIntro: React.FC = () => (
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
);
