import { http } from "./http.js";

export const getReadingProgressRequest = () =>
  http.get("/api/reading-progress").then(response => response.data);
