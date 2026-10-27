import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import StoryCover from "../components/StoryCover.jsx";
import { clearReadingHistory, getReadingHistory } from "../services/readingHistory.js";
import { formatDate } from "../utils/format.js";
import { useAuth } from "../context/AuthContext.jsx";
import { loadReadingProgress } from "../services/readingProgressService.js";

export default function ReadingHistoryPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState(getReadingHistory);
  const [loading, setLoading] = useState(Boolean(user));
  const [syncError, setSyncError] = useState("");

  useEffect(() => {
    let active = true;
    if (!user) {
      setEntries(getReadingHistory());
      setLoading(false);
      setSyncError("");
      return () => { active = false; };
    }
    setLoading(true);
    loadReadingProgress()
      .then(progress => { if (active) { setEntries(progress); setSyncError(""); } })
      .catch(() => { if (active) { setEntries(getReadingHistory()); setSyncError("Chưa đồng bộ được lịch sử từ máy chủ; đang hiển thị dữ liệu trên thiết bị này."); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user?.id]);

  function clearHistory() {
    clearReadingHistory();
    setEntries([]);
  }

  return <section className="reading-history-page">
    <div className="reading-history-page__heading">
      <div><p className="webnovel-section-kicker">THƯ VIỆN CỦA BẠN</p><h1>Lịch sử đọc</h1><p>{user ? "Tiến độ được đồng bộ với tài khoản của bạn trên các thiết bị." : "Những truyện bạn đọc gần đây được lưu trên thiết bị này."}</p></div>
      {!user && entries.length > 0 && <button type="button" onClick={clearHistory}>Xóa lịch sử trên thiết bị</button>}
    </div>
    {syncError && <p className="form-message form-message--error" role="status">{syncError}</p>}
    {loading ? <div className="reading-history-empty"><p>Đang tải tiến độ đọc…</p></div> : entries.length ? <ul className="reading-history-list">{entries.map(entry => <li key={entry.storyId}>
      <Link className="reading-history-list__cover" to={`/story/${entry.storyId}`}><StoryCover story={{ ...entry, title: entry.storyTitle }} size="small" /></Link>
      <div className="reading-history-list__details"><Link className="webnovel-book__title" to={`/story/${entry.storyId}`}>{entry.storyTitle}</Link><span>Chương {entry.storyChapterNumber || entry.chapterNumber}{entry.storyChapterTitle ? ` · ${entry.storyChapterTitle}` : ""} · Tập {entry.episodeNumber || 1}{entry.chapterTitle ? `: ${entry.chapterTitle}` : ""}</span><time>Đọc gần nhất {formatDate(entry.readAt)}</time></div>
      <Link className="reading-history-list__continue" to={`/read/${entry.storyId}/${entry.chapterNumber}`}>Đọc tiếp →</Link>
    </li>)}</ul> : <div className="reading-history-empty"><p>Bạn chưa có truyện nào trong lịch sử đọc.</p><Link to="/">Khám phá truyện</Link></div>}
  </section>;
}
