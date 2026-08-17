# ⚡ cue

**Your Mac won't let you forget.**

cue is a macOS menu-bar app that takes over *every screen* when something important is about to happen — a meeting, a reminder, a hard stop. Normal notifications slide into a corner and die; cue puts a full-screen countdown in front of you, with one button to act on it.

> If something matters in the next few minutes, you will see it.

Built with [Tauri 2](https://tauri.app) (Rust core + React frontend) and native macOS APIs (EventKit, NSWindow, NSStatusItem).

## What it does

- **Reads your calendar locally** via Apple EventKit — Google Calendar, iCloud, Outlook/Exchange, CalDAV… anything already in macOS Calendar. No OAuth, no accounts, no server. Event data never leaves your Mac.
- **5 minutes before** an event: a small heads-up notification.
- **1 minute before**: full-screen takeover on **every connected monitor**, over full-screen apps, across Spaces, with a live countdown and a **Join Google Meet / Zoom / Teams / Webex** button (links auto-detected from the event).
- **When it starts**: if you never reacted, it takes over again.
- **Snooze** ("give me 2 minutes") reliably comes back. **Dismiss** and **per-event mute** when you don't care.
- **Quick reminders**: press **⌥ Space** anywhere and type `tea in 10m`, `call Ahmed at 9pm`, `stop working at 2am`. Same full-screen treatment, no calendar event needed.
- **Menu bar**: `⚡ 12m` until your next event, join from the menu, pause reminders (1h / until tomorrow / until resumed), test alert, settings.
- **Launch at login** so it's always armed.

During an alert: `Enter` joins, `S` snoozes, `Esc` dismisses, `M` mutes the event.

See [PRD.md](PRD.md) for the full product spec and roadmap (hard stops, focus sessions, presentation-mode detection, urgency profiles…).

## Requirements

- **macOS 14 (Sonoma) or newer** (uses the modern EventKit full-access API)
- To build from source: [Rust](https://rustup.rs) (stable), [Node.js](https://nodejs.org) 20+, Xcode Command Line Tools

## Run it from source

```bash
git clone https://github.com/aliarain/cue.git
cd cue
npm install
npm run tauri dev
```

First run: macOS will ask for **Calendar access** — click Allow, or nothing will ever remind you. The app lives in the menu bar (look for **⚡**); there is no Dock icon. Use **Show Test Alert** from the menu to see the takeover immediately.

> In dev mode the calendar permission is attributed to your terminal app. If you denied it once, re-enable it under **System Settings → Privacy & Security → Calendars** for your terminal (or for cue.app when running the bundled build).

## Build the installable app

```bash
npm run tauri build
```

This produces:

- `src-tauri/target/release/bundle/macos/cue.app`
- `src-tauri/target/release/bundle/dmg/cue_0.1.0_aarch64.dmg`

Drag `cue.app` into `/Applications` (or ship the DMG).

### Installing an unsigned build

Until the app is signed & notarized with an Apple Developer ID, macOS Gatekeeper will complain on other people's machines. Recipients can either **right-click → Open → Open**, or run:

```bash
xattr -cr /Applications/cue.app
```

## Distributing to your team / friends

Two easy paths:

1. **Homebrew** (recommended) — the cask lives in [aliarain/homebrew-tap](https://github.com/aliarain/homebrew-tap):

   ```bash
   brew tap aliarain/tap
   brew trust aliarain/tap   # skips Gatekeeper quarantine for this unsigned app
   brew install --cask cue
   ```

   On older Homebrew versions without `brew trust`, use `brew install --cask --no-quarantine cue`.

2. **GitHub Releases** — grab the DMG from [Releases](https://github.com/aliarain/cue/releases), drag `cue.app` to Applications (see unsigned note above).

New versions: `npm run tauri build`, attach the DMG to a new GitHub release, then bump `version` and `sha256` in the tap's `Casks/cue.rb`.

For friction-free installs (no Gatekeeper workarounds), you'll eventually want an [Apple Developer ID](https://developer.apple.com/programs/) ($99/yr) to sign + notarize the DMG — Tauri supports this out of the box via `APPLE_SIGNING_IDENTITY` / notarization env vars in `tauri build`.

## Privacy

- No account. No backend. No analytics.
- Calendar access happens on-device through EventKit; event titles never leave your Mac.

## Project layout

```
src/                  React frontend (alert screen, quick-add, settings)
src-tauri/src/
  calendar.rs         EventKit bridge (own thread, plain structs out)
  scheduler.rs        1s heartbeat: decides which alert stages fire
  alerts.rs           Full-screen windows per monitor, above everything
  meeting_link.rs     Meet/Zoom/Teams/Webex/Jitsi/Whereby detection
  reminders.rs        "tea in 10m" natural-language parser
  tray.rs             ⚡ menu-bar item + menu
  windows.rs          Quick-add + settings windows
  commands.rs         Frontend ↔ Rust IPC
```

## License

TBD.
