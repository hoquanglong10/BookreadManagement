import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const adminLinks = [
  { to: "/admin", label: "Tổng quan", end: true, mark: "01" },
  { to: "/admin/stories", label: "Truyện & chương", mark: "02" },
  { to: "/admin/genres", label: "Thể loại", mark: "03" },
  { to: "/admin/customers", label: "Tài khoản", mark: "04" }
];

export default function AdminLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  function logout() {
    signOut();
    navigate("/account", { replace: true });
  }

  return <div className="admin-app">
    <header className="admin-topbar">
      <div className="admin-topbar__brand"><button className="admin-menu-toggle" type="button" aria-expanded={menuOpen} aria-label={menuOpen ? "Đóng danh mục" : "Mở danh mục"} onClick={() => setMenuOpen(value => !value)}><span /><span /><span /></button><span className="admin-topbar__label">KHÔNG GIAN QUẢN TRỊ</span><strong>Đọc<span>Truyện</span></strong></div>
      <div className="admin-topbar__user"><span>{user?.username}</span><button type="button" onClick={logout}>Đăng xuất</button></div>
    </header>
    <div className="admin-shell">
      <aside className={`admin-sidebar${menuOpen ? " is-open" : ""}`}>
        <p className="admin-sidebar__label">QUẢN LÝ THƯ VIỆN</p>
        <nav aria-label="Điều hướng quản trị">{adminLinks.map(item => <NavLink key={item.to} to={item.to} end={item.end} onClick={() => setMenuOpen(false)} className={({ isActive }) => `admin-sidebar__link${isActive ? " is-active" : ""}`}><span>{item.mark}</span>{item.label}</NavLink>)}</nav>
        <div className="admin-sidebar__bottom"><NavLink to="/" className="admin-sidebar__back">← Trở về thư viện</NavLink><span>Bookread · Admin</span></div>
      </aside>
      {menuOpen && <button className="admin-sidebar-scrim" aria-label="Đóng danh mục" type="button" onClick={() => setMenuOpen(false)} />}
      <main className="admin-content"><Outlet /></main>
    </div>
  </div>;
}
