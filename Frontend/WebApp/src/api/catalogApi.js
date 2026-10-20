import { http } from "./http.js";

export const getStoriesRequest = params => http.get("/api/stories", { params }).then(response => response.data);
export const getStoryRequest = id => http.get(`/api/stories/${id}`).then(response => response.data);
export const getChaptersRequest = storyId => http.get(`/api/stories/${storyId}/chapters`).then(response => response.data);
export const readChapterRequest = (storyId, number) =>
  http.get(`/api/stories/${storyId}/chapters/${number}`).then(response => response.data);
export const getChapterRequest = chapterId => http.get(`/api/chapters/${chapterId}`).then(response => response.data);
export const getGenresRequest = () => http.get("/api/genres").then(response => response.data);
