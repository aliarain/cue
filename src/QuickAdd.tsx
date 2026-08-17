import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";

export default function QuickAdd() {
  const [text, setText] = useState("");
  const [hint, setHint] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unlisten = listen("quickadd-open", () => {
      setText("");
      setHint(null);
      setConfirmed(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    });
    const unfocus = getCurrentWindow().onFocusChanged(({ payload: focused }) => {
      if (!focused) invoke("close_quickadd").catch(() => {});
    });
    return () => {
      unlisten.then((fn) => fn());
      unfocus.then((fn) => fn());
    };
  }, []);

  useEffect(() => {
    if (!text.trim()) {
      setHint(null);
      return;
    }
    const id = setTimeout(() => {
      invoke<string | null>("preview_quick_reminder", { text })
        .then((p) => setHint(p ? `⏰ ${p}` : "Add a time: “in 10m” or “at 9pm”"))
        .catch(() => setHint(null));
    }, 120);
    return () => clearTimeout(id);
  }, [text]);

  const submit = async () => {
    if (!text.trim() || confirmed) return;
    try {
      const desc = await invoke<string>("create_quick_reminder", { text });
      setConfirmed(`✓ ${desc}`);
      setTimeout(() => invoke("close_quickadd").catch(() => {}), 900);
    } catch (e) {
      setHint(String(e));
    }
  };

  return (
    <div className="quickadd-root">
      <input
        ref={inputRef}
        autoFocus
        value={text}
        placeholder="tea in 10m · call Ahmed at 9pm · stop working at 2am"
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
          else if (e.key === "Escape") invoke("close_quickadd").catch(() => {});
        }}
      />
      <div className={`quickadd-hint ${confirmed ? "quickadd-ok" : ""}`}>
        {confirmed ?? hint ?? "⌥Space anywhere · Enter to save · Esc to close"}
      </div>
    </div>
  );
}
