import { login, register } from "../api/auth.js";
import { getSession, saveSession } from "../core/session.js";
import { setAccountMode, setFormBusy, showAuthNotice } from "../ui/account.js";

const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");

function goToAccountHome(session) {
  window.location.replace(session.user.role === "Admin" ? "./admin.html" : "./");
}

function setMode(mode) {
  setAccountMode(mode, setMode);
}

document.getElementById("login-tab").addEventListener("click", () => setMode("login"));
document.getElementById("register-tab").addEventListener("click", () => setMode("register"));

loginForm.addEventListener("submit", async event => {
  event.preventDefault();
  showAuthNotice("");
  const username = loginForm.elements.username.value.trim();
  const password = loginForm.elements.password.value;
  if (!username || !password) {
    showAuthNotice("Vui lòng nhập tên đăng nhập hoặc email và mật khẩu.");
    return;
  }
  setFormBusy(loginForm, true);
  try {
    const session = saveSession(await login(username, password));
    loginForm.reset();
    goToAccountHome(session);
  } catch (error) {
    showAuthNotice(error.message);
  } finally {
    setFormBusy(loginForm, false);
  }
});

registerForm.addEventListener("submit", async event => {
  event.preventDefault();
  showAuthNotice("");
  const username = registerForm.elements.username.value.trim();
  const email = registerForm.elements.email.value.trim();
  const password = registerForm.elements.password.value;
  const confirm = registerForm.elements.confirm.value;
  if (!/^[A-Za-z0-9_.-]{3,30}$/.test(username)) {
    showAuthNotice("Tên đăng nhập cần 3–30 ký tự, chỉ gồm chữ không dấu, số, _, . hoặc -.");
    return;
  }
  if (!registerForm.elements.email.checkValidity()) {
    showAuthNotice("Vui lòng nhập email hợp lệ.");
    return;
  }
  if (password.length < 8 || password.length > 128) {
    showAuthNotice("Mật khẩu phải dài từ 8 đến 128 ký tự.");
    return;
  }
  if (password !== confirm) {
    showAuthNotice("Mật khẩu nhập lại không khớp.");
    return;
  }
  setFormBusy(registerForm, true);
  try {
    await register(username, email, password);
    registerForm.reset();
    try {
      goToAccountHome(saveSession(await login(username, password)));
    } catch {
      setMode("login");
      loginForm.elements.username.value = username;
      showAuthNotice("Đăng ký thành công. Vui lòng đăng nhập.", true);
    }
  } catch (error) {
    showAuthNotice(error.message);
  } finally {
    setFormBusy(registerForm, false);
  }
});

const saved = getSession();
if (saved) goToAccountHome(saved);
setMode("login");
