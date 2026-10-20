import { requestJson } from "./client.js";

export const readChapter = (storyId, number, signal) =>
  requestJson(`/api/stories/${storyId}/chapters/${number}`, { signal });
