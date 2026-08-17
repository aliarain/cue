# PRD — Unmissable Mac Reminders

## 1. Product

**Working name:** cue

A native macOS menu-bar app that takes over the user's screens when something important is about to happen.

Instead of relying on normal macOS notifications that disappear in the corner, the product creates an intentional full-screen interruption with a countdown and clear action.

The product handles:

* Calendar meetings
* Personal reminders
* Hard-stop reminders
* Focus-session endings
* Back-to-back meeting warnings

The core promise:

> **If something matters in the next few minutes, you will see it.**

---

# 2. Problem

Normal notifications are too easy to miss.

Users working deeply inside:

* VS Code
* Cursor
* browsers
* games
* full-screen apps
* multiple monitors
* terminal sessions

can miss calendar notifications entirely.

The reference product, Unforget, solves this by placing a full-screen reminder on every monitor shortly before an event. It reads calendars locally through Apple's EventKit and can detect meeting links inside events.

We build around the same core problem but expand beyond calendar meetings.

---

# 3. Target Users

### Primary

Knowledge workers who frequently work in deep focus:

* Software engineers
* Founders
* Designers
* Product managers
* ADHD / neurodivergent users
* Remote workers

### Secondary

Anyone who frequently says:

> "Fuck, I forgot the meeting."

or

> "I was working and completely lost track of time."

---

# 4. Core Product Loop

Calendar event exists →

App detects upcoming event →

Countdown begins →

User gets optional early warning →

At configured threshold the app takes over every screen →

User either:

**Join**

**Snooze**

**Dismiss**

or

**Mute this event**

After acting, the user immediately goes back to work.

There should be almost no interaction with the app itself.

---

# 5. MVP Features — P0

These are required before shipping.

## P0.1 Calendar Integration

Use native macOS `EventKit`.

Read events from calendars already configured inside macOS Calendar.

That automatically covers calendars such as:

* Google Calendar
* iCloud
* Microsoft 365
* Outlook / Exchange
* CalDAV

without separately implementing OAuth for each provider. Unforget uses the same approach.

Requirements:

* Request Calendar permission
* Read upcoming events
* Refresh when calendar changes
* Ignore declined events
* Ignore all-day events
* Handle recurring meetings
* Handle edited/cancelled meetings

---

## P0.2 Full-Screen Alert

This is the product.

Create one alert window **per connected monitor**.

The alert must:

* appear over normal apps
* appear over full-screen applications where macOS allows
* appear across Spaces
* appear simultaneously on every monitor
* immediately receive attention
* close everywhere when acted upon

Reference Unforget explicitly creates separate windows for detected displays.

### Alert contents

Large:

**Meeting title**

Example:

> Command Code Weekly Sync

Then:

**Starts in 00:58**

Visual countdown ring/bar.

Metadata:

> 9:00 PM
> Google Meet

Primary CTA:

**Join Meeting**

Secondary:

**Snooze 2 min**

Small:

**Dismiss**

---

# P0.3 Meeting Link Detection

Search:

* Event URL
* Location
* Notes / description

Detect at least:

* Google Meet
* Zoom
* Microsoft Teams
* Webex
* Jitsi
* Whereby

This matches the main meeting providers handled by the reference product.

If detected:

> Join Google Meet

If no meeting URL exists:

> Open Calendar

---

# P0.4 Reminder Timing

Defaults:

### 5 minutes before

Small notification.

### 1 minute before

Full-screen takeover.

### Meeting started

If the user didn't interact:

Full-screen reminder again.

Example:

> The meeting has started.

CTA:

**Join now**

Users can independently enable/disable alert stages.

---

# P0.5 Snooze

User can press:

**Give me 2 minutes**

The alert disappears.

Exactly two minutes later it returns.

This should never behave like dismissal.

---

# P0.6 Menu Bar App

No persistent main window.

Menu-bar display:

> ⚡ 12m

Meaning next event starts in 12 minutes.

Click:

### Next

Command Code Sync
9:00 PM
in 12 minutes

**Join**

---

**Quick Reminder**

---

**Pause reminders**

* 1 hour
* Until tomorrow
* Until manually resumed

---

**Show test alert**

**Settings**

**Quit**

---

# P0.7 Quick Reminder

Global keyboard shortcut:

**⌥ Space**

opens a tiny input.

User types:

> call Ahmed in 20 minutes

or

> stop working at 2am

or

> pizza out in 12 minutes

Parse locally.

Create an internal scheduled reminder.

No calendar event required.

At the specified time:

**full-screen reminder.**

Unforget also supports plain-language quick reminders; ours should make this one of the primary workflows rather than a secondary feature.

---

# P0.8 Launch at Login

The app is useless if the user forgets to launch the reminder app.

First launch:

> Start automatically when your Mac starts?

Default recommendation:

**Enable**

---

# P0.9 Test Alert

During onboarding:

**Try an alert**

Then instantly trigger the real full-screen UI.

This solves two problems:

1. user understands what the product does
2. we verify display/window permissions and behavior

---

# 6. Differentiating Features — P1

This is where we stop being an Unforget clone.

## P1.1 Hard Stops

Allow users to create a hard boundary.

Example:

> Stop coding at 1:00 AM.

At 12:55:

> Five minutes left.

At 1:00:

FULL SCREEN

> That's enough for tonight.

Actions:

**I'm done**

**10 more minutes**

This makes the app useful outside meetings.

---

# P1.2 Focus Session

Menu bar:

**Start Focus**

Options:

* 25 min
* 45 min
* 60 min
* Custom

Example:

> Focus for 45 minutes

During focus:

normal reminders can optionally stay quiet.

At completion:

full-screen takeover.

> Focus session finished.

This turns the product into a transition system rather than another timer.

---

# P1.3 Back-to-Back Meeting Guard

If:

Meeting A ends at 14:00

and

Meeting B begins at 14:00

then at 13:55:

> This meeting ends in 5 minutes.

> Design Review is next.

CTA:

**View next meeting**

The reference product calls this a hard-stop alert.

---

# P1.4 Intelligent Presentation Mode

Detect apps such as:

* Zoom
* Meet browser tabs where possible
* Microsoft Teams
* Slack calls
* FaceTime
* OBS
* Keynote
* screen recording software

If user appears to be presenting:

do NOT suddenly cover the entire display.

Use a discreet overlay instead.

Retry after the call.

This protects the product from one catastrophic UX failure:

**showing a giant personal reminder while the user is screen-sharing.**

---

# P1.5 Calendar Filtering

Settings → Calendars

Allow:

✓ Work
✓ Personal
✗ Birthdays
✗ Holidays

Keyword exclusions:

> focus time

> lunch

> blocker

> out of office

Events containing them don't generate alerts.

---

# P1.6 Per-Event Mute

Menu bar:

Next event:

> Lunch

**Don't remind me**

Store the event ID and ignore it.

---

# P1.7 Urgency Profiles

Instead of making users configure ten settings:

### Gentle

5 min notification
1 min takeover

### Normal

5 min takeover
1 min takeover

### Nuclear

15 min
5 min
1 min
meeting start

all full-screen.

This could become one of our clearest differentiators.

---

# P1.8 Global Command Bar

Shortcut:

**⌥ Space**

Input:

> remind me in 20m

> meeting in 10m

> focus 45m

> stop me at 2am

> pause reminders 2h

The command bar becomes the fastest interface to the entire application.

---

# 7. P2 Features

Do these only after people actually use the core product.

## Natural Language Improvements

Understand:

> tomorrow 9am

> after lunch

> Friday evening

> every Monday at 9

---

## Recurring Personal Reminders

Examples:

> Every day at 11pm take medicine.

> Every Friday submit timesheet.

---

## Spoken Alerts

macOS speech:

> Ali, your design review starts in one minute.

Optional only.

---

## Custom Sounds

Alert sounds:

* subtle
* bell
* digital
* alarm
* custom

---

## Custom Alert Themes

Start with:

### Minimal

Black background.

### Light

White clean UI.

### Neon

Bright/high contrast.

### Terminal

Developer aesthetic.

Eventually let users customize:

* accent colour
* background
* typography
* animation
* sound

Unforget already offers eight styles, custom accent colours, and custom logos, so visuals alone aren't enough differentiation.

---

## Keyboard-Only Controls

During an alert:

`Enter` → Join

`S` → Snooze

`Esc` → Dismiss

`M` → Mute event

---

# 8. Settings

## General

Launch at login

Menu bar visibility

Dock visibility

Language

Start of week

---

## Alerts

15-minute alert

5-minute alert

1-minute alert

After-start alert

Snooze duration

Sound

Speech

Urgency profile

---

## Calendars

Calendar selector

Ignored keywords

Ignore all-day events

Ignore declined meetings

---

## Focus

Default session duration

Hard-stop behaviour

Automatic quiet mode

---

## Appearance

Theme

Accent

Animations

Reduced motion

---

## Privacy

Calendar data stays local.

No account required for MVP.

No event information sent to our servers.

---

# 9. Onboarding

### Screen 1

# Never miss the thing you actually care about.

Your Mac already knows what's next.

We'll make sure you see it.

**Continue**

---

### Screen 2

# Calendar Access

We need access to upcoming events so we know when to remind you.

Everything stays on your Mac.

**Allow Calendar Access**

---

### Screen 3

# How much warning do you want?

✓ 5 minutes

✓ 1 minute

✓ After meeting starts

---

### Screen 4

# See what happens.

**Trigger test alert**

Immediately show the actual experience.

---

### Screen 5

# You're done.

⚡ Next meeting in 34 min.

**Start at Login ✓**

**Done**

---

# 10. Alert UI

The design needs to be extremely simple.

No traditional settings-looking UI.

Full screen:

---

### STARTING IN

# 00:58

## Command Code Weekly Sync

9:00 PM

🎥 Google Meet

### Join Google Meet →

Snooze 2 minutes

Dismiss

---

The countdown should be the visual anchor.

The user should understand the screen from several feet away.

---

# 11. Technical Direction

## Platform

**Tauri (Rust core + web frontend), targeting macOS.**

> Note: the original draft recommended Swift + SwiftUI. Decision made to build with **Tauri** instead. Tauri gives us a small binary, low resource usage, and a Rust backend, while native macOS capabilities (EventKit, NSWindow level/collection behavior, NSStatusItem, SMAppService, NSWorkspace) are reached via Rust ↔ Objective-C bridging (`objc2` / `objc2-event-kit` / `cocoa` crates) or small native plugins.

The product depends heavily on:

* EventKit (via Rust ↔ ObjC bridge)
* NSWindow behaviour (window level, joins-all-Spaces collection behavior)
* multiple displays (one alert window per monitor)
* Spaces
* full-screen overlays
* Login Items
* native menu bar behaviour (Tauri tray / NSStatusItem)
* application detection (NSWorkspace)
* low background resource usage

Do not build the core application with Electron.

---

# 12. macOS APIs

Core (accessed from the Tauri/Rust side via objc2 bindings or native plugin code):

`EventKit`

Calendar access.

`NSStatusItem`

Menu-bar application (Tauri tray API where sufficient).

`NSWindow`

Full-screen overlay windows (raise window level, set collection behavior for Spaces/full-screen).

`NSScreen`

Connected monitors.

`SMAppService`

Launch at login.

`NSWorkspace`

Detect active/running applications.

`AVSpeechSynthesizer`

Optional spoken alerts.

---

# 13. Architecture

```text
App (Tauri)
│
├── CalendarService (Rust ↔ EventKit bridge)
│
├── EventScheduler
│   ├── Upcoming Events
│   ├── Alert Scheduling
│   └── Snoozes
│
├── MeetingLinkParser
│   ├── Meet
│   ├── Zoom
│   ├── Teams
│   └── Webex
│
├── ReminderService
│   ├── Natural Language Parser
│   └── Local Reminders
│
├── AlertCoordinator
│   └── AlertWindow per screen (Tauri window per monitor, NSWindow tweaks)
│
├── PresentationDetector
│
├── MenuBarController (tray)
│
├── SettingsStore
│
└── LaunchAtLoginService
```

No backend required for V1.

---

# 14. Local Storage

Use:

Tauri store / plain JSON config

for basic preferences.

Use:

SQLite (via `tauri-plugin-sql` or `rusqlite`)

for:

* quick reminders
* snoozes
* muted events
* recurring reminders
* alert history

---

# 15. Privacy

For V1:

**No authentication.**

**No backend.**

**No analytics containing calendar data.**

**No event titles leave the device.**

Calendar access happens through EventKit.

The reference product similarly reads events locally and advertises no network entitlement and no collected data.

Privacy should be part of the product, not just a policy page.

---

# 16. Things We Should NOT Build Initially

Do not build:

* accounts
* cloud sync
* Windows
* mobile applications
* team dashboards
* AI chatbot
* project management
* task lists
* Slack integration
* Notion integration
* collaborative calendars
* web dashboard

These destroy the simplicity of the product.

---

# 17. MVP Definition

V1 is complete when I can:

1. Install the app.
2. Grant Calendar permission.
3. See my next meeting in the menu bar.
4. Receive an alert one minute before it starts.
5. See that alert on every monitor.
6. Click one button to join the meeting.
7. Snooze it and reliably see it return.
8. Create a reminder like `tea in 10m`.
9. Receive the same full-screen alert for that reminder.
10. Restart my Mac and have the app launch automatically.

Everything beyond that is optional.

---

# 18. Product Direction

Do **not** position this as:

> Better calendar notifications.

Position it as:

# Your Mac won't let you forget.

Calendar meetings are simply the first use case.

The long-term product is an interruption engine for moments where the user intentionally wants their computer to break their focus.

That can eventually cover:

**Meetings → reminders → focus sessions → hard stops → routines → deadlines.**
