import { useCallback, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type { AlertItem } from "./types";

function useNow(intervalMs: number) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

function startsIn(startMs: number, now: number): string {
  const mins = Math.ceil((startMs - now) / 60000);
  if (mins <= 0) return "starts now";
  if (mins === 1) return "starts in 1 minute";
  return `starts in ${mins} minutes`;
}

export default function Banner() {
  const [item, setItem] = useState<AlertItem | null>(null);
  const now = useNow(1000);

  const fetchPayload = useCallback(() => {
    invoke<AlertItem | null>("get_banner_payload").then(setItem).catch(() => {});
  }, []);

  useEffect(() => {
    fetchPayload();
    const unlisten = listen("banner-updated", fetchPayload);
    return () => {
      unlisten.then((fn) => fn());
    };
  }, [fetchPayload]);

  if (!item) return null;

  return (
    <div className="banner-root">
      <div className="banner-pill">
        <span className="banner-dot" />
        <span className="banner-text">
          <b>{item.title}</b> {startsIn(item.start_ms, now)}
        </span>
        {item.meeting_url && (
          <button
            className="banner-join"
            onClick={() => invoke("banner_action", { action: "join" })}
          >
            Join {item.provider ?? "Meeting"}
          </button>
        )}
        <button
          className="banner-x"
          aria-label="Dismiss"
          onClick={() => invoke("banner_action", { action: "dismiss" })}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
