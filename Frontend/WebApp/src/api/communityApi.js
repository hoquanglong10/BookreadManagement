import { http } from "./http.js";

export const getFollowsRequest = () => http.get("/api/follows").then(response => response.data);
export const followStoryRequest = storyId => http.post(`/api/follows/${storyId}`);
export const unfollowStoryRequest = storyId => http.delete(`/api/follows/${storyId}`);

export const getNotificationsRequest = (unreadOnly = false) => http.get("/api/notifications", { params: { unreadOnly } }).then(response => response.data);
export const markNotificationReadRequest = id => http.put(`/api/notifications/${id}/read`);
export const markAllNotificationsReadRequest = () => http.put("/api/notifications/read-all");

export const getChapterCommentsRequest = chapterId => http.get(`/api/story-chapters/${chapterId}/comments`).then(response => response.data);
export const createChapterCommentRequest = (chapterId, body) => http.post(`/api/story-chapters/${chapterId}/comments`, body).then(response => response.data);
export const reportCommentRequest = (commentId, body) => http.post(`/api/comments/${commentId}/reports`, body);

export const getCommunityCommentsRequest = params => http.get("/api/admin/community/comments", { params }).then(response => response.data);
export const getCommentReportsRequest = status => http.get("/api/admin/community/reports", { params: { status } }).then(response => response.data);
export const setCommentVisibilityRequest = (id, isHidden) => http.put(`/api/admin/community/comments/${id}/visibility`, { isHidden });
export const deleteCommentRequest = id => http.delete(`/api/admin/community/comments/${id}`);
export const resolveCommentReportRequest = (id, body) => http.put(`/api/admin/community/reports/${id}`, body);

export const getAdminUsersRequest = params => http.get("/api/admin/users", { params }).then(response => response.data);
export const setAdminUserLockRequest = (id, isLocked) => http.put(`/api/admin/users/${id}/lock`, { isLocked }).then(response => response.data);
