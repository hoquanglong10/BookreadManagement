import { http } from "./http.js";

export const loginRequest = credentials => http.post("/api/auth/login", credentials).then(response => response.data);
export const registerRequest = account => http.post("/api/auth/register", account).then(response => response.data);
export const currentUserRequest = () => http.get("/api/auth/me").then(response => response.data);
