import { getReadingProgressRequest } from "../api/readingProgressApi.js";

export async function loadReadingProgress() {
  const result = await getReadingProgressRequest();
  return Array.isArray(result) ? result : result?.items ?? [];
}
