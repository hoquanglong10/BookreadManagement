const apiBase = window.location.pathname.startsWith("/app")
  ? window.location.origin
  : "http://localhost:5059";

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function responseMessage(data) {
  const validation = data?.errors && Object.values(data.errors).flat().join(" ");
  return data?.message || validation || "Yêu cầu không thành công. Vui lòng thử lại.";
}

export async function requestJson(path, { method = "GET", body, token, signal } = {}) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(apiBase + path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new ApiError("Không kết nối được API. Hãy kiểm tra backend đang chạy.", 0);
  }

  if (response.status === 204) return null;
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(responseMessage(data), response.status);
  if (data === null) throw new ApiError("Dữ liệu từ API không hợp lệ.", response.status);
  return data;
}
