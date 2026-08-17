//! Auxiliary windows: the quick-reminder input and the settings window.

use tauri::{AppHandle, Emitter, Manager, WebviewUrl, WebviewWindowBuilder};

pub fn create_quickadd(app: &AppHandle) -> tauri::Result<()> {
    WebviewWindowBuilder::new(app, "quickadd", WebviewUrl::App("index.html".into()))
        .title("Quick Reminder")
        .inner_size(620.0, 96.0)
        .decorations(false)
        .transparent(true)
        .always_on_top(true)
        .visible_on_all_workspaces(true)
        .skip_taskbar(true)
        .accept_first_mouse(true)
        .center()
        .visible(false)
        .build()?;
    Ok(())
}

pub fn toggle_quickadd(app: &AppHandle) {
    let app2 = app.clone();
    let _ = app.run_on_main_thread(move || {
        let Some(window) = app2.get_webview_window("quickadd") else { return };
        if window.is_visible().unwrap_or(false) {
            let _ = window.hide();
        } else {
            let _ = app2.emit("quickadd-open", ());
            let _ = window.center();
            let _ = window.show();
            let _ = window.set_focus();
        }
    });
}

pub fn hide_quickadd(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("quickadd") {
        let _ = window.hide();
    }
}

pub fn open_settings(app: &AppHandle) {
    let app2 = app.clone();
    let _ = app.run_on_main_thread(move || {
        if let Some(window) = app2.get_webview_window("settings") {
            let _ = window.show();
            let _ = window.set_focus();
            return;
        }
        let _ = WebviewWindowBuilder::new(&app2, "settings", WebviewUrl::App("index.html".into()))
            .title("cue Settings")
            .inner_size(460.0, 620.0)
            .resizable(false)
            .build();
    });
}
