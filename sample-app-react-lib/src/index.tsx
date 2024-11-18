import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { VoiceProvider } from "@lumenccs/webrtc-react";
import { Voice, VoiceConfig } from "@lumenccs/webrtc-sdk";

const URL = process.env.REACT_APP_WEBRTC_URL;

const VOICE_CONFIG: VoiceConfig = {
  user: "testuser",
  proxy: URL,
  domain: URL,
  port: 443,
};

const rootEl = document.getElementById("root");
if (rootEl === null) {
  throw new Error("Could not find root React element");
}
const root = ReactDOM.createRoot(rootEl);
root.render(
  <VoiceProvider value={new Voice(VOICE_CONFIG)}>
    <App />
  </VoiceProvider>
);
