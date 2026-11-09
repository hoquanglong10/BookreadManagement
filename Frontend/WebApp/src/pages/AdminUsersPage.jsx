import { useCallback, useEffect, useState } from "react";
import { EmptyState, ErrorState, LoadingState } from "../components/StatePanel.jsx";
import { responseError } from "../api/http.js";
import { communityService } from "../services/communityService.js";
import { formatDate } from "../utils/format.js";

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ items: [], totalCount: 0 });
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setLoading(true); setError("");
    try { setResult(await communityService.getAdminUsers({ search, status, page, pageSize: 100 })); }
    catch (reason) { setError(responseError(reason)); }
    finally { setLoading(false); }
  }, [search, status, page]);
  useEffect(() => { const timer = window.setTimeout(reload, 200); return () => window.clearTimeout(timer); }, [reload]);

  async function setLock(user) {
    const next = !user.isLocked;
    if (next && !window.confirm(`Khóa tài khoản ${user.username}? Phiên đăng nhập hiện tại sẽ mất hiệu lực ngay.`)) return;
    setBusyId(user.id); setError("");
    try {
      await communityService.setUserLock(user.id, next);
      setResult(current => ({ ...current, items: current.items.map(item => item.id === user.id ? { ...item, isLocked: next } : item) }));
    } catch (reason) { setError(responseError(reason)); }
    finally { setBusyId(null); }
  }

  return <div className="admin-page">
    <div className="admin-page__heading"><div><p className="eyebrow">QUẢN TRỊ / THÀNH VIÊN</p><h1>Thành viên</h1><p>Xem trạng thái tài khoản, gói còn hiệu lực và các truyện đã mua.</p></div><span className="admin-page__total">{result.totalCount} tài khoản</span></div>
    {error && <p className="form-message form-message--error" role="alert">{error}</p>}
    <div className="admin-toolbar admin-user-filters"><label className="admin-search"><span className="sr-only">Tìm thành viên</span><input value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} placeholder="Tên đăng nhập, tên hiển thị hoặc email" /></label><label>Trạng thái<select value={status} onChange={event => { setStatus(event.target.value); setPage(1); }}><option value="All">Tất cả</option><option value="Active">Đang hoạt động</option><option value="Locked">Đã khóa</option></select></label></div>
    {loading ? <LoadingState label="Đang tải thành viên…" /> : result.items.length ? <><div className="admin-table-wrap"><table className="admin-table admin-user-table"><thead><tr><th>Thành viên</th><th>Trạng thái</th><th>Gói đang dùng</th><th>Truyện đã mua</th><th>Ngày tham gia</th><th>Thao tác</th></tr></thead><tbody>{result.items.map(user => <tr key={user.id}>
      <td data-label="Thành viên"><strong>{user.displayName}</strong><span>@{user.username} · {user.email || "Chưa có email"}</span><small>{user.role === "Admin" ? "Quản trị viên" : "Thành viên"}</small></td>
      <td data-label="Trạng thái"><span className={`admin-status${user.isLocked ? " admin-status--locked" : " admin-status--active"}`}>{user.isLocked ? "Đã khóa" : "Hoạt động"}</span></td>
      <td data-label="Gói đang dùng">{user.activePlans.length ? user.activePlans.map(plan => <span className="admin-user-chip" key={`${plan.plan}-${plan.endsAt}`}>{plan.plan}<small>đến {formatDate(plan.endsAt)}</small></span>) : <span className="quiet-note">Không có</span>}</td>
      <td data-label="Truyện đã mua"><strong>{user.purchasedStoryCount}</strong>{user.purchasedStories.length > 0 && <details className="admin-user-purchases"><summary>Xem danh sách</summary><ul>{user.purchasedStories.map((purchase, index) => <li key={`${purchase.story}-${index}`}>{purchase.story}</li>)}</ul></details>}</td>
      <td data-label="Ngày tham gia">{formatDate(user.createdAt)}</td>
      <td data-label="Thao tác"><button type="button" className={user.isLocked ? "button button--outline" : "button-text--danger"} disabled={busyId === user.id || user.role === "Admin" && !user.isLocked} onClick={() => setLock(user)}>{busyId === user.id ? "Đang lưu…" : user.isLocked ? "Mở khóa" : "Khóa tài khoản"}</button></td>
    </tr>)}</tbody></table></div>{result.totalPages > 1 && <div className="admin-pagination"><button className="button button--outline" type="button" disabled={page <= 1} onClick={() => setPage(value => value - 1)}>Trước</button><span>Trang {page} / {result.totalPages}</span><button className="button button--outline" type="button" disabled={page >= result.totalPages} onClick={() => setPage(value => value + 1)}>Tiếp</button></div>}</> : <EmptyState title="Không tìm thấy thành viên" detail="Thử đổi từ khóa hoặc bộ lọc trạng thái." />}
  </div>;
}
