import { requestJson } from "./client.js";

export function listStories(search = "", signal) {
  const query = search ? `?${new URLSearchParams({ search })}` : "";
  return requestJson(`/api/stories${query}`, { signal });
}

export const getStory = id => requestJson(`/api/stories/${id}`);
export const listChapters = storyId => requestJson(`/api/stories/${storyId}/chapters`);
export const getChapter = (chapterId, token) => requestJson(`/api/chapters/${chapterId}`, { token });

export const createStory = (story, token) =>
  requestJson("/api/stories", { method: "POST", body: story, token });
export const updateStory = (id, story, token) =>
  requestJson(`/api/stories/${id}`, { method: "PUT", body: story, token });
export const deleteStory = (id, token) =>
  requestJson(`/api/stories/${id}`, { method: "DELETE", token });

export const createChapter = (storyId, chapter, token) =>
  requestJson(`/api/stories/${storyId}/chapters`, { method: "POST", body: chapter, token });
export const updateChapter = (storyId, chapterId, chapter, token) =>
  requestJson(`/api/stories/${storyId}/chapters/${chapterId}`, { method: "PUT", body: chapter, token });
export const deleteChapter = (storyId, chapterId, token) =>
  requestJson(`/api/stories/${storyId}/chapters/${chapterId}`, { method: "DELETE", token });
