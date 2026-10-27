import {
  getAdminPaymentsRequest, getAvailablePlansRequest, getPaymentHistoryRequest,
  reconcilePaymentRequest, startPlanPaymentRequest, startStoryPaymentRequest
} from "../api/paymentApi.js";

const pendingRequests = new Map();

function pendingRequestId(key) {
  try {
    const stored = window.sessionStorage.getItem(key);
    if (stored) return stored;
  } catch { /* Fall back to memory if session storage is unavailable. */ }
  const requestId = pendingRequests.get(key) || crypto.randomUUID();
  pendingRequests.set(key, requestId);
  try { window.sessionStorage.setItem(key, requestId); } catch { /* The in-memory key still covers retries in this page. */ }
  return requestId;
}

function clearPendingRequest(key) {
  pendingRequests.delete(key);
  try { window.sessionStorage.removeItem(key); } catch { /* Storage may be unavailable. */ }
}

async function checkout(key, simulateFailure, send) {
  const requestId = pendingRequestId(key);
  try {
    const result = await send({ requestId, simulateFailure });
    clearPendingRequest(key);
    return result;
  } catch (error) {
    // A definitive client error did not create a checkout; network and server errors may have.
    if (error.response?.status >= 400 && error.response.status < 500) clearPendingRequest(key);
    throw error;
  }
}

export const paymentService = {
  getPlans: getAvailablePlansRequest,
  getHistory: getPaymentHistoryRequest,
  getAdminPayments: getAdminPaymentsRequest,
  subscribe: (planId, fail = false, userId = "anonymous") =>
    checkout(`bookread.pending-payment.${userId}.plan.${planId}.${fail}`, fail, request => startPlanPaymentRequest(planId, request)),
  purchaseStory: (storyId, fail = false, userId = "anonymous") =>
    checkout(`bookread.pending-payment.${userId}.story.${storyId}.${fail}`, fail, request => startStoryPaymentRequest(storyId, request)),
  reconcile: (id, note) => reconcilePaymentRequest(id, { note })
};
