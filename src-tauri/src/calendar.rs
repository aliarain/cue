//! EventKit bridge. All EventKit objects live on one dedicated thread; only
//! plain serializable structs cross into shared state.

use std::sync::mpsc;
use std::time::Duration;

use block2::RcBlock;
use objc2::runtime::Bool;
use objc2_event_kit::{
    EKAuthorizationStatus, EKEntityType, EKEvent, EKEventStatus, EKEventStore, EKParticipantStatus,
};
use objc2_foundation::{NSDate, NSError};
use tauri::{AppHandle, Manager};

use crate::meeting_link;
use crate::models::*;
use crate::state::AppState;

const POLL_SECS: u64 = 30;
const LOOKAHEAD_HOURS: i64 = 48;

pub fn spawn(app: AppHandle) {
    std::thread::Builder::new()
        .name("cue-calendar".into())
        .spawn(move || run(app))
        .expect("failed to spawn calendar thread");
}

fn set_status(app: &AppHandle, status: CalendarStatus) {
    let state = app.state::<AppState>();
    state.inner.lock().unwrap().calendar_status = Some(status);
}

fn run(app: AppHandle) {
    let store = unsafe { EKEventStore::new() };

    loop {
        let status = unsafe { EKEventStore::authorizationStatusForEntityType(EKEntityType::Event) };
        match status {
            EKAuthorizationStatus::FullAccess => {
                set_status(&app, CalendarStatus::Authorized);
                break;
            }
            EKAuthorizationStatus::NotDetermined => {
                set_status(&app, CalendarStatus::NotDetermined);
                let (tx, rx) = mpsc::channel::<bool>();
                let block = RcBlock::new(move |granted: Bool, _err: *mut NSError| {
                    let _ = tx.send(granted.as_bool());
                });
                unsafe { store.requestFullAccessToEventsWithCompletion(RcBlock::as_ptr(&block)) };
                match rx.recv_timeout(Duration::from_secs(300)) {
                    Ok(true) => {
                        set_status(&app, CalendarStatus::Authorized);
                        break;
                    }
                    _ => {
                        set_status(&app, CalendarStatus::Denied);
                        return;
                    }
                }
            }
            _ => {
                set_status(&app, CalendarStatus::Denied);
                return;
            }
        }
    }

    loop {
        let items = fetch_events(&store);
        {
            let state = app.state::<AppState>();
            state.inner.lock().unwrap().calendar_items = items;
        }
        std::thread::sleep(Duration::from_secs(POLL_SECS));
    }
}

fn fetch_events(store: &EKEventStore) -> Vec<AlertItem> {
    let now = now_ms();
    let start = NSDate::dateWithTimeIntervalSince1970((now / 1000 - 3600) as f64);
    let end = NSDate::dateWithTimeIntervalSince1970((now / 1000 + LOOKAHEAD_HOURS * 3600) as f64);

    let mut items = Vec::new();
    unsafe {
        let predicate = store.predicateForEventsWithStartDate_endDate_calendars(&start, &end, None);
        let events = store.eventsMatchingPredicate(&predicate);
        for event in events.iter() {
            if let Some(item) = map_event(&event, now) {
                items.push(item);
            }
        }
    }
    items.sort_by_key(|i| i.start_ms);
    items
}

unsafe fn map_event(event: &EKEvent, now: i64) -> Option<AlertItem> {
    if event.isAllDay() {
        return None;
    }
    if event.status() == EKEventStatus::Canceled {
        return None;
    }
    if declined_by_me(event) {
        return None;
    }

    let start_ms = (event.startDate().timeIntervalSince1970() * 1000.0) as i64;
    let end_ms = (event.endDate().timeIntervalSince1970() * 1000.0) as i64;
    // Skip events already over.
    if end_ms < now {
        return None;
    }

    let title = event.title().to_string();
    let url = event.URL().and_then(|u| u.absoluteString()).map(|s| s.to_string());
    let location = event.location().map(|s| s.to_string());
    let notes = event.notes().map(|s| s.to_string());

    let link = meeting_link::detect(&[url.as_deref(), location.as_deref(), notes.as_deref()]);

    let event_id = event
        .eventIdentifier()
        .map(|s| s.to_string())
        .unwrap_or_else(|| event.calendarItemIdentifier().to_string());

    Some(AlertItem {
        id: format!("{event_id}@{start_ms}"),
        kind: ItemKind::Meeting,
        title,
        start_ms,
        end_ms: Some(end_ms),
        meeting_url: link.as_ref().map(|(u, _)| u.clone()),
        provider: link.map(|(_, p)| p),
        calendar: event.calendar().map(|c| c.title().to_string()),
    })
}

unsafe fn declined_by_me(event: &EKEvent) -> bool {
    let Some(attendees) = event.attendees() else {
        return false;
    };
    attendees
        .iter()
        .any(|a| a.isCurrentUser() && a.participantStatus() == EKParticipantStatus::Declined)
}
