/**
 * SocialForest — isolated service port registry
 *
 * Each service gets its own dedicated port. Do not reuse ports across services.
 * System-reserved ports on this VM (do not use):
 *   26053 — Cursor exec-daemon
 *   26054 — Cursor PTY websocket
 *   26055 — Cursor server
 *   26058 — Python utility
 *   5901  — VNC
 */

export const SERVICE_PORTS = {
  /** SocialForest Next.js web application (dev + production) */
  SOCIALFOREST_APP: 4350,
};

export const APP_PORT = SERVICE_PORTS.SOCIALFOREST_APP;
export const APP_HOST = '0.0.0.0';
export const APP_URL = `http://localhost:${APP_PORT}`;
