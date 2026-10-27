import {
  getAdminPaymentsRequest, getAvailablePlansRequest, getPaymentHistoryRequest,
  reconcilePaymentRequest, startPlanPaymentRequest, startStoryPaymentRequest
} from "../api/paymentApi.js";

const paymentRequest = simulateFailure => ({ requestId: crypto.randomUUID(), simulateFailure });

export const paymentService = {
  getPlans: getAvailablePlansRequest,
  getHistory: getPaymentHistoryRequest,
  getAdminPayments: getAdminPaymentsRequest,
  subscribe: (planId, fail = false) => startPlanPaymentRequest(planId, paymentRequest(fail)),
  purchaseStory: (storyId, fail = false) => startStoryPaymentRequest(storyId, paymentRequest(fail)),
  reconcile: (id, note) => reconcilePaymentRequest(id, { note })
};
