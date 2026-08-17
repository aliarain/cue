import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { AlertItem, Settings, Status } from "./types";

function formatClock(ms: number): string {
  return new Date(ms).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function relative(ms: number): string {
  const mins = Math.round((ms - Date.now()) / 60000);
  if (mins < 1) return "now";
  if (mins < 120) return `in ${mins}m`;
  if (mins < 60 * 24) return `in ${Math.round(mins / 60)}h`;
  return `in ${Math.round(mins / 60 / 24)}d`;
}

export default function SettingsScreen() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    invoke<Settings>("get_settings").then(setSettings).catch(() => {});
    const load = () => invoke<Status>("get_status").then(setStatus).catch(() => {});
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);

  const update = (patch: Partial<Settings>) => {
    if (!settings) return;
    const next = { ...settings, ...patch };
    setSettings(next);
    invoke("set_settings", { settings: next }).catch(() => {});
  };

  if (!settings) return <div className="settings-root" />;

  return (
    <div className="settings-root">
      <h1>cue</h1>
      <p className="tagline">Your Mac won’t let you forget.</p>

      <section>
        <h2>Calendar</h2>
        <div className={`badge badge-${status?.calendar ?? "loading"}`}>
          {status?.calendar === "authorized" && "✓ Calendar connected"}
          {status?.calendar === "denied" &&
            "✗ Access denied — enable in System Settings → Privacy → Calendars, then relaunch cue"}
          {status?.calendar === "notdetermined" && "Waiting for permission…"}
          {!status?.calendar && "Checking…"}
        </div>
      </section>

      <section>
        <h2>Alerts</h2>
        <label className="row">
          <span>Heads-up pill</span>
          <select
            value={settings.warn_minutes}
            onChange={(e) => update({ warn_minutes: Number(e.target.value) })}
          >
            <option value={0}>Off</option>
            <option value={5}>5 min before</option>
            <option value={10}>10 min before</option>
            <option value={15}>15 min before</option>
          </select>
        </label>
        <label className="row">
          <span>Full-screen takeover</span>
          <select
            value={settings.takeover_minutes}
            onChange={(e) => update({ takeover_minutes: Number(e.target.value) })}
          >
            <option value={0}>Off</option>
            <option value={1}>1 min before</option>
            <option value={2}>2 min before</option>
            <option value={5}>5 min before</option>
          </select>
        </label>
        <label className="row">
          <span>Alert again when it starts</span>
          <input
            type="checkbox"
            checked={settings.after_start}
            onChange={(e) => update({ after_start: e.target.checked })}
          />
        </label>
        <label className="row">
          <span>Snooze duration</span>
          <select
            value={settings.snooze_secs}
            onChange={(e) => update({ snooze_secs: Number(e.target.value) })}
          >
            <option value={60}>1 min</option>
            <option value={120}>2 min</option>
            <option value={300}>5 min</option>
          </select>
        </label>
        <label className="row">
          <span>Ignore events containing</span>
          <input
            type="text"
            className="keywords"
            placeholder="focus time, lunch, ooo"
            defaultValue={settings.ignored_keywords.join(", ")}
            onBlur={(e) =>
              update({
                ignored_keywords: e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
          />
        </label>
      </section>

      <section>
        <h2>General</h2>
        <label className="row">
          <span>Launch at login</span>
          <input
            type="checkbox"
            checked={settings.launch_at_login}
            onChange={(e) => update({ launch_at_login: e.target.checked })}
          />
        </label>
        <button className="btn-primary test" onClick={() => invoke("trigger_test_alert")}>
          Show test alert
        </button>
      </section>

      <section>
        <h2>Up next</h2>
        {status?.upcoming.length ? (
          <ul className="upcoming">
            {status.upcoming.map((item: AlertItem) => (
              <li key={item.id}>
                <span className="up-title">{item.title}</span>
                <span className="up-when">
                  {formatClock(item.start_ms)} · {relative(item.start_ms)}
                  {item.provider ? ` · ${item.provider}` : ""}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty">Nothing on the horizon.</p>
        )}
      </section>
    </div>
  );
}
