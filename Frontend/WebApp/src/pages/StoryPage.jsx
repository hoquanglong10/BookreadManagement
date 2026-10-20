import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import StoryCover from "../components/StoryCover.jsx";
import { ErrorState, LoadingState } from "../components/StatePanel.jsx";
import { loadStory } from "../services/catalogService.js";
import { displayStatus, formatDate } from "../utils/format.js";

export default function StoryPage() {
  const { id } = useParams();
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    loadStory(id).then(result => { if (active) { setStory(result); setError(""); } })
      .catch(reason => { if (active) setError(reason?.response?.status === 404 ? "Truyện này không còn trong thư viện." : reason?.response?.data?.message || "Không tải được thông tin truyện."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  if (loading) return <LoadingState label="Đang mở trang truyện…" />;
  if (error) return <ErrorState message={error} />;
  if (!story) return null;

  const chapters = story.chapters || [];
  const firstReadable = chapters.find(chapter => chapter.hasContent !== false);
  return <div className="story-detail-page">
    <nav className="breadcrumbs" aria-label="Đường dẫn"><Link to="/">Khám phá</Link><span aria-hidden="true">/</span><span>{story.genre || "Truyện"}</span><span aria-hidden="true">/</span><span className="breadcrumbs__current">{story.title}</span></nav>
    <section className="story-detail">
      <div className="story-detail__cover"><StoryCover story={story} size="detail" /></div>
      <div className="story-detail__main">
        <p className="eyebrow">{story.genre || "TRUYỆN DÀI KỲ"} <span className="eyebrow__rule" /></p>
        <h1>{story.title}</h1>
        <p className="story-detail__author">Tác giả <strong>{story.author}</strong></p>
        <div className="story-detail__tags"><span>{displayStatus(story.status)}</span><span>{chapters.length || story.chapterCount || 0} chương</span>{story.updatedAt && <span>Cập nhật {formatDate(story.updatedAt)}</span>}</div>
        <div className="story-detail__actions">
          {firstReadable ? <Link className="button button--primary" to={`/read/${story.id}/${firstReadable.number}`}>Đọc từ đầu <span aria-hidden="true">→</span></Link> : <button className="button button--primary" type="button" disabled>Chưa có chương để đọc</button>}
          <a className="text-link" href="#chapter-list">Đến danh sách chương ↓</a>
        </div>
      </div>
      <p className="story-detail__description">{story.description}</p>
      <aside className="story-detail__aside"><span className="story-detail__aside-label">TRONG THƯ VIỆN</span><strong>{chapters.length || story.chapterCount || 0}</strong><span>chương đã phát hành</span><span className="story-detail__aside-rule" /><span>{displayStatus(story.status)}</span></aside>
    </section>
    <section className="chapter-section" id="chapter-list">
      <div className="section-heading"><div><p className="section-heading__overline">MỤC LỤC</p><h2>Danh sách chương</h2></div><span className="section-heading__count">{chapters.length} chương</span></div>
      {chapters.length ? <ol className="chapter-list">{chapters.map(chapter => <li key={chapter.id}>{chapter.hasContent === false ? <div className="chapter-row chapter-row--empty" aria-disabled="true">
        <span className="chapter-row__number">Chương {chapter.number}</span><span className="chapter-row__title">{chapter.title || `Chương ${chapter.number}`}</span>{chapter.publishAt && <time className="chapter-row__date">{formatDate(chapter.publishAt)}</time>}<span className="chapter-row__free">Chưa có nội dung</span>
      </div> : <Link to={`/read/${story.id}/${chapter.number}`} className="chapter-row">
        <span className="chapter-row__number">Chương {chapter.number}</span><span className="chapter-row__title">{chapter.title || `Chương ${chapter.number}`}</span>{chapter.publishAt && <time className="chapter-row__date">{formatDate(chapter.publishAt)}</time>}{chapter.isFree && <span className="chapter-row__free">Miễn phí</span>}<span className="chapter-row__arrow" aria-hidden="true">→</span>
      </Link>}</li>)}</ol> : <p className="quiet-note">Truyện chưa có chương được phát hành.</p>}
    </section>
  </div>;
}
