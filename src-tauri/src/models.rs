use serde::{Deserialize, Serialize};

/// A thing that can trigger alerts: a calendar event occurrence or a quick reminder.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AlertItem {
    /// Unique per occurrence: "<eventIdentifier>@<start_ms>" for calendar events,
    /// "reminder:<uuid>" for quick reminders.
    pub id: String,
    pub kind: ItemKind,
    pub title: String,
    /// Epoch milliseconds.
    pub start_ms: i64,
    pub end_ms: Option<i64>,
    pub meeting_url: Option<String>,
    pub provider: Option<String>,
    pub calendar: Option<String>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ItemKind {
    Meeting,
    Reminder,
    Test,
}

/// What is currently shown on the full-screen alert windows.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AlertPayload {
    pub item: AlertItem,
    /// "takeover" (pre-start countdown), "started", or "snooze" (returned from snooze).
    pub stage: String,
    pub snooze_secs: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default)]
pub struct Settings {
    /// Small OS notification this many minutes before start (0 = off).
    pub warn_minutes: u32,
    /// Full-screen takeover this many minutes before start (0 = off).
    pub takeover_minutes: u32,
    /// Show the full-screen alert again right after the event starts if not interacted with.
    pub after_start: bool,
    pub snooze_secs: u64,
    pub launch_at_login: bool,
    /// Substrings that suppress alerts for matching event titles.
    pub ignored_keywords: Vec<String>,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            warn_minutes: 5,
            takeover_minutes: 1,
            after_start: true,
            snooze_secs: 120,
            launch_at_login: true,
            ignored_keywords: Vec::new(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QuickReminder {
    pub id: String,
    pub title: String,
    pub at_ms: i64,
}

/// Persisted to disk in app data dir.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(default)]
pub struct PersistedData {
    pub settings: Settings,
    pub reminders: Vec<QuickReminder>,
    pub muted: Vec<String>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Interaction {
    Dismissed,
    Joined,
    SnoozedUntil(i64),
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum CalendarStatus {
    NotDetermined,
    Denied,
    Authorized,
}

pub fn now_ms() -> i64 {
    chrono::Utc::now().timestamp_millis()
}
