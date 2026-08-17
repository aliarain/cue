// Synthesizes the intro's ambient bed: a warm pad drifting through a
// Cmaj9 → Am9 → Fmaj9 → G(add9) progression, twice over 45 seconds.
// Pure sines with soft envelopes — no samples, nothing to license.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SR = 44100;
const DURATION = Number(process.argv[2]) || 46;
const TOTAL = SR * DURATION;

const midiToFreq = (m) => 440 * 2 ** ((m - 69) / 12);

// Chord tones as MIDI notes (roots low, color notes high).
const CHORDS = [
  [36, 43, 52, 64, 74], // Cmaj9
  [33, 40, 48, 60, 71], // Am9
  [29, 36, 45, 57, 67], // Fmaj9
  [31, 38, 47, 59, 69], // G(add9)
];
const SEGMENTS = Number(process.argv[3]) || 8;
const SEG_LEN = DURATION / SEGMENTS;

const left = new Float64Array(TOTAL);
const right = new Float64Array(TOTAL);

for (let seg = 0; seg < SEGMENTS; seg++) {
  const chord = CHORDS[seg % CHORDS.length];
  const start = seg * SEG_LEN;
  chord.forEach((note, voice) => {
    const freq = midiToFreq(note);
    const amp = note < 44 ? 0.16 : 0.1 / (voice + 1) + 0.045;
    // Two slightly detuned voices, panned apart for width.
    for (const [detune, buf] of [
      [1.0012, left],
      [0.9988, right],
    ]) {
      const w = 2 * Math.PI * freq * detune;
      for (let i = 0; i < SEG_LEN * SR; i++) {
        const t = i / SR;
        const global = start + t;
        const index = Math.floor(global * SR);
        if (index >= TOTAL) break;
        // Soft swell: 1.6s attack, 1.8s release inside the segment.
        const env =
          Math.min(1, t / 1.6) * Math.min(1, (SEG_LEN - t) / 1.8);
        // Gentle shimmer from a 2nd partial that fades over the segment.
        const sample =
          Math.sin(w * global) * env +
          Math.sin(2 * w * global) * env * 0.18 * (1 - t / SEG_LEN);
        buf[index] += sample * amp;
      }
    }
  });
}

// Master envelope: 1s fade-in, 3.5s fade-out, light soft-clip glue.
for (let i = 0; i < TOTAL; i++) {
  const t = i / SR;
  const master =
    Math.min(1, t / 1) * Math.min(1, (DURATION - t) / 3.5) * 0.42;
  left[i] = Math.tanh(left[i] * master);
  right[i] = Math.tanh(right[i] * master);
}

// 16-bit stereo WAV.
const data = Buffer.alloc(TOTAL * 4);
for (let i = 0; i < TOTAL; i++) {
  data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, left[i])) * 32767), i * 4);
  data.writeInt16LE(
    Math.round(Math.max(-1, Math.min(1, right[i])) * 32767),
    i * 4 + 2,
  );
}
const header = Buffer.alloc(44);
header.write("RIFF", 0);
header.writeUInt32LE(36 + data.length, 4);
header.write("WAVE", 8);
header.write("fmt ", 12);
header.writeUInt32LE(16, 16);
header.writeUInt16LE(1, 20);
header.writeUInt16LE(2, 22);
header.writeUInt32LE(SR, 24);
header.writeUInt32LE(SR * 4, 28);
header.writeUInt16LE(4, 32);
header.writeUInt16LE(16, 34);
header.write("data", 36);
header.writeUInt32LE(data.length, 40);

const out = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "public",
  process.argv[4] || "music.wav",
);
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, Buffer.concat([header, data]));
console.log(`wrote ${out} (${((44 + data.length) / 1e6).toFixed(1)} MB)`);
