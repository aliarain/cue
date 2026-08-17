use std::collections::{HashMap, HashSet};
use std::path::PathBuf;
use std::sync::Mutex;

use tauri::{AppHandle, Manager};

use crate::models::*;

#[derive(Default)]
pub struct AppState {
    pub inner: Mutex<Inner>,
}

#[derive(Default)]
pub struct Inner {
    pub calendar_items: Vec<AlertItem>,
    pub calendar_status: Option<CalendarStatus>,
    pub data: PersistedData,
    /// Stage keys like "<item_id>:warn" that already fired.
    pub fired: HashSet<String>,
    pub interactions: HashMap<String, Interaction>,
    pub paused_until: Option<i64>, // i64::MAX = until manually resumed
    pub current_alert: Option<AlertPayload>,
    pub current_banner: Option<AlertItem>,
    pub banner_shown_ms: i64,
}

impl Inner {
    pub fn is_paused(&self, now: i64) -> bool {
        self.paused_until.map_or(false, |t| now < t)
    }

    /// Calendar items + pending reminders, muted and keyword-filtered out, sorted by start.
    pub fn active_items(&self) -> Vec<AlertItem> {
        let muted: HashSet<&String> = self.data.muted.iter().collect();
        let keywords: Vec<String> = self
            .data
            .settings
            .ignored_keywords
            .iter()
            .map(|k| k.to_lowercase())
            .filter(|k| !k.is_empty())
            .collect();
        let mut items: Vec<AlertItem> = self
            .calendar_items
            .iter()
            .filter(|i| !muted.contains(&i.id))
            .filter(|i| {
                let t = i.title.to_lowercase();
                !keywords.iter().any(|k| t.contains(k))
            })
            .cloned()
            .collect();
        items.extend(self.data.reminders.iter().map(|r| AlertItem {
            id: r.id.clone(),
            kind: ItemKind::Reminder,
            title: r.title.clone(),
            start_ms: r.at_ms,
            end_ms: None,
            meeting_url: None,
            provider: None,
            calendar: None,
        }));
        items.sort_by_key(|i| i.start_ms);
        items
    }

    /// Next item that hasn't started more than a minute ago.
    pub fn next_item(&self, now: i64) -> Option<AlertItem> {
        self.active_items()
            .into_iter()
            .find(|i| i.start_ms > now - 60_000)
    }
}

fn data_path(app: &AppHandle) -> PathBuf {
    let dir = app
        .path()
        .app_data_dir()
        .expect("no app data dir");
    let _ = std::fs::create_dir_all(&dir);
    dir.join("cue-data.json")
}

pub fn load_data(app: &AppHandle) -> PersistedData {
    std::fs::read_to_string(data_path(app))
        .ok()
        .and_then(|s| serde_json::from_str(&s).ok())
        .unwrap_or_default()
}

pub fn save_data(app: &AppHandle, data: &PersistedData) {
    if let Ok(json) = serde_json::to_string_pretty(data) {
        let _ = std::fs::write(data_path(app), json);
    }
}
