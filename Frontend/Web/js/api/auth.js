import { requestJson } from "./client.js";

export const login = (username, password) =>
  requestJson("/api/auth/login", { method: "POST", body: { username, password } });

export const register = (username, email, password) =>
  requestJson("/api/auth/register", { method: "POST", body: { username, email, password } });
