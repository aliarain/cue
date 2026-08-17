//! Menu-bar presence: "⚡ 12m" title plus the quick menu.

use std::sync::Mutex;

use chrono::{Local, TimeZone};
use tauri::menu::{Menu, MenuItem, PredefinedMenuItem, Submenu};
use tauri::tray::{TrayIcon, TrayIconBuilder};
use tauri::{AppHandle, Manager, Wry};
use tauri_plugin_opener::OpenerExt;

use crate::models::*;
use crate::state::AppState;
use crate::{alerts, windows};

#[derive(Default)]
pub struct TrayState {
    pub inner: Mutex<Option<Handles>>,
}

pub struct Handles {
    pub tray: TrayIcon<Wry>,
    pub next_info: MenuItem<Wry>,
    pub join: MenuItem<Wry>,
    pub last_title: String,
    pub last_info: String,
    pub last_join_enabled: bool,
}

pub fn setup(app: &AppHandle) -> tauri::Result<()> {
    let next_info = MenuItem::with_id(app, "next-info", "No upcoming events", false, None::<&str>)?;
    let join = MenuItem::with_id(app, "join-next", "Join Next Meeting", false, None::<&str>)?;
    let quick = MenuItem::with_id(app, "quick", "Quick Reminder…", true, Some("Alt+Space"))?;

    let pause_1h = MenuItem::with_id(app, "pause-1h", "For 1 Hour", true, None::<&str>)?;
    let pause_tomorrow =
        MenuItem::with_id(app, "pause-tomorrow", "Until Tomorrow", true, None::<&str>)?;
    let pause_forever =
        MenuItem::with_id(app, "pause-forever", "Until I Resume", true, None::<&str>)?;
    let resume = MenuItem::with_id(app, "resume", "Resume Reminders", true, None::<&str>)?;
    let pause_menu = Submenu::with_items(
        app,
        "Pause Reminders",
        true,
        &[&pause_1h, &pause_tomorrow, &pause_forever, &resume],
    )?;

    let test = MenuItem::with_id(app, "test-alert", "Show Test Alert", true, None::<&str>)?;
    let settings = MenuItem::with_id(app, "settings", "Settings…", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "Quit cue", true, Some("Cmd+Q"))?;

    let menu = Menu::with_items(
        app,
        &[
            &next_info,
            &join,
            &PredefinedMenuItem::separator(app)?,
            &quick,
            &pause_menu,
            &PredefinedMenuItem::separator(app)?,
            &test,
            &settings,
            &PredefinedMenuItem::separator(app)?,
            &quit,
        ],
    )?;

    let tray = TrayIconBuilder::with_id("cue-tray")
        .menu(&menu)
        .show_menu_on_left_click(true)
        .title("⚡")
        .tooltip("cue")
        .on_menu_event(|app, event| handle_menu(app, event.id().as_ref()))
        .build(app)?;

    let state = app.state::<TrayState>();
    *state.inner.lock().unwrap() = Some(Handles {
        tray,
        next_info,
        join,
        last_title: "⚡".into(),
        last_info: "No upcoming events".into(),
        last_join_enabled: false,
    });
    Ok(())
}

fn handle_menu(app: &AppHandle, id: &str) {
    let now = now_ms();
    match id {
        "join-next" => {
            let url = {
                let state = app.state::<AppState>();
                let inner = state.inner.lock().unwrap();
                inner.next_item(now).and_then(|i| i.meeting_url)
            };
            if let Some(url) = url {
                let _ = app.opener().open_url(url, None::<&str>);
            }
        }
        "quick" => windows::toggle_quickadd(app),
        "pause-1h" => set_pause(app, Some(now + 3_600_000)),
        "pause-tomorrow" => {
            let tomorrow = Local::now()
                .date_naive()
                .succ_opt()
                .and_then(|d| d.and_hms_opt(0, 0, 0))
                .and_then(|dt| Local.from_local_datetime(&dt).single())
                .map(|dt| dt.timestamp_millis());
            set_pause(app, tomorrow);
        }
        "pause-forever" => set_pause(app, Some(i64::MAX)),
        "resume" => set_pause(app, None),
        "test-alert" => alerts::show_test_alert(app),
        "settings" => windows::open_settings(app),
        "quit" => app.exit(0),
        _ => {}
    }
    refresh(app);
}

fn set_pause(app: &AppHandle, until: Option<i64>) {
    let state = app.state::<AppState>();
    state.inner.lock().unwrap().paused_until = until;
}

/// Called every scheduler tick; only touches the tray when something changed.
pub fn refresh(app: &AppHandle) {
    let now = now_ms();
    let (paused, next) = {
        let state = app.state::<AppState>();
        let inner = state.inner.lock().unwrap();
        (inner.is_paused(now), inner.next_item(now))
    };

    let (title, info, join_enabled) = match (&paused, &next) {
        (true, _) => ("⏸".to_string(), "Reminders paused".to_string(), false),
        (false, Some(item)) => {
            let mins = (item.start_ms - now) / 60_000;
            let title = if mins < 0 {
                "⚡ now".to_string()
            } else if mins < 100 {
                format!("⚡ {mins}m")
            } else if mins < 60 * 24 {
                format!("⚡ {}h", (mins + 30) / 60)
            } else {
                "⚡".to_string()
            };
            let when = Local
                .timestamp_millis_opt(item.start_ms)
                .single()
                .map(|d| d.format("%-I:%M %p").to_string())
                .unwrap_or_default();
            (title, format!("Next: {} — {when}", item.title), item.meeting_url.is_some())
        }
        (false, None) => ("⚡".to_string(), "No upcoming events".to_string(), false),
    };

    let tray_state = app.state::<TrayState>();
    let mut guard = tray_state.inner.lock().unwrap();
    let Some(handles) = guard.as_mut() else { return };
    if handles.last_title != title {
        let _ = handles.tray.set_title(Some(title.clone()));
        handles.last_title = title;
    }
    if handles.last_info != info {
        let _ = handles.next_info.set_text(info.clone());
        handles.last_info = info;
    }
    if handles.last_join_enabled != join_enabled {
        let _ = handles.join.set_enabled(join_enabled);
        handles.last_join_enabled = join_enabled;
    }
}
