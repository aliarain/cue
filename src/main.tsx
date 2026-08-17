import React from "react";
import ReactDOM from "react-dom/client";
import { getCurrentWindow } from "@tauri-apps/api/window";
import AlertScreen from "./AlertScreen";
import QuickAdd from "./QuickAdd";
import SettingsScreen from "./SettingsScreen";
import "./index.css";

const label = getCurrentWindow().label;

let screen: React.ReactElement;
if (label.startsWith("alert-")) {
  document.body.classList.add("alert-body");
  screen = <AlertScreen />;
} else if (label === "quickadd") {
  document.body.classList.add("quickadd-body");
  screen = <QuickAdd />;
} else {
  document.body.classList.add("settings-body");
  screen = <SettingsScreen />;
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>{screen}</React.StrictMode>,
);
