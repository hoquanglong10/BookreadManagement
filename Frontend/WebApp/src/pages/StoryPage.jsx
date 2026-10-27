import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import StoryCover from "../components/StoryCover.jsx";
import { ErrorState, LoadingState } from "../components/StatePanel.jsx";
import { responseError } from "../api/http.js";
import { useAuth } from "../context/AuthContext.jsx";
import { loadStory } from "../services/catalogService.js";
import { paymentService } from "../services/paymentService.js";
import { getReadEpisodeNumbers, getReadingHistory } from "../services/readingHistory.js";
import { displayStatus, formatDate } from "../utils/format.js";

const money = value => `${Number(value || 0).toLocaleString("vi-VN")} ₫`;

function chapterGroups(story) {
  if (story.storyChapters?.length) return story.storyChapters;
  const groups = new Map();
  for (const episode of story.chapters || []) {
    const number = episode.storyChapterNumber || episode.number;
    if (!groups.has(number)) groups.set(number, { id: episode.storyChapterId || number, number, title: episode.storyChapterTitle || `Chương ${number}`, episodes: [] });
    groups.get(number).episodes.push(episode);
  }
  return [...groups.values()].sort((a, b) => a.number - b.number);
}

export default function StoryPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [paymentNotice, setPaymentNotice] = useState("");
  const [purchaseBusy, setPurchaseBusy] = useState(false);
  const [simulateFailure, setSimulateFailure] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    loadStory(id).then(result => { if (active) { setStory(result); setError(""); } })
      .catch(reason => { if (active) setError(reason?.response?.status === 404 ? "Truyện này không còn trong thư viện." : responseError(reason)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  const groups = useMemo(() => story ? chapterGroups(story) : [], [story]);
  const episodes = useMemo(() => groups.flatMap(group => group.episodes || []), [groups]);
  const firstReadable = episodes.find(episode => episode.hasContent !== false && episode.canRead !== false);
  const localProgress = user ? null : getReadingHistory().find(entry => String(entry.storyId) === String(id));
  const localReadNumbers = new Set(getReadEpisodeNumbers(id, user?.id));

  async function buyStory() {
    if (!user) { navigate("/account", { state: { from: `/story/${id}` } }); return; }
    setPurchaseBusy(true); setPaymentError(""); setPaymentNotice("");
    try {
      const result = await paymentService.purchaseStory(Number(id), simulateFailure);
      if (result.status === "Success") {
        setPaymentNotice("Giao dịch thành công. Quyền đọc truyện đã được mở.");
        const updated = await loadStory(id); setStory(updated);
      } else setPaymentError(result.failureReason || "Giao dịch thất bại; quyền đọc chưa được cấp.");
    } catch (reason) { setPaymentError(responseError(reason)); }
    finally { setPurchaseBusy(false); }
  }

  if (loading) return <LoadingState label="Đang mở trang truyện…" />;
  if (error) return <ErrorState message={error} />;
  if (!story) return null;

  const lastReadEpisode = episodes.find(episode => Number(episode.number) === Number(story.lastReadNumber || localProgress?.chapterNumber));
  const canContinue = Boolean(lastReadEpisode && lastReadEpisode.hasContent !== false && lastReadEpisode.canRead !== false);
  const continueEpisode = canContinue ? lastReadEpisode : firstReadable;

  return <div className="story-detail-page">
    <nav className="breadcrumbs" aria-label="Đường dẫn"><Link to="/">Khám phá</Link><span aria-hidden="true">/</span><span>{story.genre || "Truyện"}</span><span aria-hidden="true">/</span><span className="breadcrumbs__current">{story.title}</span></nav>
    <section className="story-detail">
      <div className="story-detail__cover"><StoryCover story={story} size="detail" /></div>
      <div className="story-detail__main">
        <p className="eyebrow">{story.genres?.length ? story.genres.map(genre => genre.name).join(" · ") : story.genre || "TRUYỆN DÀI KỲ"} <span className="eyebrow__rule" /></p>
        <h1>{story.title}</h1>
        <p className="story-detail__author">Tác giả <strong>{story.author}</strong></p>
        <div className="story-detail__tags"><span>{displayStatus(story.status)}</span><span>{groups.length} chương · {episodes.length} tập</span><span>{story.accessType === "Free" ? "Miễn phí" : story.accessType === "Mixed" ? `Kết hợp · ${story.freeChapterCount} chương đầu miễn phí` : `Trả phí · ${money(story.price)}`}</span>{story.updatedAt && <span>Cập nhật {formatDate(story.updatedAt)}</span>}</div>
        <div className="story-detail__actions">
          {continueEpisode ? <Link className="button button--primary" to={`/read/${story.id}/${continueEpisode.number}`}>{canContinue ? "Đọc tiếp" : "Đọc từ đầu"} <span aria-hidden="true">→</span></Link> : <button className="button button--primary" type="button" disabled>Chưa có tập để đọc</button>}
          <a className="text-link" href="#chapter-list">Đến mục lục ↓</a>
        </div>
        {story.accessType !== "Free" && !story.hasPurchase && <div className="story-purchase-box">
          <div><strong>Mở khóa trọn bộ</strong><span>Mua một lần, giữ quyền đọc riêng cho truyện này.</span></div>
          <strong className="story-purchase-box__price">{money(story.price)}</strong>
          <button className="button button--outline" type="button" disabled={purchaseBusy} onClick={buyStory}>{purchaseBusy ? "Đang xử lý…" : "Mua truyện"}</button>
          <label className="story-purchase-box__demo"><input type="checkbox" checked={simulateFailure} onChange={event => setSimulateFailure(event.target.checked)} /> Mô phỏng thanh toán thất bại</label>
        </div>}
        {story.hasPurchase && <p className="story-access-note">Bạn đã mua truyện này. Quyền đọc vẫn còn kể cả khi gói thuê bao hết hạn.</p>}
        {story.hasPlanAccess && !story.hasPurchase && <p className="story-access-note">Gói đọc hiện tại đã mở quyền truy cập truyện này. <Link to="/plans">Gia hạn gói →</Link></p>}
        {paymentNotice && <p className="form-message form-message--success" role="status">{paymentNotice} <Link to="/payments">Xem giao dịch</Link></p>}
        {paymentError && <p className="form-message form-message--error" role="alert">{paymentError} <Link to="/payments">Xem lịch sử giao dịch</Link></p>}
      </div>
      <p className="story-detail__description">{story.description}</p>
      <aside className="story-detail__aside"><span className="story-detail__aside-label">TRONG THƯ VIỆN</span><strong>{episodes.length}</strong><span>tập đã phát hành</span><span className="story-detail__aside-rule" /><span>{displayStatus(story.status)}</span><span>{groups.length} chương</span></aside>
    </section>
    <section className="chapter-section" id="chapter-list">
      <div className="section-heading"><div><p className="section-heading__overline">MỤC LỤC</p><h2>Chương & tập</h2></div><span className="section-heading__count">{groups.length} chương · {episodes.length} tập</span></div>
      {groups.length ? <div className="story-chapter-groups">{groups.map(group => <section className="story-chapter-group" key={group.id || group.number}>
        <div className="story-chapter-group__heading"><span>Chương {group.number}</span><h3>{group.title}</h3><small>{group.episodes?.length || 0} tập</small></div>
        <ol className="chapter-list">{(group.episodes || []).map(episode => {
          const isRead = Boolean(episode.isRead) || localReadNumbers.has(Number(episode.number)) || Number(localProgress?.chapterNumber) === Number(episode.number);
          const rowContent = <>
            <span className="chapter-row__number">Tập {episode.episodeNumber}</span>
            <span className="chapter-row__title">{episode.title || `Tập ${episode.episodeNumber}`}</span>
            {episode.publishAt && <time className="chapter-row__date">{formatDate(episode.publishAt)}</time>}
            <span className="chapter-row__meta">
              <span className={`chapter-row__read-status${isRead ? " chapter-row__read-status--read" : ""}`}>{isRead ? "Đã đọc" : "Chưa đọc"}</span>
              <span className="chapter-row__free">{episode.hasContent === false ? "Chưa có nội dung" : episode.accessLabel || "Miễn phí"}</span>
            </span>
          </>;
          return <li key={episode.id}>{episode.hasContent === false || episode.canRead === false
            ? <div className={`chapter-row chapter-row--empty${episode.canRead === false && episode.hasContent !== false ? " chapter-row--locked" : ""}`} aria-disabled="true">{rowContent}</div>
            : <Link to={`/read/${story.id}/${episode.number}`} className="chapter-row">{rowContent}<span className="chapter-row__arrow" aria-hidden="true">→</span></Link>}
          </li>;
        })}</ol>
      </section>)}</div> : <p className="quiet-note">Truyện chưa có chương nào được phát hành.</p>}
    </section>
  </div>;
}
