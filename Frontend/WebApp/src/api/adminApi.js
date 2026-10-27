import { http } from "./http.js";

export const createStoryRequest = body => http.post("/api/stories", body).then(response => response.data);
export const updateStoryRequest = (id, body) => http.put(`/api/stories/${id}`, body);
export const deleteStoryRequest = id => http.delete(`/api/stories/${id}`);
export const uploadStoryCoverRequest = file => { const form = new FormData(); form.append("file", file); return http.post("/api/stories/covers", form).then(response => response.data); };
export const createChapterRequest = (storyId, body) => http.post(`/api/stories/${storyId}/chapters`, body);
export const updateChapterRequest = (storyId, chapterId, body) => http.put(`/api/stories/${storyId}/chapters/${chapterId}`, body);
export const deleteChapterRequest = (storyId, chapterId) => http.delete(`/api/stories/${storyId}/chapters/${chapterId}`);

export const createGenreRequest = name => http.post("/api/genres", { name });
export const updateGenreRequest = (id, name) => http.put(`/api/genres/${id}`, { name });
export const deleteGenreRequest = id => http.delete(`/api/genres/${id}`);

export const getPlansRequest = () => http.get("/api/plans").then(response => response.data);
export const createPlanRequest = body => http.post("/api/plans", body);
export const updatePlanRequest = (id, body) => http.put(`/api/plans/${id}`, body);
export const getReadEventsRequest = params => http.get("/api/admin/read-events", { params }).then(response => response.data);

export const getCustomersRequest = () => http.get("/api/customers").then(response => response.data);
export const getCustomerRequest = id => http.get(`/api/customers/${id}`).then(response => response.data);
export const createCustomerRequest = body => http.post("/api/customers", body);
export const updateCustomerRequest = (id, body) => http.put(`/api/customers/${id}`, body);
export const deleteCustomerRequest = id => http.delete(`/api/customers/${id}`);
