export interface AlertItem {
  id: string;
  kind: "meeting" | "reminder" | "test";
  title: string;
  start_ms: number;
  end_ms: number | null;
  meeting_url: string | null;
  provider: string | null;
  calendar: string | null;
}

export interface AlertPayload {
  item: AlertItem;
  stage: "takeover" | "started" | "snooze";
  snooze_secs: number;
}

export interface Settings {
  warn_minutes: number;
  takeover_minutes: number;
  after_start: boolean;
  snooze_secs: number;
  launch_at_login: boolean;
  ignored_keywords: string[];
}

export interface Status {
  calendar: "notdetermined" | "denied" | "authorized" | null;
  paused_until: number | null;
  upcoming: AlertItem[];
}
