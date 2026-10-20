import { loginRequest, registerRequest } from "../api/authApi.js";

export async function signIn(username, password) {
  const session = await loginRequest({ username: username.trim(), password });
  if (!session?.token || !session?.user) throw new Error("Máy chủ chưa trả về phiên đăng nhập hợp lệ.");
  return session;
}

export async function signUp({ username, email, password }) {
  return registerRequest({ username: username.trim(), email: email.trim(), password });
}

export function validateLogin({ username, password }) {
  const account = username.trim();
  if (!account || !password) return "Vui lòng nhập tài khoản và mật khẩu.";
  const isUsername = /^[A-Za-z0-9]{3,30}$/.test(account);
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(account);
  if (!isUsername && !isEmail) return "Tài khoản chỉ gồm chữ, số hoặc một địa chỉ email hợp lệ.";
  return "";
}

export function validateRegistration({ username, email, password, confirmPassword }) {
  if (!/^[A-Za-z0-9]{3,30}$/.test(username.trim())) {
    return "Tên đăng nhập cần 3–30 ký tự, chỉ gồm chữ không dấu và số.";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return "Vui lòng nhập email hợp lệ.";
  if (password.length < 8 || password.length > 128) return "Mật khẩu phải dài từ 8 đến 128 ký tự.";
  if (password !== confirmPassword) return "Mật khẩu nhập lại chưa khớp.";
  return "";
}
