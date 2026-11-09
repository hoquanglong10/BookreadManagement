import {
  createChapterCommentRequest, deleteCommentRequest, followStoryRequest, getAdminUsersRequest,
  getChapterCommentsRequest, getCommentReportsRequest, getCommunityCommentsRequest,
  getFollowsRequest, getNotificationsRequest, markAllNotificationsReadRequest,
  markNotificationReadRequest, reportCommentRequest, resolveCommentReportRequest,
  setAdminUserLockRequest, setCommentVisibilityRequest, unfollowStoryRequest
} from "../api/communityApi.js";

export const communityService = {
  getFollows: () => getFollowsRequest(),
  follow: storyId => followStoryRequest(storyId),
  unfollow: storyId => unfollowStoryRequest(storyId),
  getNotifications: unreadOnly => getNotificationsRequest(unreadOnly),
  markNotificationRead: id => markNotificationReadRequest(id),
  markAllNotificationsRead: () => markAllNotificationsReadRequest(),
  getComments: chapterId => getChapterCommentsRequest(chapterId),
  postComment: (chapterId, body) => createChapterCommentRequest(chapterId, body),
  reportComment: (commentId, reason) => reportCommentRequest(commentId, { reason }),
  getAdminComments: params => getCommunityCommentsRequest(params),
  getReports: status => getCommentReportsRequest(status),
  setVisibility: (id, isHidden) => setCommentVisibilityRequest(id, isHidden),
  deleteComment: id => deleteCommentRequest(id),
  resolveReport: (id, body) => resolveCommentReportRequest(id, body),
  getAdminUsers: params => getAdminUsersRequest(params),
  setUserLock: (id, isLocked) => setAdminUserLockRequest(id, isLocked)
};
