import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getGenresRequest, getStoriesRequest } from "../api/catalogApi.js";
import { adminService } from "../services/adminService.js";
import { displayStatus, formatDate } from "../utils/format.js";
import { ErrorState, LoadingState } from "../components/StatePanel.jsx";

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [storyData, genres, customers] = await Promise.all([
        getStoriesRequest({ page: 1, pageSize: 100 }),
        getGenresRequest(),
        adminService.getCustomers()
      ]);
      const stories = Array.isArray(storyData) ? storyData : storyData?.items || [];
      setSummary({ stories, storyCount: storyData?.totalCount ?? stories.length, genreCount: genres.length, customerCount: customers.length });
      setError("");
    } catch (reason) {
      setError(reason?.response?.data?.message || "Không tải được dữ liệu quản trị.");
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);
  if (loading) return <LoadingState label="Đang tải tổng quan…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const latest = summary.stories.slice(0, 5);
  return <div className="admin-page">
    <div className="admin-page__heading"><div><p className="eyebrow">QUẢN TRỊ / TỔNG QUAN</p><h1>Thư viện của bạn.</h1><p>Theo dõi nội dung và tài khoản đang có trong hệ thống.</p></div><Link className="button button--primary" to="/admin/stories">Quản lý truyện <span aria-hidden="true">→</span></Link></div>
    <section className="admin-stat-grid" aria-label="Số liệu thư viện">
      <article className="admin-stat"><span>Truyện</span><strong>{summary.storyCount}</strong><Link to="/admin/stories">Mở danh sách →</Link></article>
      <article className="admin-stat"><span>Thể loại</span><strong>{summary.genreCount}</strong><Link to="/admin/genres">Mở danh sách →</Link></article>
      <article className="admin-stat"><span>Tài khoản</span><strong>{summary.customerCount}</strong><Link to="/admin/customers">Mở danh sách →</Link></article>
    </section>
    <section className="admin-recent-section">
      <div className="section-heading"><div><p className="section-heading__overline">NỘI DUNG</p><h2>Truyện vừa cập nhật</h2></div><Link className="text-link" to="/admin/stories">Tất cả truyện →</Link></div>
      {latest.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Truyện</th><th>Thể loại</th><th>Tình trạng</th><th>Chương / tập</th><th>Cập nhật</th><th /></tr></thead><tbody>{latest.map(story => <tr key={story.id}><td data-label="Truyện"><strong>{story.title}</strong><span>{story.author}</span></td><td data-label="Thể loại">{story.genre}</td><td data-label="Tình trạng">{displayStatus(story.status)}</td><td data-label="Chương / tập">{story.storyChapterCount ?? 0} chương · {story.episodeCount ?? story.chapterCount ?? 0} tập</td><td data-label="Cập nhật">{formatDate(story.updatedAt)}</td><td data-label="Mở"><Link to="/admin/stories">Sửa</Link></td></tr>)}</tbody></table></div> : <p className="quiet-note">Chưa có truyện trong thư viện.</p>}
    </section>
  </div>;
}
