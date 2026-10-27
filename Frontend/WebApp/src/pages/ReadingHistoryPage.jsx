import { useState } from "react";
import { Link } from "react-router-dom";
import StoryCover from "../components/StoryCover.jsx";
import { clearReadingHistory, getReadingHistory } from "../services/readingHistory.js";
import { formatDate } from "../utils/format.js";

export default function ReadingHistoryPage() {
  const [entries, setEntries] = useState(getReadingHistory);

  function clearHistory() {
    clearReadingHistory();
    setEntries([]);
  }

  return <section className="reading-history-page">
    <div className="reading-history-page__heading">
      <div><p className="webnovel-section-kicker">THƯ VIỆN CỦA BẠN</p><h1>Lịch sử đọc</h1><p>Những truyện bạn đọc gần đây được lưu trên thiết bị này.</p></div>
      {entries.length > 0 && <button type="button" onClick={clearHistory}>Xóa lịch sử</button>}
    </div>
    {entries.length ? <ul className="reading-history-list">{entries.map(entry => <li key={entry.storyId}>
      <Link className="reading-history-list__cover" to={`/story/${entry.storyId}`}><StoryCover story={{ ...entry, title: entry.storyTitle }} size="small" /></Link>
      <div className="reading-history-list__details"><Link className="webnovel-book__title" to={`/story/${entry.storyId}`}>{entry.storyTitle}</Link><span>Chương {entry.storyChapterNumber || entry.chapterNumber}{entry.storyChapterTitle ? ` · ${entry.storyChapterTitle}` : ""} · Tập {entry.episodeNumber || 1}{entry.chapterTitle ? `: ${entry.chapterTitle}` : ""}</span><time>Đọc gần nhất {formatDate(entry.readAt)}</time></div>
      <Link className="reading-history-list__continue" to={`/read/${entry.storyId}/${entry.chapterNumber}`}>Đọc tiếp →</Link>
    </li>)}</ul> : <div className="reading-history-empty"><p>Bạn chưa có truyện nào trong lịch sử đọc.</p><Link to="/">Khám phá truyện</Link></div>}
  </section>;
}
