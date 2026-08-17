use serde::Serialize;
use tauri::{AppHandle, Manager, State};
use tauri_plugin_autostart::ManagerExt;
use tauri_plugin_opener::OpenerExt;

use crate::models::*;
use crate::state::{save_data, AppState};
use crate::{alerts, reminders, windows};

#[tauri::command]
pub fn get_alert_payload(state: State<AppState>) -> Option<AlertPayload> {
    state.inner.lock().unwrap().current_alert.clone()
}

#[tauri::command]
pub fn get_banner_payload(state: State<AppState>) -> Option<AlertItem> {
    state.inner.lock().unwrap().current_banner.clone()
}

#[tauri::command]
pub fn banner_action(app: AppHandle, action: String) {
    let item = {
        let state = app.state::<AppState>();
        let guard = state.inner.lock().unwrap();
        guard.current_banner.clone()
    };
    let Some(item) = item else {
        alerts::close_banner(&app);
        return;
    };
    if action == "join" {
        if item.kind != ItemKind::Test {
            let state = app.state::<AppState>();
            state
                .inner
                .lock()
                .unwrap()
                .interactions
                .insert(item.id.clone(), Interaction::Joined);
        }
        if let Some(url) = &item.meeting_url {
            let _ = app.opener().open_url(url.clone(), None::<&str>);
        }
    }
    alerts::close_banner(&app);
}

#[tauri::command]
pub fn alert_action(app: AppHandle, action: String) {
    let payload = {
        let state = app.state::<AppState>();
        let guard = state.inner.lock().unwrap();
        guard.current_alert.clone()
    };
    let Some(payload) = payload else {
        alerts::close_alerts(&app);
        return;
    };
    let item = payload.item;
    let is_test = item.kind == ItemKind::Test;
    let now = now_ms();

    {
        let state = app.state::<AppState>();
        let mut inner = state.inner.lock().unwrap();
        if !is_test {
            match action.as_str() {
                "join" => {
                    inner.interactions.insert(item.id.clone(), Interaction::Joined);
                }
                "snooze" => {
                    let until = now + inner.data.settings.snooze_secs as i64 * 1000;
                    inner
                        .interactions
                        .insert(item.id.clone(), Interaction::SnoozedUntil(until));
                }
                "dismiss" => {
                    inner.interactions.insert(item.id.clone(), Interaction::Dismissed);
                }
                "mute" => {
                    inner.interactions.insert(item.id.clone(), Interaction::Dismissed);
                    if !inner.data.muted.contains(&item.id) {
                        inner.data.muted.push(item.id.clone());
                    }
                    let data = inner.data.clone();
                    drop(inner);
                    save_data(&app, &data);
                }
                _ => {}
            }
        }
    }

    if action == "join" {
        if let Some(url) = &item.meeting_url {
            let _ = app.opener().open_url(url.clone(), None::<&str>);
        }
    }
    alerts::close_alerts(&app);
}

#[tauri::command]
pub fn create_quick_reminder(app: AppHandle, text: String) -> Result<String, String> {
    let reminder = reminders::parse(&text)?;
    let confirmation = reminders::describe(&reminder);
    let data = {
        let state = app.state::<AppState>();
        let mut inner = state.inner.lock().unwrap();
        inner.data.reminders.push(reminder);
        inner.data.clone()
    };
    save_data(&app, &data);
    Ok(confirmation)
}

#[tauri::command]
pub fn preview_quick_reminder(text: String) -> Option<String> {
    reminders::parse(&text).ok().map(|r| reminders::describe(&r))
}

#[tauri::command]
pub fn close_quickadd(app: AppHandle) {
    windows::hide_quickadd(&app);
}

#[tauri::command]
pub fn get_settings(state: State<AppState>) -> Settings {
    state.inner.lock().unwrap().data.settings.clone()
}

#[tauri::command]
pub fn set_settings(app: AppHandle, settings: Settings) {
    let launch = settings.launch_at_login;
    let data = {
        let state = app.state::<AppState>();
        let mut inner = state.inner.lock().unwrap();
        inner.data.settings = settings;
        inner.data.clone()
    };
    save_data(&app, &data);
    let autostart = app.autolaunch();
    let _ = if launch { autostart.enable() } else { autostart.disable() };
}

#[derive(Serialize)]
pub struct Status {
    pub calendar: Option<CalendarStatus>,
    pub paused_until: Option<i64>,
    pub upcoming: Vec<AlertItem>,
}

#[tauri::command]
pub fn get_status(state: State<AppState>) -> Status {
    let inner = state.inner.lock().unwrap();
    let now = now_ms();
    Status {
        calendar: inner.calendar_status,
        paused_until: inner.paused_until,
        upcoming: inner
            .active_items()
            .into_iter()
            .filter(|i| i.start_ms > now - 60_000)
            .take(8)
            .collect(),
    }
}

#[tauri::command]
pub fn trigger_test_alert(app: AppHandle) {
    alerts::show_test_alert(&app);
}
