import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getGenresRequest } from "../api/catalogApi.js";
import { useAuth } from "../context/AuthContext.jsx";

const THEME_KEY = "bookread.theme";

export default function SiteHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [query, setQuery] = useState(new URLSearchParams(location.search).get("search") || "");
  const [genres, setGenres] = useState([]);
  const [genresOpen, setGenresOpen] = useState(false);
  const [dark, setDark] = useState(() => {
    try { return window.localStorage.getItem(THEME_KEY) === "dark"; } catch { return false; }
  });

  useEffect(() => setQuery(new URLSearchParams(location.search).get("search") || ""), [location.search]);
  useEffect(() => {
    let mounted = true;
    getGenresRequest().then(items => { if (mounted && Array.isArray(items)) setGenres(items); }).catch(() => {});
    return () => { mounted = false; };
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    try { window.localStorage.setItem(THEME_KEY, dark ? "dark" : "light"); } catch { /* Theme preference is optional. */ }
  }, [dark]);

  function submitSearch(event) {
    event.preventDefault();
    const value = query.trim();
    setGenresOpen(false);
    navigate(value ? `/?search=${encodeURIComponent(value)}` : "/");
  }

  function handleSignOut() {
    signOut();
    navigate("/");
  }

  return <header className="site-header">
    <div className="site-header__main">
      <Link className="brand" to="/" aria-label="Đọc Truyện — trang chủ">
        <span className="brand__name">Đọc<span>Truyện</span></span>
      </Link>
      <div className="site-header__genre-picker">
        <button type="button" aria-expanded={genresOpen} aria-controls="site-genre-menu" onClick={() => setGenresOpen(value => !value)}>
          Thể loại <svg aria-hidden="true" viewBox="0 0 12 12"><path d="m2.5 4.5 3.5 3 3.5-3" /></svg>
        </button>
        {genresOpen && <nav id="site-genre-menu" className="site-header__genre-menu" aria-label="Chọn thể loại">
          {genres.map(genre => <Link key={genre.id} to={`/?genreId=${genre.id}`} onClick={() => setGenresOpen(false)}>{genre.name}</Link>)}
          <Link to="/#genre-list" onClick={() => setGenresOpen(false)}>Tất cả thể loại</Link>
        </nav>}
      </div>
      <form className="site-search" onSubmit={submitSearch} role="search">
        <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="10.8" cy="10.8" r="6.4"/><path d="m16 16 4 4"/></svg>
        <label className="sr-only" htmlFor="site-search-input">Tìm truyện hoặc tác giả</label>
        <input id="site-search-input" value={query} onChange={event => setQuery(event.target.value)} placeholder="Tìm truyện" maxLength="200" />
        <button type="submit" aria-label="Tìm truyện">Tìm</button>
      </form>
      <button className="site-theme-toggle" type="button" aria-label={dark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"} aria-pressed={dark} onClick={() => setDark(value => !value)}>
        <span aria-hidden="true">{dark ? "☾" : "☼"}</span>
      </button>
      <div className="site-account">
        {user?.role === "Admin" && <Link className="site-account__admin" to="/admin">Quản trị</Link>}
        {user ? <button className="site-login-pill" type="button" onClick={handleSignOut}><svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.4" /><path d="M4.8 20c.7-4 3.1-6 7.2-6s6.5 2 7.2 6" /></svg> Đăng xuất</button> : <Link className="site-login-pill" to="/account"><svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.4" /><path d="M4.8 20c.7-4 3.1-6 7.2-6s6.5 2 7.2 6" /></svg> Đăng nhập</Link>}
      </div>
    </div>
    <div className="site-tagline">Đọc truyện &amp; sách online <strong>mỗi ngày</strong></div>
  </header>;
}
