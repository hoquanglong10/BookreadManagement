import { ApiError } from "../api/client.js";
import { clearSession } from "./session.js";

export function adminErrorMessage(error) {
  if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
    clearSession();
    window.location.replace("./account.html");
    return "Phiên đăng nhập không còn quyền quản trị.";
  }
  return error.message || "Yêu cầu không thành công.";
}
