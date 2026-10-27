import { http } from "./http.js";

export const getAvailablePlansRequest = () => http.get("/api/plans/available").then(response => response.data);
export const startPlanPaymentRequest = (planId, request) => http.post(`/api/payments/plans/${planId}`, request).then(response => response.data);
export const startStoryPaymentRequest = (storyId, request) => http.post(`/api/payments/stories/${storyId}`, request).then(response => response.data);
export const getPaymentHistoryRequest = () => http.get("/api/payments/mine").then(response => response.data);
export const getAdminPaymentsRequest = params => http.get("/api/admin/payments", { params }).then(response => response.data);
export const reconcilePaymentRequest = (id, body) => http.post(`/api/admin/payments/${id}/reconcile`, body).then(response => response.data);
