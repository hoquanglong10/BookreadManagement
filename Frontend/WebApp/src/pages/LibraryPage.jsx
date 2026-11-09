import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import StoryCover from "../components/StoryCover.jsx";
import { EmptyState, ErrorState, LoadingState } from "../components/StatePanel.jsx";
import { responseError } from "../api/http.js";
import { communityService } from "../services/communityService.js";
import { formatDate } from "../utils/format.js";

export default function LibraryPage() {
  const [tab, setTab] = useState("following");
  const [follows, setFollows] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [followResult, notificationResult] = await Promise.all([communityService.getFollows(), communityService.getNotifications(false)]);
      setFollows(followResult.items || []);
      setNotifications(notificationResult.items || []);
      setUnreadCount(notificationResult.unreadCount || 0);
    } catch (reason) { setError(responseError(reason)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  async function markAllRead() {
    try { await communityService.markAllNotificationsRead(); setUnreadCount(0); setNotifications(items => items.map(item => ({ ...item, readAt: item.readAt || new Date().toISOString() }))); }
    catch (reason) { setError(responseError(reason)); }
  }

  async function openNotification(item) {
    if (item.readAt) return;
    try {
      await communityService.markNotificationRead(item.id);
      setNotifications(items => items.map(value => value.id === item.id ? { ...value, readAt: new Date().toISOString() } : value));
      setUnreadCount(count => Math.max(0, count - 1));
    } catch (reason) { setError(responseError(reason)); }
  }

  async function unfollow(storyId) {
    try { await communityService.unfollow(storyId); setFollows(items => items.filter(item => item.storyId !== storyId)); }
    catch (reason) { setError(responseError(reason)); }
  }

  return <section className="reader-library-page">
    <div className="page-intro"><p className="eyebrow">THƯ VIỆN CỦA BẠN</p><h1>Truyện bạn theo dõi</h1><p>Theo dõi truyện để nhận tin khi có tập mới và tiếp tục khám phá những câu chuyện yêu thích.</p></div>
    <div className="library-tabs" role="tablist" aria-label="Thư viện cá nhân">
      <button type="button" role="tab" aria-selected={tab === "following"} className={tab === "following" ? "is-active" : ""} onClick={() => setTab("following")}>Đang theo dõi <span>{follows.length}</span></button>
      <button type="button" role="tab" aria-selected={tab === "notifications"} className={tab === "notifications" ? "is-active" : ""} onClick={() => setTab("notifications")}>Thông báo {unreadCount > 0 && <span className="library-unread-count">{unreadCount}</span>}</button>
    </div>
    {error && <ErrorState message={error} onRetry={reload} />}
    {loading ? <LoadingState label="Đang tải thư viện…" /> : tab === "following" ? follows.length ? <ul className="followed-story-list">{follows.map(item => <li key={item.storyId}>
      <Link className="followed-story-list__cover" to={`/story/${item.story.id}`}><StoryCover story={item.story} size="small" /></Link>
      <div className="followed-story-list__details"><Link className="webnovel-book__title" to={`/story/${item.story.id}`}>{item.story.title}</Link><span>{item.story.author}</span><small>{item.story.chapterCount} tập phát hành · {item.story.status}</small><time>Theo dõi từ {formatDate(item.createdAt)}</time></div>
      <button className="button button--outline" type="button" onClick={() => unfollow(item.storyId)}>Bỏ theo dõi</button>
    </li>)}</ul> : <EmptyState title="Bạn chưa theo dõi truyện nào" detail="Mở trang một truyện và nhấn Theo dõi để thêm vào thư viện." />
      : <div className="library-notifications">
        <div className="library-notifications__heading"><p>{unreadCount ? `${unreadCount} thông báo chưa đọc` : "Bạn đã xem hết thông báo mới."}</p>{unreadCount > 0 && <button className="text-link" type="button" onClick={markAllRead}>Đánh dấu tất cả đã đọc</button>}</div>
        {notifications.length ? <ul>{notifications.map(item => <li key={item.id} className={item.readAt ? "" : "is-unread"}>
          <span className="library-notification-dot" aria-hidden="true" />
          <div><Link to={`/read/${item.storyId}/${item.chapterNumber}`} onClick={() => openNotification(item)}><strong>{item.storyTitle}</strong> vừa có tập mới: Chương {item.storyChapterNumber} · Tập {item.chapterNumber} — {item.chapterTitle}</Link><time>{formatDate(item.createdAt)}</time></div>
          {!item.readAt && <button type="button" aria-label="Đánh dấu đã đọc" onClick={() => openNotification(item)}>Đã đọc</button>}
        </li>)}</ul> : <EmptyState title="Chưa có thông báo" detail="Thông báo chương mới sẽ xuất hiện ở đây khi truyện bạn theo dõi có cập nhật." />}
      </div>}
  </section>;
}
