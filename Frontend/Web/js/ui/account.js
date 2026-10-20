const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const loginTab = document.getElementById("login-tab");
const registerTab = document.getElementById("register-tab");
const switchHint = document.getElementById("switch-hint");
const notice = document.getElementById("notice");

export function showAuthNotice(message, success = false) {
  notice.textContent = message;
  notice.classList.toggle("success", success);
  notice.hidden = !message;
}

export function setAccountMode(mode, onSwitch) {
  const registering = mode === "register";
  loginForm.hidden = registering;
  registerForm.hidden = !registering;
  loginTab.classList.toggle("active", !registering);
  registerTab.classList.toggle("active", registering);
  loginTab.setAttribute("aria-selected", String(!registering));
  registerTab.setAttribute("aria-selected", String(registering));
  document.getElementById("form-title").textContent = registering
    ? "Tạo tài khoản" : "Đăng nhập tài khoản";
  document.getElementById("form-description").textContent = registering
    ? "Điền thông tin để đăng ký tài khoản mới."
    : "Nhập tên đăng nhập hoặc email để tiếp tục.";
  switchHint.replaceChildren(document.createTextNode(registering ? "Đã có tài khoản? " : "Chưa có tài khoản? "));
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = registering ? "Đăng nhập" : "Đăng ký ngay";
  button.addEventListener("click", () => onSwitch(registering ? "login" : "register"));
  switchHint.append(button);
  showAuthNotice("");
}

export function setFormBusy(form, busy) {
  form.querySelector("button[type=submit]").disabled = busy;
}
