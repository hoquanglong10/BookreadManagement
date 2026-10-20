import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { responseError } from "../api/http.js";
import { useAuth } from "../context/AuthContext.jsx";
import { signIn, signUp, validateLogin, validateRegistration } from "../services/authService.js";

export default function AuthPage() {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ username: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signIn: saveSession } = useAuth();

  if (user) return <Navigate to={user.role === "Admin" ? "/admin" : "/"} replace />;

  function update(field, value) { setForm(previous => ({ ...previous, [field]: value })); }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    const validation = mode === "register" ? validateRegistration(form) : validateLogin(form);
    if (validation) return setError(validation);
    setBusy(true);
    try {
      if (mode === "register") {
        await signUp(form);
        setNotice("Tạo tài khoản thành công. Đang đăng nhập…");
      }
      const session = await signIn(form.username, form.password);
      saveSession(session);
      const target = session.user.role === "Admin" ? "/admin" : location.state?.from?.pathname || "/";
      navigate(target, { replace: true });
    } catch (reason) {
      setError(responseError(reason));
    } finally {
      setBusy(false);
    }
  }

  function switchMode(nextMode) {
    setMode(nextMode);
    setError("");
    setNotice("");
  }

  return <div className="account-page">
    <section className="account-panel" aria-labelledby="account-title">
      <div className="account-panel__intro"><span className="account-panel__bookmark" aria-hidden="true">01</span><p className="eyebrow">BẮT ĐẦU ĐỌC</p><h1 id="account-title">Một tài khoản,<br />nhiều thế giới.</h1><p>Đăng nhập để tiếp tục hành trình đọc truyện của bạn.</p></div>
      <div className="account-panel__form-wrap">
        <div className="account-tabs" role="tablist" aria-label="Tài khoản"><button type="button" role="tab" aria-selected={mode === "login"} className={mode === "login" ? "is-active" : ""} onClick={() => switchMode("login")}>Đăng nhập</button><button type="button" role="tab" aria-selected={mode === "register"} className={mode === "register" ? "is-active" : ""} onClick={() => switchMode("register")}>Tạo tài khoản</button></div>
        <form className="account-form" onSubmit={handleSubmit} noValidate>
          {mode === "register" && <label>Email<input type="email" autoComplete="email" value={form.email} onChange={event => update("email", event.target.value)} required maxLength="200" /></label>}
          <label>{mode === "login" ? "Tên đăng nhập hoặc email" : "Tên đăng nhập"}<input type="text" autoComplete="username" value={form.username} onChange={event => update("username", event.target.value)} required minLength="3" maxLength="30" /></label>
          <label>Mật khẩu<input type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} value={form.password} onChange={event => update("password", event.target.value)} required minLength="8" maxLength="128" /></label>
          {mode === "register" && <label>Nhập lại mật khẩu<input type="password" autoComplete="new-password" value={form.confirmPassword} onChange={event => update("confirmPassword", event.target.value)} required /></label>}
          {error && <p className="form-message form-message--error" role="alert">{error}</p>}
          {notice && <p className="form-message form-message--success" role="status">{notice}</p>}
          <button className="button button--primary account-form__submit" type="submit" disabled={busy}>{busy ? "Đang xử lý…" : mode === "login" ? "Đăng nhập" : "Tạo tài khoản"}<span aria-hidden="true">→</span></button>
        </form>
        <p className="account-form__foot">Sau khi đăng nhập, bạn có thể khám phá và đọc truyện trong thư viện. <Link to="/">Quay lại khám phá</Link></p>
      </div>
    </section>
  </div>;
}
