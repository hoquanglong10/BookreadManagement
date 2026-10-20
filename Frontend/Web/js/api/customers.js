import { requestJson } from "./client.js";

export const listCustomers = token => requestJson("/api/customers", { token });
export const getCustomer = (id, token) => requestJson(`/api/customers/${id}`, { token });
export const createCustomer = (customer, token) =>
  requestJson("/api/customers", { method: "POST", body: customer, token });
export const updateCustomer = (id, customer, token) =>
  requestJson(`/api/customers/${id}`, { method: "PUT", body: customer, token });
export const deleteCustomer = (id, token) =>
  requestJson(`/api/customers/${id}`, { method: "DELETE", token });
