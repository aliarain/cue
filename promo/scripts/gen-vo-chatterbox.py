"""Generates the cue intro voiceover with Chatterbox (Resemble AI, MIT) —
near-human local TTS. Writes public/vo/sceneN.wav and src/vo-durations.json.

Run:  promo/.venv-tts/bin/python promo/scripts/gen-vo-chatterbox.py
Model weights come from the local Hugging Face cache (~2 GB on first run).
"""

import json
from pathlib import Path

import perth

# The implicit watermarker's native deps don't load on macOS — fall back
# to the no-op watermarker (known upstream workaround).
if getattr(perth, "PerthImplicitWatermarker", None) is None:
    perth.PerthImplicitWatermarker = perth.DummyWatermarker

import torch
import torchaudio

from chatterbox.tts import ChatterboxTTS

ROOT = Path(__file__).resolve().parent.parent
VO = ROOT / "public" / "vo"
VO.mkdir(parents=True, exist_ok=True)

LINES = {
    "scene1": "A notification slides by... and you've missed the meeting.",
    "scene2": "Meet cue. Your Mac won't let you forget.",
    "scene3": "Five minutes out, a live pill floats above everything. One click to join.",
    "scene4": "One minute out, cue takes over every screen. Impossible to miss.",
    "scene5": "And for everything else? Option space. Plain English. Done.",
    "scene6": "cue. Free, private, open source. One brew install away.",
}

device = "mps" if torch.backends.mps.is_available() else "cpu"
if device == "mps":
    # Chatterbox checkpoints load with CUDA map locations; route them to MPS.
    original_load = torch.load

    def patched_load(*args, **kwargs):
        kwargs.setdefault("map_location", torch.device("mps"))
        return original_load(*args, **kwargs)

    torch.load = patched_load

print(f"device: {device}")
model = ChatterboxTTS.from_pretrained(device=device)

durations = {}
for key, text in LINES.items():
    wav = model.generate(text, exaggeration=0.45, cfg_weight=0.5)
    path = VO / f"{key}.wav"
    torchaudio.save(str(path), wav, model.sr)
    durations[key] = round(wav.shape[-1] / model.sr, 3)
    print(f"{path.name}: {durations[key]}s")

(ROOT / "src" / "vo-durations.json").write_text(json.dumps(durations, indent=2) + "\n")
print("wrote src/vo-durations.json")
