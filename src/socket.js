// src/socket.js
import { io } from "socket.io-client";

// Use the Heroku URL in production; fallback for development.
const URL =
  process.env.NODE_ENV === "production"
    ? "https://bidi-socket-app-e8aab12854fb.herokuapp.com"
    : "http://localhost:4242";

export const socket = io(URL);