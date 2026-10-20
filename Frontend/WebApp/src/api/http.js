import axios from "axios";

export const TOKEN_KEY = "bookread.jwt";

export function readToken() {
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function saveToken(token) {
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Authentication remains available for this browser session if storage is disabled.
  }
}

export function clearToken() {
  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Storage may be disabled by the browser.
  }
}

export const http = axios.create({
  baseURL: import.meta.env.DEV ? "/" : window.location.origin,
  headers: { Accept: "application/json" },
  timeout: 15000
});

http.interceptors.request.use(config => {
  const token = readToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

http.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401 && readToken()) {
      clearToken();
      window.dispatchEvent(new CustomEvent("bookread:unauthorized"));
    }
    return Promise.reject(error);
  }
);

export function responseError(error) {
  const data = error?.response?.data;
  const validation = data?.errors && Object.values(data.errors).flat().join(" ");
  if (data?.message || validation) return data.message || validation;
  if (error?.code === "ECONNABORTED") return "Máy chủ phản hồi quá lâu. Vui lòng thử lại.";
  if (!error?.response) return "Không kết nối được máy chủ. Hãy kiểm tra backend đang chạy.";
  return "Yêu cầu chưa thực hiện được. Vui lòng thử lại.";
}
