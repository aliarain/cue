use regex::Regex;
use std::sync::OnceLock;

const PROVIDERS: &[(&str, &str)] = &[
    (r#"https?://meet\.google\.com/[A-Za-z0-9\-?=&_.]+"#, "Google Meet"),
    (r#"https?://[A-Za-z0-9.\-]*zoom\.(?:us|com)/[jw]/[^\s<>"')]+"#, "Zoom"),
    (r#"https?://[A-Za-z0-9.\-]*zoom\.(?:us|com)/my/[^\s<>"')]+"#, "Zoom"),
    (r#"https?://teams\.microsoft\.com/l/meetup-join/[^\s<>"')]+"#, "Microsoft Teams"),
    (r#"https?://teams\.live\.com/meet/[^\s<>"')]+"#, "Microsoft Teams"),
    (r#"https?://[A-Za-z0-9.\-]*webex\.com/(?:meet|join|wbxmjs)[^\s<>"')]*"#, "Webex"),
    (r#"https?://meet\.jit\.si/[^\s<>"')]+"#, "Jitsi"),
    (r#"https?://whereby\.com/[^\s<>"')]+"#, "Whereby"),
];

fn regexes() -> &'static Vec<(Regex, &'static str)> {
    static RE: OnceLock<Vec<(Regex, &'static str)>> = OnceLock::new();
    RE.get_or_init(|| {
        PROVIDERS
            .iter()
            .map(|(pat, name)| (Regex::new(pat).unwrap(), *name))
            .collect()
    })
}

/// Scan event URL, location, and notes (in that priority) for a meeting link.
pub fn detect(fields: &[Option<&str>]) -> Option<(String, String)> {
    for field in fields.iter().flatten() {
        for (re, provider) in regexes() {
            if let Some(m) = re.find(field) {
                let url = m.as_str().trim_end_matches(['.', ',', ';']).to_string();
                return Some((url, provider.to_string()));
            }
        }
    }
    None
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn detects_meet() {
        let got = detect(&[Some("join at https://meet.google.com/abc-defg-hij ok")]);
        assert_eq!(
            got,
            Some(("https://meet.google.com/abc-defg-hij".into(), "Google Meet".into()))
        );
    }

    #[test]
    fn detects_zoom() {
        let got = detect(&[None, Some("https://us02web.zoom.us/j/123456?pwd=x")]);
        assert_eq!(got.unwrap().1, "Zoom");
    }

    #[test]
    fn none_for_plain_text() {
        assert_eq!(detect(&[Some("lunch with sam")]), None);
    }
}
