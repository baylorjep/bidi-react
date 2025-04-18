// src/socket.js
import { io } from "socket.io-client";

const HEROKU_URL = "https://bidi-socket-app-e8aab12854fb.herokuapp.com";
const LOCAL_URL  = process.env.REACT_APP_SOCKET_URL || "http://localhost:4242";

const URL =
  process.env.NODE_ENV === "production"
    ? HEROKU_URL
    : LOCAL_URL;

export const socket = io(URL, {
  transports: ["websocket", "polling"],   // try websocket first
  withCredentials: true,                  // if your server sends cookies
});

// optional: log connection events so you can debug in the browser console
socket.on("connect", () => {
  console.log("⚡️ Socket connected! id =", socket.id);
});
socket.on("connect_error", (err) => {
  console.error("❌ Socket connection error:", err);
});