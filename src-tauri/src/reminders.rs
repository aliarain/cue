//! Quick reminder natural-language parsing: "tea in 10m", "call Ahmed in 20 minutes",
//! "stop working at 2am", "standup at 14:30".

use chrono::{Duration, Local, NaiveTime, TimeZone};
use regex::Regex;

use crate::models::{now_ms, QuickReminder};

pub fn parse(input: &str) -> Result<QuickReminder, String> {
    let text = input.trim();
    if text.is_empty() {
        return Err("Type something like “tea in 10m” or “call Ahmed at 9pm”.".into());
    }
    let cleaned = strip_prefix(text);

    if let Some((title, at_ms)) = parse_in(&cleaned) {
        return Ok(build(title, at_ms));
    }
    if let Some((title, at_ms)) = parse_at(&cleaned) {
        return Ok(build(title, at_ms));
    }
    Err("Couldn’t find a time. Try “… in 10m” or “… at 9pm”.".into())
}

fn build(title: String, at_ms: i64) -> QuickReminder {
    let title = if title.is_empty() { "Reminder".to_string() } else { title };
    QuickReminder {
        id: format!("reminder:{at_ms}:{:x}", fxhash(&title)),
        title,
        at_ms,
    }
}

fn fxhash(s: &str) -> u64 {
    // Tiny stable hash so ids are unique-ish without pulling in uuid.
    s.bytes().fold(0xcbf29ce484222325u64, |h, b| {
        (h ^ b as u64).wrapping_mul(0x100000001b3)
    })
}

fn strip_prefix(s: &str) -> String {
    let lower = s.to_lowercase();
    for p in ["remind me to ", "remind me ", "reminder to ", "reminder "] {
        if lower.starts_with(p) {
            return s[p.len()..].to_string();
        }
    }
    s.to_string()
}

/// "<title> in 10m", "in 1h30m <title>", "<title> in 20 minutes"
fn parse_in(s: &str) -> Option<(String, i64)> {
    let re = Regex::new(
        r"(?i)\bin\s+(?:(\d+)\s*(?:h|hr|hrs|hours?))?\s*(?:(\d+)\s*(?:m|min|mins|minutes?))?\b",
    )
    .unwrap();
    for cap in re.captures_iter(s) {
        let hours: i64 = cap.get(1).map_or(0, |m| m.as_str().parse().unwrap_or(0));
        let mins: i64 = cap.get(2).map_or(0, |m| m.as_str().parse().unwrap_or(0));
        if hours == 0 && mins == 0 {
            continue;
        }
        let title = remove_match(s, cap.get(0).unwrap().range());
        let at_ms = now_ms() + (hours * 3600 + mins * 60) * 1000;
        return Some((title, at_ms));
    }
    None
}

/// "<title> at 2am", "<title> at 14:30", "stop working at 9:15pm"
fn parse_at(s: &str) -> Option<(String, i64)> {
    let re = Regex::new(r"(?i)\bat\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b").unwrap();
    let cap = re.captures(s)?;
    let mut hour: u32 = cap.get(1)?.as_str().parse().ok()?;
    let minute: u32 = cap.get(2).map_or(0, |m| m.as_str().parse().unwrap_or(0));
    let ampm = cap.get(3).map(|m| m.as_str().to_lowercase());

    match ampm.as_deref() {
        Some("pm") if hour < 12 => hour += 12,
        Some("am") if hour == 12 => hour = 0,
        _ => {}
    }
    if hour > 23 || minute > 59 {
        return None;
    }

    let now = Local::now();
    let time = NaiveTime::from_hms_opt(hour, minute, 0)?;
    let mut candidate = now.date_naive().and_time(time);
    // If no am/pm given and the plain reading is in the past, try +12h before rolling a day.
    if Local.from_local_datetime(&candidate).single()? <= now && ampm.is_none() && hour < 12 {
        let bumped = candidate + Duration::hours(12);
        if Local.from_local_datetime(&bumped).single()? > now {
            candidate = bumped;
        }
    }
    let mut dt = Local.from_local_datetime(&candidate).single()?;
    if dt <= now {
        dt = dt + Duration::days(1);
    }

    let title = remove_match(s, cap.get(0)?.range());
    Some((title, dt.timestamp_millis()))
}

fn remove_match(s: &str, range: std::ops::Range<usize>) -> String {
    let mut title = String::new();
    title.push_str(&s[..range.start]);
    title.push(' ');
    title.push_str(&s[range.end..]);
    title.split_whitespace().collect::<Vec<_>>().join(" ")
}

/// Human confirmation like "⏰ tea — 9:41 PM (in 10m)".
pub fn describe(r: &QuickReminder) -> String {
    let dt = Local.timestamp_millis_opt(r.at_ms).single();
    let when = dt.map_or_else(|| "?".into(), |d| d.format("%-I:%M %p").to_string());
    let mins = (r.at_ms - now_ms()) / 60_000;
    let rel = if mins < 1 {
        "in <1m".to_string()
    } else if mins < 120 {
        format!("in {mins}m")
    } else {
        format!("in {}h {}m", mins / 60, mins % 60)
    };
    format!("{} — {} ({})", r.title, when, rel)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_in_minutes() {
        let r = parse("tea in 10m").unwrap();
        assert_eq!(r.title, "tea");
        let delta = r.at_ms - now_ms();
        assert!(delta > 9 * 60_000 && delta <= 10 * 60_000);
    }

    #[test]
    fn parses_hours_and_minutes() {
        let r = parse("deploy in 1h 30m").unwrap();
        let delta = r.at_ms - now_ms();
        assert!(delta > 89 * 60_000 && delta <= 90 * 60_000);
    }

    #[test]
    fn parses_at_pm() {
        let r = parse("call Ahmed at 9pm").unwrap();
        assert_eq!(r.title, "call Ahmed");
        assert!(r.at_ms > now_ms());
    }

    #[test]
    fn strips_remind_me() {
        let r = parse("remind me to stretch in 45m").unwrap();
        assert_eq!(r.title, "stretch");
    }

    #[test]
    fn rejects_no_time() {
        assert!(parse("just some text").is_err());
    }
}
