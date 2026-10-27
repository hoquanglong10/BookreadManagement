import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { responseError } from "../api/http.js";
import { useAuth } from "../context/AuthContext.jsx";
import { changePassword, updateProfile } from "../services/profileService.js";

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState({ displayName: "", avatarUrl: "" });
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [profileNotice, setProfileNotice] = useState("");
  const [passwordNotice, setPasswordNotice] = useState("");
  const [profileError, setProfileError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => setProfile({ displayName: user?.displayName || user?.username || "", avatarUrl: user?.avatarUrl || "" }), [user]);
  if (!user) return <Navigate to="/account" replace />;

  async function saveProfile(event) {
    event.preventDefault(); setBusy(true); setProfileError(""); setProfileNotice("");
    try { const updated = await updateProfile(profile); updateUser(updated); setProfileNotice("Đã cập nhật hồ sơ."); }
    catch (error) { setProfileError(responseError(error)); }
    finally { setBusy(false); }
  }

  async function savePassword(event) {
    event.preventDefault(); setPasswordError(""); setPasswordNotice("");
    if (passwords.newPassword.length < 8 || passwords.newPassword.length > 128) return setPasswordError("Mật khẩu mới cần từ 8 đến 128 ký tự.");
    if (passwords.newPassword !== passwords.confirmPassword) return setPasswordError("Mật khẩu nhập lại chưa khớp.");
    setBusy(true);
    try { await changePassword({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword }); setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" }); setPasswordNotice("Đã đổi mật khẩu."); }
    catch (error) { setPasswordError(responseError(error)); }
    finally { setBusy(false); }
  }

  return <section className="profile-page">
    <div className="profile-page__intro"><p className="eyebrow">TÀI KHOẢN CỦA BẠN</p><h1>Hồ sơ độc giả</h1><p>Cập nhật thông tin hiển thị và bảo vệ tài khoản.</p></div>
    <div className="profile-page__grid">
      <form className="profile-card stack-form" onSubmit={saveProfile}>
        <div className="section-heading"><div><p className="section-heading__overline">THÔNG TIN CÁ NHÂN</p><h2>Hồ sơ</h2></div></div>
        <label>Tên đăng nhập<input value={user.username} readOnly /></label>
        <label>Email<input value={user.email || ""} readOnly /></label>
        <label>Tên hiển thị<input value={profile.displayName} onChange={event => setProfile({ ...profile, displayName: event.target.value })} required minLength="2" maxLength="80" /></label>
        <label>Đường dẫn ảnh đại diện<input type="url" value={profile.avatarUrl} onChange={event => setProfile({ ...profile, avatarUrl: event.target.value })} maxLength="500" placeholder="https://…" /></label>
        {profile.avatarUrl && <img className="profile-avatar-preview" src={profile.avatarUrl} alt="Ảnh đại diện xem trước" onError={event => { event.currentTarget.hidden = true; }} onLoad={event => { event.currentTarget.hidden = false; }} />}
        {profileError && <p className="form-message form-message--error" role="alert">{profileError}</p>}{profileNotice && <p className="form-message form-message--success" role="status">{profileNotice}</p>}
        <button className="button button--primary" disabled={busy}>Lưu hồ sơ</button>
      </form>
      <form className="profile-card stack-form" onSubmit={savePassword}>
        <div className="section-heading"><div><p className="section-heading__overline">BẢO MẬT</p><h2>Đổi mật khẩu</h2></div></div>
        <label>Mật khẩu hiện tại<input type="password" autoComplete="current-password" value={passwords.currentPassword} onChange={event => setPasswords({ ...passwords, currentPassword: event.target.value })} required maxLength="128" /></label>
        <label>Mật khẩu mới<input type="password" autoComplete="new-password" value={passwords.newPassword} onChange={event => setPasswords({ ...passwords, newPassword: event.target.value })} required minLength="8" maxLength="128" /></label>
        <label>Nhập lại mật khẩu mới<input type="password" autoComplete="new-password" value={passwords.confirmPassword} onChange={event => setPasswords({ ...passwords, confirmPassword: event.target.value })} required maxLength="128" /></label>
        {passwordError && <p className="form-message form-message--error" role="alert">{passwordError}</p>}{passwordNotice && <p className="form-message form-message--success" role="status">{passwordNotice}</p>}
        <button className="button button--outline" disabled={busy}>Đổi mật khẩu</button>
      </form>
    </div>
  </section>;
}
