import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getStoriesRequest } from "../api/catalogApi.js";
import StoryCover from "../components/StoryCover.jsx";
import StoryArtwork from "../components/StoryArtwork.jsx";
import { EmptyState, ErrorState, LoadingState } from "../components/StatePanel.jsx";
import { loadCatalog } from "../services/catalogService.js";
import { getReadingHistory } from "../services/readingHistory.js";
import { loadReadingProgress } from "../services/readingProgressService.js";
import { useAuth } from "../context/AuthContext.jsx";
import { displayStatus, formatDate } from "../utils/format.js";

const pageSize = 24;
const themes = ["teal", "indigo", "rose", "amber", "sage", "slate"];

function getItems(result) {
  return Array.isArray(result) ? result : result?.items ?? [];
}

function getTheme(story, index) {
  const known = ["teal", "indigo", "rose", "amber", "sage", "slate"];
  const requested = String(story?.coverTheme || "").toLowerCase();
  const aliases = { ink: "teal", clay: "rose", moss: "sage", plum: "indigo", ochre: "amber", blue: "slate" };
  return known.includes(requested) ? requested : aliases[requested] || themes[Math.abs(Number(story?.id) || index) % themes.length];
}

function HeroCarousel({ stories }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const slides = stories.slice(0, 8);

  useEffect(() => setActiveIndex(0), [slides.map(story => story.id).join("-")]);

  if (!slides.length) return null;

  function move(amount) {
    setActiveIndex(index => (index + amount + slides.length) % slides.length);
  }

  function offsetFor(index) {
    let offset = index - activeIndex;
    if (offset > slides.length / 2) offset -= slides.length;
    if (offset < -slides.length / 2) offset += slides.length;
    return offset;
  }

  return <section className="webnovel-spotlight" aria-label="Truyện nổi bật">
    <div className="webnovel-spotlight__stage">
      {slides.map((story, index) => {
        const offset = offsetFor(index);
        if (Math.abs(offset) > 2) return null;
        const theme = getTheme(story, index);
        return <Link
          key={story.id}
          className={`webnovel-spotlight__card webnovel-spotlight__card--${offset === 0 ? "active" : offset < 0 ? `left-${Math.abs(offset)}` : `right-${offset}`} webnovel-spotlight__art--${theme}`}
          style={{ "--card-order": offset, ...(story.coverUrl ? { backgroundImage: `linear-gradient(0deg, rgb(5 12 25 / 82%) 0%, rgb(5 12 25 / 32%) 46%, transparent 100%), url("${story.coverUrl}")` } : {}) }}
          to={`/story/${story.id}`}
          aria-label={`Mở truyện ${story.title}`}
          aria-current={offset === 0 ? "true" : undefined}
        >
          {!story.coverUrl && <StoryArtwork theme={theme} storyId={story.id} className="webnovel-spotlight__artwork" />}
          <span className="webnovel-spotlight__genre">{story.genre || "Truyện mới"}</span>
          <strong>{story.title}</strong>
          <span className="webnovel-spotlight__author">Tác giả: {story.author || "Đang cập nhật"}</span>
          <span className="webnovel-spotlight__cta">Xem truyện <span aria-hidden="true">→</span></span>
        </Link>;
      })}
      {slides.length > 1 && <>
        <button className="webnovel-spotlight__arrow webnovel-spotlight__arrow--prev" type="button" aria-label="Truyện trước" onClick={() => move(-1)}>‹</button>
        <button className="webnovel-spotlight__arrow webnovel-spotlight__arrow--next" type="button" aria-label="Truyện tiếp theo" onClick={() => move(1)}>›</button>
      </>}
      <div className="webnovel-spotlight__dots" aria-label="Chọn truyện nổi bật">
        {slides.map((story, index) => <button key={story.id} type="button" className={index === activeIndex ? "is-active" : ""} aria-label={`Xem ${story.title}`} aria-current={index === activeIndex ? "true" : undefined} onClick={() => setActiveIndex(index)} />)}
      </div>
    </div>
  </section>;
}

function BookRail({ stories }) {
  const railRef = useRef(null);
  function scroll(direction) {
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    railRef.current?.scrollBy({ left: direction * Math.max(240, railRef.current.clientWidth * 0.8), behavior: reduceMotion ? "auto" : "smooth" });
  }

  return <div className="webnovel-book-rail-wrap">
    <div className="webnovel-book-rail" ref={railRef}>
      {stories.map((story, index) => <article className="webnovel-book" key={story.id}>
        <Link className="webnovel-book__cover" to={`/story/${story.id}`} aria-label={`Mở ${story.title}`}>
          <StoryCover story={story} size="small" />
          {displayStatus(story.status) === "Hoàn thành" && <span className="webnovel-book__ribbon">ĐÃ HOÀN</span>}
        </Link>
        <Link className="webnovel-book__title" to={`/story/${story.id}`} title={story.title}>{story.title}</Link>
      </article>)}
    </div>
    {stories.length > 5 && <>
      <button className="webnovel-book-rail__arrow webnovel-book-rail__arrow--prev" type="button" aria-label="Cuộn truyện về trước" onClick={() => scroll(-1)}>‹</button>
      <button className="webnovel-book-rail__arrow webnovel-book-rail__arrow--next" type="button" aria-label="Xem thêm truyện" onClick={() => scroll(1)}>›</button>
    </>}
  </div>;
}

function SectionHeading({ title, link, linkText = "Xem toàn bộ", id }) {
  return <div className="webnovel-section-heading">
    <h2 id={id}>{title}</h2>
    {link && <Link to={link}>{linkText}<span aria-hidden="true">›</span></Link>}
  </div>;
}

function UpdateList({ stories }) {
  return <ul className="webnovel-update-list">
    {stories.map(story => <li className="webnovel-update" key={story.id}>
      <Link to={`/story/${story.id}`} className="webnovel-update__title">{story.title}</Link>
      <span>{story.author}</span>
      <span>{story.storyChapterCount ?? 0} chương · {story.episodeCount ?? story.chapterCount ?? 0} tập · {story.genre || "Truyện"}</span>
      <time>{formatDate(story.updatedAt)}</time>
    </li>)}
  </ul>;
}

export default function HomePage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const search = (searchParams.get("search") || "").trim();
  const genreId = searchParams.get("genreId") || "";
  const status = searchParams.get("status") || "";
  const sort = searchParams.get("sort") || "updated";
  const requestedPage = Number(searchParams.get("page") || 1);
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const [data, setData] = useState({ stories: [], genres: [], pagination: { page: 1, totalCount: 0, totalPages: 1 } });
  const [newestStories, setNewestStories] = useState([]);
  const [recentStories, setRecentStories] = useState([]);
  const [popularStories, setPopularStories] = useState([]);
  const [history, setHistory] = useState(getReadingHistory);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    if (!user) {
      setHistory(getReadingHistory());
      return () => { active = false; };
    }
    loadReadingProgress()
      .then(progress => { if (active) setHistory(progress); })
      .catch(() => { if (active) setHistory(getReadingHistory()); });
    return () => { active = false; };
  }, [user?.id]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const requests = [loadCatalog({ search, genreId, status, sort, page, pageSize })];
    if (!search && !genreId && !status) {
      requests.push(getStoriesRequest({ page: 1, pageSize: 12, sort: "newest" }));
      requests.push(getStoriesRequest({ page: 1, pageSize: 8, sort: "updated" }));
      requests.push(getStoriesRequest({ page: 1, pageSize: 5, sort: "views" }));
    }
    Promise.all(requests)
      .then(([catalog, newest, recent, popular]) => {
        if (!active) return;
        setData(catalog);
        setNewestStories(getItems(newest));
        setRecentStories(getItems(recent));
        setPopularStories(getItems(popular));
        setError("");
      })
      .catch(reason => { if (active) setError(reason?.response?.data?.message || "Không kết nối được thư viện truyện."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [search, genreId, status, sort, page, reloadKey]);

  const activeGenre = useMemo(() => data.genres.find(genre => String(genre.id) === String(genreId)), [data.genres, genreId]);
  const isFiltered = Boolean(search || genreId || status);
  const completedStories = newestStories.filter(story => displayStatus(story.status) === "Hoàn thành");
  const spotlightStories = popularStories.length ? popularStories : newestStories;

  function updateFilter(name, value) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(name, value);
    else next.delete(name);
    next.delete("page");
    setSearchParams(next, { replace: true });
  }

  function changePage(nextPage) {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(nextPage));
    setSearchParams(next, { replace: true });
  }

  const resultTitle = search ? `Kết quả tìm kiếm: “${search}”` : activeGenre?.name || (status ? displayStatus(status) : "Danh sách truyện");

  return <div className="webnovel-home">
    {isFiltered ? <section className="webnovel-results">
      <div className="webnovel-results__heading">
        <div><p className="webnovel-section-kicker">THƯ VIỆN TRUYỆN</p><h1>{resultTitle}</h1><span>{data.pagination.totalCount} truyện</span></div>
        <Link className="webnovel-clear-filter" to="/">Xóa bộ lọc</Link>
        <label className="webnovel-sort">Sắp xếp
          <select value={sort} onChange={event => updateFilter("sort", event.target.value)}>
            <option value="updated">Mới cập nhật</option><option value="newest">Mới đăng</option><option value="views">Xem nhiều</option>
          </select>
        </label>
      </div>
      {loading ? <LoadingState label="Đang tải danh sách truyện…" /> : error ? <ErrorState message={error} onRetry={() => setReloadKey(value => value + 1)} /> : data.stories.length ? <>
        <div className="webnovel-story-grid">{data.stories.map(story => <article className="webnovel-result-book" key={story.id}><Link to={`/story/${story.id}`}><StoryCover story={story} size="small" /></Link><div><Link className="webnovel-book__title" to={`/story/${story.id}`}>{story.title}</Link><span>{story.author}</span><span>{story.genre} · {story.storyChapterCount ?? 0} chương · {story.episodeCount ?? story.chapterCount ?? 0} tập</span></div></article>)}</div>
        {data.pagination.totalPages > 1 && <nav className="catalog-pagination" aria-label="Phân trang truyện"><button className="button button--outline" type="button" onClick={() => changePage(page - 1)} disabled={page <= 1}>← Trang trước</button><span>Trang {page} / {data.pagination.totalPages}</span><button className="button button--outline" type="button" onClick={() => changePage(page + 1)} disabled={page >= data.pagination.totalPages}>Trang sau →</button></nav>}
      </> : <EmptyState title="Không tìm thấy truyện" detail="Thử tên truyện, tác giả hoặc thể loại khác." />}
    </section> : loading ? <LoadingState label="Đang tải thư viện truyện…" /> : error ? <ErrorState message={error} onRetry={() => setReloadKey(value => value + 1)} /> : !data.stories.length ? <EmptyState title="Thư viện chưa có truyện" detail="Truyện sẽ xuất hiện tại đây sau khi được thêm vào." /> : <>
      <HeroCarousel stories={spotlightStories} />

      <nav className="webnovel-home-actions" aria-label="Lối tắt">
        {history[0] ? <Link className="webnovel-home-actions__continue" to={`/read/${history[0].storyId}/${history[0].chapterNumber}`}>
          <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></svg>
          <span className="webnovel-home-actions__copy"><small>ĐỌC TIẾP</small><strong>{history[0].storyTitle}</strong><span>Chương {history[0].storyChapterNumber || history[0].chapterNumber} · Tập {history[0].episodeNumber || 1}</span></span>
          <span className="webnovel-home-actions__arrow" aria-hidden="true">→</span>
        </Link> : <Link to="/history">
          <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></svg>
          <span className="webnovel-home-actions__copy"><small>THƯ VIỆN CỦA BẠN</small><strong>Lịch sử đọc</strong><span>Mở lại truyện đã xem</span></span>
          <span className="webnovel-home-actions__arrow" aria-hidden="true">→</span>
        </Link>}
        {user ? <Link to="/profile">
          <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.5" /><path d="M4.5 20c.8-4 3.3-6 7.5-6s6.7 2 7.5 6" /></svg>
          <span className="webnovel-home-actions__copy"><small>TÀI KHOẢN</small><strong>{user.displayName || user.username}</strong><span>Hồ sơ độc giả</span></span>
          <span className="webnovel-home-actions__arrow" aria-hidden="true">→</span>
        </Link> : <Link to="/account">
          <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.5" /><path d="M4.5 20c.8-4 3.3-6 7.5-6s6.7 2 7.5 6" /></svg>
          <span className="webnovel-home-actions__copy"><small>THÀNH VIÊN</small><strong>Đăng nhập</strong><span>Vào tài khoản độc giả</span></span>
          <span className="webnovel-home-actions__arrow" aria-hidden="true">→</span>
        </Link>}
      </nav>

      <section className="webnovel-ranking" aria-labelledby="ranking-title">
        <div className="webnovel-ranking__heading">
          <div className="webnovel-tabs" role="tablist" aria-label="Danh sách truyện">
            <button type="button" role="tab" aria-selected={sort === "views"} className={sort === "views" ? "is-active" : ""} onClick={() => updateFilter("sort", "views")}>Truyện hot</button>
            <button type="button" role="tab" aria-selected={sort === "updated"} className={sort === "updated" ? "is-active" : ""} onClick={() => updateFilter("sort", "updated")}>Đề cử</button>
            <button type="button" role="tab" aria-selected={sort === "newest"} className={sort === "newest" ? "is-active" : ""} onClick={() => updateFilter("sort", "newest")}>Truyện mới</button>
          </div>
          <Link className="webnovel-view-all" to="/?sort=views">Xem tất cả ›</Link>
        </div>
        <h1 id="ranking-title" className="sr-only">{sort === "views" ? "Truyện hot" : sort === "newest" ? "Truyện mới" : "Đề cử truyện"}</h1>
        <BookRail stories={data.stories.slice(0, 12)} />
      </section>

      <div className="webnovel-home-grid">
        <main className="webnovel-home-main">
          <section className="webnovel-section" aria-labelledby="new-stories-title">
            <SectionHeading id="new-stories-title" title="Truyện mới ra mắt" link="/?sort=newest" />
            <div className="webnovel-story-grid">{newestStories.slice(0, 6).map(story => <article className="webnovel-result-book" key={story.id}><Link to={`/story/${story.id}`}><StoryCover story={story} size="small" /></Link><div><Link className="webnovel-book__title" to={`/story/${story.id}`}>{story.title}</Link><span>{story.author}</span><span>{story.genre} · {story.storyChapterCount ?? 0} chương · {story.episodeCount ?? story.chapterCount ?? 0} tập</span></div></article>)}</div>
          </section>
          <section className="webnovel-section" aria-labelledby="updates-title">
            <SectionHeading id="updates-title" title="Mới lên chương" link="/?sort=updated" />
            <UpdateList stories={recentStories.slice(0, 8)} />
          </section>
          {completedStories.length > 0 && <section className="webnovel-section" aria-labelledby="completed-title">
            <SectionHeading id="completed-title" title="Truyện đã hoàn thành" link="/?status=Completed" />
            <div className="webnovel-story-grid">{completedStories.slice(0, 6).map(story => <article className="webnovel-result-book" key={story.id}><Link to={`/story/${story.id}`}><StoryCover story={story} size="small" /></Link><div><Link className="webnovel-book__title" to={`/story/${story.id}`}>{story.title}</Link><span>{story.author}</span><span>{story.genre} · {story.storyChapterCount ?? 0} chương · {story.episodeCount ?? story.chapterCount ?? 0} tập</span></div></article>)}</div>
          </section>}
        </main>
        <aside className="webnovel-home-aside">
          <section className="webnovel-widget" id="genre-list"><SectionHeading title="Thể loại" /><ul className="webnovel-genre-list">{data.genres.map(genre => <li key={genre.id}><Link to={`/?genreId=${genre.id}`}>{genre.name}</Link><span>{genre.storyCount ?? 0}</span></li>)}</ul></section>
          {history.length > 0 && <section className="webnovel-widget"><SectionHeading title="Đọc gần đây" link="/history" /><Link className="webnovel-history-link" to={`/read/${history[0].storyId}/${history[0].chapterNumber}`}>{history[0].storyTitle}<span>Đọc tiếp chương {history[0].storyChapterNumber || history[0].chapterNumber} · tập {history[0].episodeNumber || 1} →</span></Link></section>}
        </aside>
      </div>
    </>}
  </div>;
}
