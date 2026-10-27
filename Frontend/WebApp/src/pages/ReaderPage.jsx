import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ErrorState, LoadingState } from "../components/StatePanel.jsx";
import { loadChapter, loadStory } from "../services/catalogService.js";
import { saveReadingProgress } from "../services/readingHistory.js";

const SETTINGS_KEY = "bookread.reader.settings";

function readSettings() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(SETTINGS_KEY) || "{}");
    return { size: Math.min(30, Math.max(16, Number(saved.size) || 19)), dark: Boolean(saved.dark) };
  } catch {
    return { size: 19, dark: false };
  }
}

export default function ReaderPage() {
  const { storyId, chapterNumber } = useParams();
  const [chapter, setChapter] = useState(null);
  const [story, setStory] = useState(null);
  const [settings, setSettings] = useState(readSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [needsAccess, setNeedsAccess] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([loadChapter(storyId, chapterNumber), loadStory(storyId)])
      .then(([chapterData, storyData]) => {
        if (!active) return;
        setChapter(chapterData);
        setStory(storyData);
        setError("");
        setNeedsAccess(false);
        saveReadingProgress({
          storyId: storyData.id,
          chapterNumber: chapterData.number || Number(chapterNumber),
          chapterTitle: chapterData.title,
          storyChapterNumber: chapterData.storyChapterNumber,
          storyChapterTitle: chapterData.storyChapterTitle,
          episodeNumber: chapterData.episodeNumber,
          storyTitle: storyData.title,
          author: storyData.author,
          genre: storyData.genre,
          coverTheme: storyData.coverTheme
        });
      })
      .catch(reason => { if (active) { setNeedsAccess(reason?.response?.status === 403); setError(reason?.response?.data?.message || "Không mở được tập truyện."); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [storyId, chapterNumber]);

  function changeSettings(next) {
    const value = { ...settings, ...next };
    setSettings(value);
    try { window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(value)); } catch { /* Browser storage is optional. */ }
  }

  if (loading) return <div className="reader-state"><LoadingState label="Đang mở tập…" /></div>;
  if (error) return <div className="reader-state"><div><ErrorState message={error} />{needsAccess && <div className="reader-paywall"><p>Chọn gói đọc phù hợp để mở khóa nội dung này.</p><Link className="button button--primary" to="/plans">Xem gói đọc</Link><Link className="text-link" to={`/story/${storyId}`}>Quay lại truyện</Link></div>}</div></div>;

  return <div className={`reader-page${settings.dark ? " reader-page--dark" : ""}`}>
    <header className="reader-topbar"><Link to={`/story/${storyId}`} className="reader-back"><span aria-hidden="true">←</span> Thông tin truyện</Link><div className="reader-topbar__title"><strong>{story?.title || chapter?.storyTitle}</strong><span>Chương {chapter?.storyChapterNumber || chapter?.number}{chapter?.storyChapterTitle ? `: ${chapter.storyChapterTitle}` : ""} · Tập {chapter?.episodeNumber || 1}: {chapter?.title}</span></div><Link to="/" className="reader-home">Thư viện</Link></header>
    <div className="reader-controls" aria-label="Tùy chỉnh cách đọc"><span>Hiển thị</span><button type="button" onClick={() => changeSettings({ size: Math.max(16, settings.size - 1) })} aria-label="Giảm cỡ chữ" disabled={settings.size <= 16}>A−</button><output aria-live="polite">{settings.size}px</output><button type="button" onClick={() => changeSettings({ size: Math.min(30, settings.size + 1) })} aria-label="Tăng cỡ chữ" disabled={settings.size >= 30}>A+</button><span className="reader-controls__divider" /><button type="button" className="reader-theme-toggle" onClick={() => changeSettings({ dark: !settings.dark })}>{settings.dark ? "Giao diện sáng" : "Giao diện tối"}</button></div>
    <main className="reader-content" style={{ "--reader-size": `${settings.size}px` }}>
      <div className="reader-content__heading"><p className="eyebrow">{chapter?.storyTitle}</p><h1>Chương {chapter?.storyChapterNumber || chapter?.number}{chapter?.storyChapterTitle ? ` · ${chapter.storyChapterTitle}` : ""}</h1><h2>Tập {chapter?.episodeNumber || 1}: {chapter?.title}</h2></div>
      <article className="reader-prose">{(chapter?.content || "").split(/\r?\n/).filter(paragraph => paragraph.trim()).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</article>
      <nav className="reader-pagination" aria-label="Điều hướng tập">
        {chapter?.prevNumber ? <Link className="button button--outline" to={`/read/${storyId}/${chapter.prevNumber}`}>← Tập trước</Link> : <span />}
        <Link className="reader-pagination__contents" to={`/story/${storyId}#chapter-list`}>Danh sách chương</Link>
        {chapter?.nextNumber ? <Link className="button button--primary" to={`/read/${storyId}/${chapter.nextNumber}`}>Tập tiếp →</Link> : <span className="reader-pagination__end">Bạn đã đọc tập mới nhất</span>}
      </nav>
    </main>
  </div>;
}
