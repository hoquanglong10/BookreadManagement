import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const adminLinks = [
  { to: "/admin", label: "Tổng quan", end: true, mark: "01" },
  { to: "/admin/stories", label: "Truyện & chương", mark: "02" },
  { to: "/admin/genres", label: "Thể loại", mark: "03" },
  { to: "/admin/customers", label: "Tài khoản", mark: "04" },
  { to: "/admin/plans", label: "Gói đọc", mark: "05" },
  { to: "/admin/read-events", label: "Lượt đọc", mark: "06" },
  { to: "/admin/analytics", label: "Thống kê", mark: "07" },
  { to: "/admin/payments", label: "Giao dịch", mark: "08" },
  { to: "/admin/community", label: "Thảo luận", mark: "09" },
  { to: "/admin/users", label: "Thành viên", mark: "10" }
];

export default function AdminLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  function logout() {
    signOut();
    navigate("/account", { replace: true });
  }

  return <div className={`admin-app${sidebarCollapsed ? " is-sidebar-collapsed" : ""}`}>
    <header className="admin-topbar">
      <div className="admin-topbar__brand">
        <button className="admin-sidebar-toggle" type="button" aria-controls="admin-navigation" aria-expanded={!sidebarCollapsed} aria-label={sidebarCollapsed ? "Mở rộng thanh điều hướng" : "Thu gọn thanh điều hướng"} onClick={() => setSidebarCollapsed(value => !value)}><svg aria-hidden="true" viewBox="0 0 20 20"><path d="M3 5h14M3 10h14M3 15h14" /></svg></button>
        <button className="admin-menu-toggle" type="button" aria-controls="admin-navigation" aria-expanded={menuOpen} aria-label={menuOpen ? "Đóng danh mục" : "Mở danh mục"} onClick={() => setMenuOpen(value => !value)}><span /><span /><span /></button>
        <span className="admin-topbar__label"></span><strong>Đọc<span>Truyện</span></strong>
      </div>
      <div className="admin-topbar__user"><span>{user?.username}</span><button type="button" onClick={logout}>Đăng xuất</button></div>
    </header>
    <div className="admin-shell">
      <aside id="admin-navigation" className={`admin-sidebar${menuOpen ? " is-open" : ""}`}>
        <p className="admin-sidebar__label">QUẢN LÝ THƯ VIỆN</p>
        <nav aria-label="Điều hướng quản trị">{adminLinks.map(item => <NavLink key={item.to} title={item.label} aria-label={item.label} to={item.to} end={item.end} onClick={() => setMenuOpen(false)} className={({ isActive }) => `admin-sidebar__link${isActive ? " is-active" : ""}`}><span>{item.mark}</span>{item.label}</NavLink>)}</nav>
        <div className="admin-sidebar__bottom"><NavLink to="/" className="admin-sidebar__back"><span className="admin-sidebar__back-mark">←</span><span className="admin-sidebar__back-label">Trở về thư viện</span></NavLink><span>Bookread · Admin</span></div>
      </aside>
      {menuOpen && <button className="admin-sidebar-scrim" aria-label="Đóng danh mục" type="button" onClick={() => setMenuOpen(false)} />}
      <main className="admin-content"><Outlet /></main>
    </div>
  </div>;
}
