import React from "react";
import { Composition } from "remotion";
import { CueIntro, FPS, totalFrames } from "./Video";

export const Root: React.FC = () => (
  <Composition
    id="CueIntro"
    component={CueIntro}
    durationInFrames={totalFrames()}
    fps={FPS}
    width={1920}
    height={1080}
  />
);
