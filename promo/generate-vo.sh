#!/bin/bash
# Generate the voiceover for the cue intro video with macOS TTS (Samantha),
# convert to wav, and emit per-scene durations into src/vo-durations.json.
set -euo pipefail
cd "$(dirname "$0")"

VOICE="Samantha"
RATE=178

scenes=(
  "You're deep in your work. A notification slides by, and disappears. Twenty minutes later? You've missed the meeting."
  "Meet cue. Your Mac won't let you forget."
  "Five minutes before an event, a live status pill floats above whatever you're doing. One button, and you're in the meeting."
  "One minute out, cue takes over. Every screen. Every space. Even over full-screen apps. A countdown you can read from across the room."
  "Join in one click. Snooze it, and it always comes back. Or dismiss it, and get back to work."
  "Need a reminder? Press option space, and just type. Tea in ten minutes. Call Ahmed at nine. Plain English becomes a full-screen alert."
  "cue lives quietly in your menu bar, counting down to what's next. And everything stays on your Mac. No accounts. No cloud. No tracking."
  "cue. Free, open source, and one brew install away. Never miss what matters."
)

echo "{" > src/vo-durations.json
for i in "${!scenes[@]}"; do
  n=$((i + 1))
  say -v "$VOICE" -r "$RATE" -o "public/vo/scene$n.aiff" "${scenes[$i]}"
  ffmpeg -y -loglevel error -i "public/vo/scene$n.aiff" -ar 44100 -ac 2 "public/vo/scene$n.wav"
  rm "public/vo/scene$n.aiff"
  dur=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "public/vo/scene$n.wav")
  comma=","
  [ "$n" -eq "${#scenes[@]}" ] && comma=""
  printf '  "scene%s": %.3f%s\n' "$n" "$dur" "$comma" >> src/vo-durations.json
done
echo "}" >> src/vo-durations.json
cat src/vo-durations.json
