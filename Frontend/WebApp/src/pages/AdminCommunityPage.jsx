import { useCallback, useEffect, useState } from "react";
import { EmptyState, ErrorState, LoadingState } from "../components/StatePanel.jsx";
import { responseError } from "../api/http.js";
import { communityService } from "../services/communityService.js";
import { formatDate } from "../utils/format.js";

export default function AdminCommunityPage() {
  const [tab, setTab] = useState("reports");
  const [status, setStatus] = useState("Pending");
  const [visibility, setVisibility] = useState("All");
  const [search, setSearch] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const reload = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const result = tab === "reports"
        ? await communityService.getReports(status)
        : await communityService.getAdminComments({ search, visibility });
      setItems(result.items || []);
    } catch (reason) { setError(responseError(reason)); }
    finally { setLoading(false); }
  }, [tab, status, visibility, search]);
  useEffect(() => { const timer = window.setTimeout(reload, 150); return () => window.clearTimeout(timer); }, [reload]);

  async function moderateComment(item, action) {
    setBusyId(item.id); setError("");
    try {
      if (action === "delete") await communityService.deleteComment(item.id);
      else await communityService.setVisibility(item.id, action === "hide");
      await reload();
    } catch (reason) { setError(responseError(reason)); }
    finally { setBusyId(null); }
  }

  async function resolve(item, nextStatus, hideComment = false) {
    setBusyId(item.id); setError("");
    try {
      await communityService.resolveReport(item.id, { status: nextStatus, hideComment, adminNote: "" });
      await reload();
    } catch (reason) { setError(responseError(reason)); }
    finally { setBusyId(null); }
  }

  return <div className="admin-page">
    <div className="admin-page__heading"><div><p className="eyebrow">QUẢN TRỊ / CỘNG ĐỒNG</p><h1>Thảo luận & báo cáo</h1><p>Kiểm tra nội dung được báo cáo, ẩn hoặc gỡ bình luận vi phạm.</p></div></div>
    <div className="library-tabs admin-community-tabs" role="tablist" aria-label="Quản lý thảo luận">
      <button type="button" role="tab" aria-selected={tab === "reports"} className={tab === "reports" ? "is-active" : ""} onClick={() => setTab("reports")}>Báo cáo</button>
      <button type="button" role="tab" aria-selected={tab === "comments"} className={tab === "comments" ? "is-active" : ""} onClick={() => setTab("comments")}>Bình luận</button>
    </div>
    <div className="admin-toolbar">
      {tab === "reports" ? <label>Trạng thái<select value={status} onChange={event => setStatus(event.target.value)}><option value="Pending">Chờ xử lý</option><option value="Resolved">Đã xử lý</option><option value="Dismissed">Đã bỏ qua</option><option value="All">Tất cả</option></select></label> : <>
        <label className="admin-search"><span className="sr-only">Tìm bình luận</span><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Nội dung, người viết hoặc truyện" /></label>
        <label>Hiển thị<select value={visibility} onChange={event => setVisibility(event.target.value)}><option value="All">Tất cả</option><option value="Visible">Đang hiển thị</option><option value="Hidden">Đã ẩn</option><option value="Deleted">Đã gỡ</option></select></label>
      </>}
      <span>{items.length} mục</span>
    </div>
    {error && <ErrorState message={error} onRetry={reload} />}
    {loading ? <LoadingState label="Đang tải nội dung cộng đồng…" /> : items.length ? <div className="admin-community-list">{items.map(item => tab === "reports" ? <article className="admin-community-card" key={item.id}>
      <div className="admin-community-card__meta"><span>Báo cáo bởi {item.reporter}</span><time>{formatDate(item.createdAt)}</time><span className={`admin-status${item.status === "Pending" ? " admin-status--locked" : " admin-status--active"}`}>{item.status === "Pending" ? "Chờ xử lý" : item.status === "Resolved" ? "Đã xử lý" : "Đã bỏ qua"}</span></div>
      <p className="admin-community-card__context">{item.storyTitle} · Chương {item.chapterNumber}: {item.chapterTitle} · Bình luận của {item.commentAuthor}</p>
      <blockquote>{item.comment}</blockquote><p><strong>Lý do:</strong> {item.reason}</p>
      {item.status === "Pending" && <div className="table-actions"><button type="button" disabled={busyId === item.id} onClick={() => resolve(item, "Resolved", true)}>Xác nhận & ẩn bình luận</button><button type="button" disabled={busyId === item.id} onClick={() => resolve(item, "Resolved")}>Đánh dấu đã xử lý</button><button className="button-text--danger" type="button" disabled={busyId === item.id} onClick={() => resolve(item, "Dismissed")}>Bỏ qua</button></div>}
    </article> : <article className="admin-community-card" key={item.id}>
      <div className="admin-community-card__meta"><strong>{item.author}</strong><time>{formatDate(item.createdAt)}</time><span className={`admin-status${item.deletedAt ? " admin-status--locked" : item.isHidden ? " admin-status--locked" : " admin-status--active"}`}>{item.deletedAt ? "Đã gỡ" : item.isHidden ? "Đã ẩn" : "Đang hiển thị"}</span></div>
      <p className="admin-community-card__context">{item.storyTitle} · Chương {item.chapterNumber}: {item.chapterTitle}{item.parentCommentId ? " · Trả lời bình luận" : ""} · {item.pendingReports} báo cáo chờ xử lý</p>
      <blockquote>{item.deletedAt ? "Bình luận đã bị gỡ." : item.content}</blockquote>
      {!item.deletedAt && <div className="table-actions">{item.isHidden ? <button type="button" disabled={busyId === item.id} onClick={() => moderateComment(item, "show")}>Hiện lại</button> : <button type="button" disabled={busyId === item.id} onClick={() => moderateComment(item, "hide")}>Ẩn bình luận</button>}<button className="button-text--danger" type="button" disabled={busyId === item.id} onClick={() => { if (window.confirm("Gỡ bình luận này khỏi thảo luận?")) moderateComment(item, "delete"); }}>Gỡ bình luận</button></div>}
    </article>)}</div> : <EmptyState title={tab === "reports" ? "Không có báo cáo ở trạng thái này" : "Không có bình luận phù hợp"} detail="Các mục mới sẽ xuất hiện tại đây." />}
  </div>;
}
