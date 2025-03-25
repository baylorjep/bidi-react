// src/socket.js
import { io } from "socket.io-client";

// Use the Heroku URL in production; fallback for development.
const URL =
  process.env.NODE_ENV === "production"
    ? "https://git.heroku.com/bidi-socket-app.git"  // Update with your Heroku app URL
    : "http://localhost:4242";

export const socket = io(URL);