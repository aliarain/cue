//! Full-screen alert windows: one per connected monitor, above everything,
//! on every Space, including over full-screen apps.

use tauri::{AppHandle, Emitter, Manager, WebviewUrl, WebviewWindowBuilder};

use crate::models::*;
use crate::state::AppState;

const NS_SCREEN_SAVER_WINDOW_LEVEL: isize = 1000;

pub fn show_alert(app: &AppHandle, payload: AlertPayload) {
    {
        let state = app.state::<AppState>();
        state.inner.lock().unwrap().current_alert = Some(payload);
    }
    let app2 = app.clone();
    let _ = app.run_on_main_thread(move || create_windows(&app2));
}

pub fn close_alerts(app: &AppHandle) {
    {
        let state = app.state::<AppState>();
        state.inner.lock().unwrap().current_alert = None;
    }
    let app2 = app.clone();
    let _ = app.run_on_main_thread(move || {
        for (label, window) in app2.webview_windows() {
            if label.starts_with("alert-") {
                let _ = window.close();
            }
        }
    });
}

pub fn show_test_alert(app: &AppHandle) {
    let now = now_ms();
    show_alert(
        app,
        AlertPayload {
            item: AlertItem {
                id: format!("test:{now}"),
                kind: ItemKind::Test,
                title: "This is what an alert looks like".into(),
                start_ms: now + 60_000,
                end_ms: None,
                meeting_url: Some("https://meet.google.com/abc-defg-hij".into()),
                provider: Some("Google Meet".into()),
                calendar: None,
            },
            stage: "takeover".into(),
            snooze_secs: 120,
        },
    );
}

fn create_windows(app: &AppHandle) {
    let already_open = app
        .webview_windows()
        .keys()
        .any(|l| l.starts_with("alert-"));
    if already_open {
        // Reuse open windows: tell them to re-fetch the payload.
        let _ = app.emit("alert-updated", ());
        return;
    }

    let monitors = app.available_monitors().unwrap_or_default();
    for (i, monitor) in monitors.iter().enumerate() {
        let scale = monitor.scale_factor();
        let pos = monitor.position();
        let size = monitor.size();
        let label = format!("alert-{i}");
        let built = WebviewWindowBuilder::new(app, &label, WebviewUrl::App("index.html".into()))
            .title("cue alert")
            .decorations(false)
            .always_on_top(true)
            .visible_on_all_workspaces(true)
            .skip_taskbar(true)
            .accept_first_mouse(true)
            .position(pos.x as f64 / scale, pos.y as f64 / scale)
            .inner_size(size.width as f64 / scale, size.height as f64 / scale)
            .focused(i == 0)
            .build();
        match built {
            Ok(window) => {
                #[cfg(target_os = "macos")]
                boost_window(&window);
            }
            Err(e) => eprintln!("cue: failed to create alert window {label}: {e}"),
        }
    }
}

/// Raise the NSWindow above full-screen apps and pin it to every Space.
#[cfg(target_os = "macos")]
fn boost_window(window: &tauri::WebviewWindow) {
    use objc2_app_kit::{NSWindow, NSWindowCollectionBehavior};

    let Ok(ptr) = window.ns_window() else { return };
    unsafe {
        let ns: &NSWindow = &*(ptr as *const NSWindow);
        ns.setLevel(NS_SCREEN_SAVER_WINDOW_LEVEL);
        ns.setCollectionBehavior(
            NSWindowCollectionBehavior::CanJoinAllSpaces
                | NSWindowCollectionBehavior::FullScreenAuxiliary
                | NSWindowCollectionBehavior::Stationary,
        );
        ns.makeKeyAndOrderFront(None);
    }
}
