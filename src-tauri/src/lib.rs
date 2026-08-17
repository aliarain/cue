mod alerts;
#[cfg(target_os = "macos")]
mod calendar;
mod commands;
mod meeting_link;
mod models;
mod reminders;
mod scheduler;
mod state;
mod tray;
mod windows;

use tauri::Manager;
use tauri_plugin_autostart::MacosLauncher;
#[cfg(not(debug_assertions))]
use tauri_plugin_autostart::ManagerExt;
use tauri_plugin_global_shortcut::{Code, Modifiers, Shortcut, ShortcutState};

use state::AppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            None,
        ))
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, shortcut, event| {
                    if event.state() == ShortcutState::Pressed
                        && shortcut.matches(Modifiers::ALT, Code::Space)
                    {
                        windows::toggle_quickadd(app);
                    }
                })
                .build(),
        )
        .manage(AppState::default())
        .manage(tray::TrayState::default())
        .setup(|app| {
            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);

            let handle = app.handle().clone();

            let data = state::load_data(&handle);
            let launch_at_login = data.settings.launch_at_login;
            {
                let state = handle.state::<AppState>();
                state.inner.lock().unwrap().data = data;
            }

            // Only touch Login Items from a real bundled build, not `tauri dev`.
            #[cfg(not(debug_assertions))]
            if launch_at_login {
                let _ = handle.autolaunch().enable();
            }
            #[cfg(debug_assertions)]
            let _ = launch_at_login;

            tray::setup(&handle)?;
            windows::create_quickadd(&handle)?;

            use tauri_plugin_global_shortcut::GlobalShortcutExt;
            if let Err(e) = handle
                .global_shortcut()
                .register(Shortcut::new(Some(Modifiers::ALT), Code::Space))
            {
                eprintln!("cue: could not register ⌥Space: {e}");
            }

            #[cfg(target_os = "macos")]
            calendar::spawn(handle.clone());
            scheduler::spawn(handle.clone());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_alert_payload,
            commands::alert_action,
            commands::get_banner_payload,
            commands::banner_action,
            commands::create_quick_reminder,
            commands::preview_quick_reminder,
            commands::close_quickadd,
            commands::get_settings,
            commands::set_settings,
            commands::get_status,
            commands::trigger_test_alert,
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|_app, event| {
            // Menu-bar app: keep running when the last window closes.
            if let tauri::RunEvent::ExitRequested { api, code, .. } = event {
                if code.is_none() {
                    api.prevent_exit();
                }
            }
        });
}
