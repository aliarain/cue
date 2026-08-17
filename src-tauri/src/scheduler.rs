//! The heartbeat: every second, decide which alert stages fire.

use std::time::Duration;

use tauri::{AppHandle, Manager};
use tauri_plugin_notification::NotificationExt;

use crate::models::*;
use crate::state::{save_data, AppState};
use crate::{alerts, tray};

pub fn spawn(app: AppHandle) {
    std::thread::Builder::new()
        .name("cue-scheduler".into())
        .spawn(move || loop {
            tick(&app);
            std::thread::sleep(Duration::from_secs(1));
        })
        .expect("failed to spawn scheduler thread");
}

fn tick(app: &AppHandle) {
    let now = now_ms();
    let mut notifications: Vec<AlertItem> = Vec::new();
    let mut takeover: Option<AlertPayload> = None;
    let mut data_to_save: Option<PersistedData> = None;

    {
        let state = app.state::<AppState>();
        let mut inner = state.inner.lock().unwrap();

        // Expire finished pauses (i64::MAX means "until manually resumed").
        if let Some(t) = inner.paused_until {
            if t != i64::MAX && now >= t {
                inner.paused_until = None;
            }
        }

        let settings = inner.data.settings.clone();
        let warn_ms = settings.warn_minutes as i64 * 60_000;
        let takeover_ms = settings.takeover_minutes as i64 * 60_000;
        let paused = inner.is_paused(now);
        let showing_id = inner.current_alert.as_ref().map(|p| p.item.id.clone());
        let items = inner.active_items();
        let mut fired_reminders: Vec<String> = Vec::new();

        for item in items {
            if paused || takeover.is_some() {
                break;
            }
            let start = item.start_ms;
            let key = |stage: &str| format!("{}:{stage}", item.id);

            match inner.interactions.get(&item.id).copied() {
                Some(Interaction::SnoozedUntil(t)) => {
                    if now >= t {
                        inner.interactions.remove(&item.id);
                        takeover = Some(AlertPayload {
                            item: item.clone(),
                            stage: "snooze".into(),
                            snooze_secs: settings.snooze_secs,
                        });
                    }
                }
                Some(_) => {} // dismissed or joined — nothing more for this item
                None => {
                    // Too stale (e.g. woke from sleep long after): swallow silently.
                    if now > start + 10 * 60_000 {
                        for s in ["warn", "takeover", "start"] {
                            inner.fired.insert(key(s));
                        }
                        if item.kind == ItemKind::Reminder {
                            fired_reminders.push(item.id.clone());
                        }
                        continue;
                    }

                    if item.kind == ItemKind::Reminder {
                        if now >= start && inner.fired.insert(key("takeover")) {
                            fired_reminders.push(item.id.clone());
                            takeover = Some(AlertPayload {
                                item: item.clone(),
                                stage: "takeover".into(),
                                snooze_secs: settings.snooze_secs,
                            });
                        }
                        continue;
                    }

                    // Meetings: warn → takeover → started.
                    if settings.warn_minutes > 0
                        && now >= start - warn_ms
                        && now < start - takeover_ms
                        && inner.fired.insert(key("warn"))
                    {
                        notifications.push(item.clone());
                    }
                    if settings.takeover_minutes > 0
                        && now >= start - takeover_ms
                        && now < start
                        && inner.fired.insert(key("takeover"))
                    {
                        takeover = Some(AlertPayload {
                            item: item.clone(),
                            stage: "takeover".into(),
                            snooze_secs: settings.snooze_secs,
                        });
                    }
                    if settings.after_start && now >= start {
                        // If the takeover for this item is still on screen, the
                        // frontend flips to "started" itself — don't double-fire.
                        if showing_id.as_deref() == Some(item.id.as_str()) {
                            inner.fired.insert(key("start"));
                        } else if inner.fired.insert(key("start")) {
                            takeover = Some(AlertPayload {
                                item: item.clone(),
                                stage: "started".into(),
                                snooze_secs: settings.snooze_secs,
                            });
                        }
                    }
                }
            }
        }

        if !fired_reminders.is_empty() {
            inner.data.reminders.retain(|r| !fired_reminders.contains(&r.id));
            data_to_save = Some(inner.data.clone());
        }
    }

    if let Some(data) = data_to_save {
        save_data(app, &data);
    }
    for item in notifications {
        let mins = ((item.start_ms - now).max(0) / 60_000).max(1);
        let _ = app
            .notification()
            .builder()
            .title(&item.title)
            .body(format!("Starts in {mins} min"))
            .show();
    }
    if let Some(payload) = takeover {
        alerts::show_alert(app, payload);
    }
    tray::refresh(app);
}
