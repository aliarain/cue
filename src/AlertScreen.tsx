import { useCallback, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type { AlertPayload } from "./types";

function useNow(intervalMs: number) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

function formatClock(ms: number): string {
  return new Date(ms).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export default function AlertScreen() {
  const [payload, setPayload] = useState<AlertPayload | null>(null);
  const now = useNow(250);

  const fetchPayload = useCallback(() => {
    invoke<AlertPayload | null>("get_alert_payload").then(setPayload).catch(() => {});
  }, []);

  useEffect(() => {
    fetchPayload();
    const unlisten = listen("alert-updated", fetchPayload);
    return () => {
      unlisten.then((fn) => fn());
    };
  }, [fetchPayload]);

  const act = useCallback(
    (action: "join" | "snooze" | "dismiss" | "mute") => {
      invoke("alert_action", { action }).catch(() => {});
    },
    [],
  );

  const item = payload?.item;
  const isMeeting = item?.kind === "meeting" || item?.kind === "test";
  const hasLink = !!item?.meeting_url;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!item) return;
      if (e.key === "Enter") act(hasLink ? "join" : "dismiss");
      else if (e.key === "s" || e.key === "S") act("snooze");
      else if (e.key === "Escape") act("dismiss");
      else if ((e.key === "m" || e.key === "M") && isMeeting) act("mute");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [item, hasLink, isMeeting, act]);

  if (!item) return <div className="alert-root" />;

  const remaining = item.start_ms - now;
  const started = remaining <= 0;
  const snoozeMin = Math.max(1, Math.round((payload?.snooze_secs ?? 120) / 60));

  const headline = started
    ? item.kind === "reminder"
      ? "IT'S TIME"
      : "STARTED"
    : payload?.stage === "snooze"
      ? "SNOOZE OVER — STARTING IN"
      : "STARTING IN";

  const primaryLabel = hasLink
    ? `Join ${item.provider ?? "Meeting"} →`
    : item.kind === "reminder"
      ? "Done"
      : "Got it";

  return (
    <div className="alert-root">
      <div className="alert-stage">{headline}</div>
      <div className={`alert-countdown ${started ? "alert-countdown-started" : ""}`}>
        {started ? formatCountdown(now - item.start_ms) + " ago" : formatCountdown(remaining)}
      </div>
      <h1 className="alert-title">{item.title}</h1>
      <div className="alert-meta">
        <span>{formatClock(item.start_ms)}</span>
        {item.provider && <span>🎥 {item.provider}</span>}
        {item.calendar && <span>{item.calendar}</span>}
      </div>
      <div className="alert-actions">
        <button
          className="btn-primary"
          autoFocus
          onClick={() => act(hasLink ? "join" : "dismiss")}
        >
          {primaryLabel}
        </button>
        <button className="btn-secondary" onClick={() => act("snooze")}>
          Snooze {snoozeMin} min
        </button>
      </div>
      <div className="alert-footer">
        <button className="btn-ghost" onClick={() => act("dismiss")}>
          Dismiss (esc)
        </button>
        {isMeeting && (
          <button className="btn-ghost" onClick={() => act("mute")}>
            Mute this event
          </button>
        )}
      </div>
    </div>
  );
}
