export function displayStatus(value) {
  if (value === "Hoàn thành" || value === "Completed") return "Hoàn thành";
  if (value === "Đang cập nhật" || value === "Ongoing") return "Đang ra";
  return value || "Chưa cập nhật";
}

export function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}

export function formatDateTimeLocal(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export function toIsoDate(value) {
  return value ? new Date(value).toISOString() : null;
}
