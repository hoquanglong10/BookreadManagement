import { useEffect, useState } from "react";
import { adminService } from "../services/adminService.js";
import { responseError } from "../api/http.js";
import { EmptyState, ErrorState, LoadingState } from "../components/StatePanel.jsx";

function localDate(value) {
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function initialRange() {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - 29);
  return { from: localDate(from), to: localDate(to) };
}

function toUtcStart(date) {
  return new Date(`${date}T00:00:00`).toISOString();
}

function toUtcEndExclusive(date) {
  const end = new Date(`${date}T00:00:00`);
  end.setDate(end.getDate() + 1);
  return end.toISOString();
}

function formatDateTime(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

export default function AdminReadEventsPage() {
  const [range, setRange] = useState(initialRange);
  const [data, setData] = useState({ items: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const result = await adminService.getReadEvents({
          from: toUtcStart(range.from),
          to: toUtcEndExclusive(range.to)
        });
        if (active) { setData(result); setError(""); }
      } catch (reason) {
        if (active) setError(responseError(reason));
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [range, reloadKey]);

  function submit(event) {
    event.preventDefault();
    if (range.from > range.to) { setError("Ngày bắt đầu phải nằm trước hoặc bằng ngày kết thúc."); return; }
    setError("");
    setReloadKey(value => value + 1);
  }

  const items = data.items || [];
  const totalViews = items.reduce((sum, item) => sum + item.viewCount, 0);
  const storyCount = new Set(items.map(item => item.storyId)).size;

  return <section className="admin-page">
    <div className="admin-page__heading">
      <div><p className="eyebrow">QUẢN TRỊ / HOẠT ĐỘNG ĐỌC</p><h1>Lượt đọc</h1><p>Theo dõi số lượt mở tập trong khoảng thời gian đã chọn.</p></div>
      <span className="admin-page__total">{totalViews.toLocaleString("vi-VN")} lượt</span>
    </div>

    <form className="read-report-filters" onSubmit={submit}>
      <label>Từ ngày<input type="date" value={range.from} max={range.to} onChange={event => setRange(current => ({ ...current, from: event.target.value }))} required /></label>
      <label>Đến ngày<input type="date" value={range.to} min={range.from} max={localDate(new Date())} onChange={event => setRange(current => ({ ...current, to: event.target.value }))} required /></label>
      <button className="button button--primary" type="submit">Lọc thống kê</button>
    </form>

    {error && <p className="form-message form-message--error" role="alert">{error}</p>}
    <div className="read-report-summary" aria-live="polite">
      <article><span>Tổng lượt đọc</span><strong>{totalViews.toLocaleString("vi-VN")}</strong></article>
      <article><span>Truyện có lượt đọc</span><strong>{storyCount.toLocaleString("vi-VN")}</strong></article>
      <article><span>Tập được đọc</span><strong>{items.length.toLocaleString("vi-VN")}</strong></article>
    </div>

    <section className="admin-section">
      <div className="section-heading"><div><p className="section-heading__overline">CHI TIẾT</p><h2>Lượt đọc theo tập</h2></div><span className="section-heading__count">{items.length} tập</span></div>
      {loading ? <LoadingState label="Đang tải thống kê lượt đọc…" /> : error ? <ErrorState message={error} onRetry={() => setReloadKey(value => value + 1)} /> : items.length ? <div className="admin-table-wrap"><table className="admin-table read-report-table"><thead><tr><th>Truyện / chương / tập</th><th>Lượt đọc</th><th>Lượt đầu trong kỳ</th><th>Lượt gần nhất</th></tr></thead><tbody>{items.map(item => <tr key={`${item.storyId}-${item.chapterId}`}><td data-label="Truyện / chương / tập"><strong>{item.storyTitle}</strong><span>Chương {item.storyChapterNumber}: {item.storyChapterTitle} · Tập {item.episodeNumber}: {item.episodeTitle}</span></td><td data-label="Lượt đọc"><strong>{item.viewCount.toLocaleString("vi-VN")}</strong></td><td data-label="Lượt đầu trong kỳ">{formatDateTime(item.firstViewedAt)}</td><td data-label="Lượt gần nhất">{formatDateTime(item.lastViewedAt)}</td></tr>)}</tbody></table></div> : <EmptyState title="Chưa có lượt đọc trong kỳ này" detail="Các lượt mở tập sẽ xuất hiện ở đây sau khi độc giả bắt đầu đọc." />}
    </section>
  </section>;
}
