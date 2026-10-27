import { useEffect, useMemo, useRef, useState } from "react";
import { getStoryRequest, getStoriesRequest, getGenresRequest } from "../api/catalogApi.js";
import { responseError } from "../api/http.js";
import { adminService } from "../services/adminService.js";
import { loadChapters } from "../services/catalogService.js";
import { displayStatus, formatDate, formatDateTimeLocal, toIsoDate } from "../utils/format.js";
import { EmptyState, ErrorState, LoadingState } from "../components/StatePanel.jsx";

const blankStory = { title: "", author: "", genre: "", genreIds: [], description: "", status: "Đang cập nhật", coverTheme: "teal", coverUrl: "", accessType: "Free", price: "", freeChapterCount: "0" };
const blankChapter = { storyChapterNumber: "", storyChapterTitle: "", episodeNumber: "", title: "", content: "", isFree: false, publishAt: "" };

function newChapterForm(story, chapters = [], addNewChapter = false) {
  const groups = new Map();
  chapters.forEach(item => {
    const number = item.storyChapterNumber || item.number;
    const group = groups.get(number) || { title: item.storyChapterTitle || `Chương ${number}`, lastEpisode: 0 };
    group.lastEpisode = Math.max(group.lastEpisode, item.episodeNumber || 1);
    groups.set(number, group);
  });
  const latestNumber = Math.max(0, ...groups.keys());
  const chapterNumber = addNewChapter || latestNumber === 0 ? latestNumber + 1 : latestNumber;
  const latest = groups.get(chapterNumber);
  return {
    ...blankChapter,
    storyChapterNumber: String(chapterNumber),
    storyChapterTitle: addNewChapter || !latest ? "" : latest.title,
    episodeNumber: String(addNewChapter || !latest ? 1 : latest.lastEpisode + 1),
    isFree: story?.accessType === "Free"
  };
}

function getItems(response) { return Array.isArray(response) ? response : response?.items || []; }

export default function AdminStoriesPage() {
  const [stories, setStories] = useState([]);
  const [genres, setGenres] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [storyOpen, setStoryOpen] = useState(false);
  const [storyForm, setStoryForm] = useState(blankStory);
  const [editingStoryId, setEditingStoryId] = useState(null);
  const [storyBusy, setStoryBusy] = useState(false);
  const [coverBusy, setCoverBusy] = useState(false);
  const [storyError, setStoryError] = useState("");

  const [currentStory, setCurrentStory] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [chaptersLoading, setChaptersLoading] = useState(false);
  const [chapterOpen, setChapterOpen] = useState(false);
  const [chapterForm, setChapterForm] = useState(blankChapter);
  const [editingChapterId, setEditingChapterId] = useState(null);
  const [chapterDetailLoading, setChapterDetailLoading] = useState(false);
  const chapterEditRequest = useRef(0);
  const chapterListRequest = useRef(0);
  const [chapterBusy, setChapterBusy] = useState(false);
  const [chapterError, setChapterError] = useState("");

  async function reload() {
    setLoading(true);
    try {
      const [storyResult, genreResult] = await Promise.all([
        getStoriesRequest({ page: 1, pageSize: 100 }),
        getGenresRequest()
      ]);
      setStories(getItems(storyResult));
      setGenres(genreResult);
      setError("");
    } catch (reason) { setError(responseError(reason)); }
    finally { setLoading(false); }
  }
  useEffect(() => { reload(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLocaleLowerCase("vi");
    if (!q) return stories;
    return stories.filter(story => [story.title, story.author, story.genre].some(value => value?.toLocaleLowerCase("vi").includes(q)));
  }, [stories, search]);

  function openCreateStory() {
    setEditingStoryId(null); setStoryForm({ ...blankStory, genre: genres[0]?.name || "", genreIds: genres[0] ? [genres[0].id] : [] }); setStoryError(""); setStoryOpen(true);
  }

  async function openEditStory(story) {
    setStoryError(""); setNotice("");
    try {
      const detail = await getStoryRequest(story.id);
      setEditingStoryId(story.id);
      setStoryForm({ title: detail.title || "", author: detail.author || "", genre: detail.genre || "", genreIds: detail.genres?.map(item => item.id) || [], description: detail.description || "", status: detail.status || "Đang cập nhật", coverTheme: detail.coverTheme || "teal", coverUrl: detail.coverUrl || "", accessType: detail.accessType || "Free", price: String(detail.price || ""), freeChapterCount: String(detail.freeChapterCount || 0) });
      setStoryOpen(true);
    } catch (reason) { setError(responseError(reason)); }
  }

  async function saveStory(event) {
    event.preventDefault(); setStoryBusy(true); setStoryError(""); setNotice("");
    const firstGenre = genres.find(genre => storyForm.genreIds.includes(genre.id));
    const body = { ...storyForm, title: storyForm.title.trim(), author: storyForm.author.trim(), genre: firstGenre?.name || storyForm.genre.trim(), genreIds: storyForm.genreIds, description: storyForm.description.trim(), price: Number(storyForm.price || 0), freeChapterCount: Number(storyForm.freeChapterCount || 0), coverUrl: storyForm.coverUrl || null };
    if ([body.title, body.author, body.description].some(value => !value) || !body.genreIds.length) {
      setStoryError("Vui lòng nhập tên, tác giả, giới thiệu và chọn ít nhất một thể loại."); setStoryBusy(false); return;
    }
    try {
      const wasEditing = editingStoryId !== null;
      if (wasEditing) await adminService.updateStory(editingStoryId, body);
      else await adminService.createStory(body);
      setStoryOpen(false); setNotice(wasEditing ? "Đã cập nhật thông tin truyện." : "Đã thêm truyện vào thư viện."); await reload();
    } catch (reason) { setStoryError(responseError(reason)); }
    finally { setStoryBusy(false); }
  }

  async function uploadCover(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setStoryError("Ảnh bìa tối đa 5 MB."); return; }
    setCoverBusy(true); setStoryError("");
    try { const result = await adminService.uploadStoryCover(file); setStoryForm(previous => ({ ...previous, coverUrl: result.coverUrl })); }
    catch (reason) { setStoryError(responseError(reason)); }
    finally { setCoverBusy(false); }
  }

  async function removeStory(story) {
    if (!window.confirm(`Xóa truyện “${story.title}” và toàn bộ chương? Thao tác này không thể hoàn tác.`)) return;
    setError(""); setNotice("");
    try { await adminService.deleteStory(story.id); setNotice(`Đã xóa truyện “${story.title}”.`); await reload(); }
    catch (reason) { setError(responseError(reason)); }
  }

  async function loadChapterList(storyId) {
    const requestId = ++chapterListRequest.current;
    setChaptersLoading(true); setChapterError("");
    try {
      const result = await loadChapters(storyId);
      if (requestId === chapterListRequest.current) setChapters(result);
      return result;
    } catch (reason) {
      if (requestId === chapterListRequest.current) setChapterError(responseError(reason));
      return null;
    } finally {
      if (requestId === chapterListRequest.current) setChaptersLoading(false);
    }
  }

  async function openChapters(story) {
    chapterEditRequest.current += 1;
    setChapterDetailLoading(false); setCurrentStory(story); setChapters([]); setChapterForm(newChapterForm(story, [], true)); setEditingChapterId(null); setChapterOpen(true);
    const loaded = await loadChapterList(story.id);
    if (Array.isArray(loaded)) setChapterForm(newChapterForm(story, loaded));
  }

  async function editChapter(chapter) {
    const requestId = ++chapterEditRequest.current;
    setChapterError(""); setEditingChapterId(chapter.id); setChapterDetailLoading(true);
    setChapterForm({ storyChapterNumber: String(chapter.storyChapterNumber || chapter.number), storyChapterTitle: chapter.storyChapterTitle || `Chương ${chapter.number}`, episodeNumber: String(chapter.episodeNumber || 1), title: chapter.title, content: "", isFree: Boolean(chapter.isFree), publishAt: formatDateTimeLocal(chapter.publishAt) });
    try {
      const detail = await adminService.getChapter(chapter.id);
      if (requestId === chapterEditRequest.current) setChapterForm({ storyChapterNumber: String(detail.storyChapterNumber || detail.number), storyChapterTitle: detail.storyChapterTitle || `Chương ${detail.number}`, episodeNumber: String(detail.episodeNumber || 1), title: detail.title, content: detail.content || "", isFree: Boolean(detail.isFree), publishAt: formatDateTimeLocal(detail.publishAt) });
    } catch (reason) { if (requestId === chapterEditRequest.current) setChapterError(responseError(reason)); }
    finally { if (requestId === chapterEditRequest.current) setChapterDetailLoading(false); }
  }

  function resetChapterForm(chapterItems) {
    chapterEditRequest.current += 1;
    setChapterDetailLoading(false);
    setEditingChapterId(null);
    const list = Array.isArray(chapterItems) ? chapterItems : chapters;
    setChapterForm(newChapterForm(currentStory, list, false));
    setChapterError("");
  }

  async function loadChapterText(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > 1_000_000) { setChapterError("Tệp chương tối đa 1 MB."); return; }
    try {
      const content = await file.text();
      const title = file.name.replace(/\.txt$/i, "").slice(0, 200);
      setChapterForm(previous => ({ ...previous, content, title: previous.title || title }));
      setChapterError("");
    } catch { setChapterError("Không đọc được tệp. Hãy chọn tệp văn bản UTF-8 .txt."); }
  }

  async function saveChapter(event) {
    event.preventDefault();
    const storyChapterNumber = Number(chapterForm.storyChapterNumber);
    const episodeNumber = Number(chapterForm.episodeNumber);
    if (!Number.isSafeInteger(storyChapterNumber) || storyChapterNumber < 1 || !Number.isSafeInteger(episodeNumber) || episodeNumber < 1 || !chapterForm.storyChapterTitle.trim() || !chapterForm.title.trim() || !chapterForm.content.trim()) {
      setChapterError("Nhập số chương, tên chương, số tập, tiêu đề tập và nội dung tập."); return;
    }
    setChapterBusy(true); setChapterError("");
    const body = { storyChapterNumber, storyChapterTitle: chapterForm.storyChapterTitle.trim(), episodeNumber, title: chapterForm.title.trim(), content: chapterForm.content.trim(), isFree: chapterForm.isFree, publishAt: toIsoDate(chapterForm.publishAt) };
    try {
      const editing = editingChapterId !== null;
      if (editing) await adminService.updateChapter(currentStory.id, editingChapterId, body);
      else await adminService.createChapter(currentStory.id, body);
      const updatedChapters = await loadChapterList(currentStory.id); setNotice(editing ? "Đã lưu tập." : "Đã thêm tập vào chương."); resetChapterForm(Array.isArray(updatedChapters) ? updatedChapters : chapters); await reload();
    } catch (reason) { setChapterError(responseError(reason)); }
    finally { setChapterBusy(false); }
  }

  async function removeChapter(chapter) {
    if (!window.confirm(`Xóa Chương ${chapter.storyChapterNumber || chapter.number}, Tập ${chapter.episodeNumber || 1}: “${chapter.title}”?`)) return;
    try { await adminService.deleteChapter(currentStory.id, chapter.id); const updatedChapters = await loadChapterList(currentStory.id); resetChapterForm(Array.isArray(updatedChapters) ? updatedChapters : chapters); setNotice(`Đã xóa tập ${chapter.episodeNumber || 1}.`); await reload(); }
    catch (reason) { setChapterError(responseError(reason)); }
  }

  return <div className="admin-page">
    <div className="admin-page__heading"><div><p className="eyebrow">QUẢN TRỊ / NỘI DUNG</p><h1>Truyện & chương</h1><p>Chỉnh sửa nội dung hiển thị trong thư viện.</p></div><button className="button button--primary" type="button" onClick={openCreateStory}>Thêm truyện <span aria-hidden="true">+</span></button></div>
    {notice && <p className="inline-notice" role="status">{notice}</p>}{error && <p className="form-message form-message--error" role="alert">{error}</p>}
    <div className="admin-toolbar"><label className="admin-search"><span className="sr-only">Tìm truyện</span><svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="10.8" cy="10.8" r="6.4"/><path d="m16 16 4 4"/></svg><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Tìm truyện, tác giả hoặc thể loại" /></label><span>{filtered.length} truyện trong danh sách</span></div>
    {loading ? <LoadingState label="Đang tải thư viện…" /> : error && !stories.length ? <ErrorState message={error} onRetry={reload} /> : filtered.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Tên truyện</th><th>Thể loại</th><th>Tình trạng</th><th>Chương / tập</th><th>Thao tác</th></tr></thead><tbody>{filtered.map(story => <tr key={story.id}><td data-label="Tên truyện"><strong>{story.title}</strong><span>{story.author}</span></td><td data-label="Thể loại">{story.genre}</td><td data-label="Tình trạng">{displayStatus(story.status)}</td><td data-label="Chương / tập">{story.storyChapterCount ?? 0} chương · {story.episodeCount ?? story.chapterCount ?? 0} tập</td><td data-label="Thao tác"><div className="table-actions"><button type="button" onClick={() => openChapters(story)}>Chương & tập</button><button type="button" onClick={() => openEditStory(story)}>Sửa</button><button className="button-text--danger" type="button" onClick={() => removeStory(story)}>Xóa</button></div></td></tr>)}</tbody></table></div> : <EmptyState title="Không tìm thấy truyện" detail="Thử tìm theo tên khác hoặc thêm truyện mới." />}

    {storyOpen && <div className="modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setStoryOpen(false); }}><section className="form-dialog form-dialog--wide" role="dialog" aria-modal="true" aria-labelledby="story-dialog-title"><div className="form-dialog__heading"><div><p className="section-heading__overline">THƯ VIỆN</p><h2 id="story-dialog-title">{editingStoryId ? "Chỉnh sửa truyện" : "Thêm truyện mới"}</h2></div><button className="icon-button" type="button" aria-label="Đóng" onClick={() => setStoryOpen(false)}>×</button></div><form className="stack-form" onSubmit={saveStory}>
      <div className="form-grid"><label>Tên truyện<input value={storyForm.title} onChange={event => setStoryForm({ ...storyForm, title: event.target.value })} required maxLength="200" /></label><label>Tác giả<input value={storyForm.author} onChange={event => setStoryForm({ ...storyForm, author: event.target.value })} required maxLength="120" /></label><label>Tình trạng<select value={storyForm.status} onChange={event => setStoryForm({ ...storyForm, status: event.target.value })}><option>Đang cập nhật</option><option>Hoàn thành</option></select></label><label>Kiểu bìa dự phòng<select value={storyForm.coverTheme} onChange={event => setStoryForm({ ...storyForm, coverTheme: event.target.value })}><option value="teal">Xanh ngọc</option><option value="indigo">Chàm</option><option value="rose">Hồng đất</option><option value="amber">Hổ phách</option><option value="sage">Xanh lá</option><option value="slate">Xanh xám</option></select></label></div>
      <fieldset className="selection-fieldset"><legend>Thể loại — chọn một hoặc nhiều</legend><div className="genre-selection-grid">{genres.map(genre => <label className="check-label" key={genre.id}><input type="checkbox" checked={storyForm.genreIds.includes(genre.id)} onChange={() => setStoryForm(previous => ({ ...previous, genreIds: previous.genreIds.includes(genre.id) ? previous.genreIds.filter(id => id !== genre.id) : [...previous.genreIds, genre.id] }))} />{genre.name}</label>)}</div></fieldset>
      <label>Giới thiệu<textarea value={storyForm.description} onChange={event => setStoryForm({ ...storyForm, description: event.target.value })} rows="4" required maxLength="3000" /></label>
      <div className="cover-upload-row"><label>Ảnh bìa JPG, PNG hoặc WebP<input type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadCover} /></label>{coverBusy && <span role="status">Đang tải ảnh…</span>}{storyForm.coverUrl && <img className="admin-cover-preview" src={storyForm.coverUrl} alt="Ảnh bìa truyện" />}</div>
      <div className="form-grid"><label>Quyền truy cập<select value={storyForm.accessType} onChange={event => setStoryForm({ ...storyForm, accessType: event.target.value })}><option value="Free">Miễn phí</option><option value="Paid">Trả phí</option><option value="Mixed">Kết hợp miễn phí và trả phí</option></select></label>{storyForm.accessType !== "Free" && <label>Giá mua truyện (₫)<input type="number" min="0" step="1000" value={storyForm.price} onChange={event => setStoryForm({ ...storyForm, price: event.target.value })} required /></label>}{storyForm.accessType === "Mixed" && <label>Số chương đầu miễn phí<input type="number" min="0" max="100000" value={storyForm.freeChapterCount} onChange={event => setStoryForm({ ...storyForm, freeChapterCount: event.target.value })} /></label>}</div>
      {storyError && <p className="form-message form-message--error" role="alert">{storyError}</p>}<div className="form-actions"><button className="button button--primary" type="submit" disabled={storyBusy || coverBusy}>{storyBusy ? "Đang lưu…" : "Lưu truyện"}</button><button className="button button--outline" type="button" onClick={() => setStoryOpen(false)}>Hủy</button></div>
    </form></section></div>}

    {chapterOpen && currentStory && <div className="modal-backdrop modal-backdrop--chapters" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setChapterOpen(false); }}><section className="chapter-manager" role="dialog" aria-modal="true" aria-labelledby="chapter-manager-title"><div className="form-dialog__heading"><div><p className="section-heading__overline">{currentStory.title}</p><h2 id="chapter-manager-title">Quản lý chương & tập</h2></div><button className="icon-button" type="button" aria-label="Đóng" onClick={() => setChapterOpen(false)}>×</button></div><div className="chapter-manager__grid"><div className="chapter-manager__list"><div className="chapter-manager__list-head"><strong>{new Set(chapters.map(item => item.storyChapterNumber || item.number)).size} chương · {chapters.length} tập</strong><div className="chapter-manager__list-actions"><button type="button" className="text-link" onClick={() => { setEditingChapterId(null); setChapterForm(newChapterForm(currentStory, chapters, false)); setChapterError(""); }}>+ Thêm tập</button><button type="button" className="text-link" onClick={() => { setEditingChapterId(null); setChapterForm(newChapterForm(currentStory, chapters, true)); setChapterError(""); }}>+ Chương mới</button></div></div>{chaptersLoading ? <LoadingState label="Đang tải mục lục…" /> : chapterError && !chapters.length ? <ErrorState message={chapterError} onRetry={() => loadChapterList(currentStory.id)} /> : chapters.length ? <ol className="admin-chapter-list">{chapters.map(chapter => <li key={chapter.id} className={editingChapterId === chapter.id ? "is-current" : ""}><button className="admin-chapter-list__edit" type="button" onClick={() => editChapter(chapter)}><span>Chương {chapter.storyChapterNumber || chapter.number} · Tập {chapter.episodeNumber || 1}</span><strong>{chapter.title}</strong><small>{chapter.isPublished === false ? "Đã lên lịch" : chapter.hasContent === false ? "Thiếu nội dung" : "Đã phát hành"}</small></button><button className="button-text--danger" type="button" onClick={() => removeChapter(chapter)} aria-label={`Xóa tập ${chapter.episodeNumber || 1}`}>Xóa</button></li>)}</ol> : <EmptyState title="Chưa có chương" detail="Tạo một chương rồi thêm nhiều tập vào bên trong." />}</div><form className="chapter-form stack-form" onSubmit={saveChapter}><p className="section-heading__overline">{editingChapterId ? "CHỈNH SỬA TẬP" : "THÊM NỘI DUNG"}</p><h3>{editingChapterId ? "Cập nhật tập" : "Thêm tập truyện"}</h3><div className="form-grid"><label>Số chương<input type="number" min="1" max="100000" value={chapterForm.storyChapterNumber} onChange={event => setChapterForm({ ...chapterForm, storyChapterNumber: event.target.value })} required /></label><label>Tên chương<input value={chapterForm.storyChapterTitle} onChange={event => setChapterForm({ ...chapterForm, storyChapterTitle: event.target.value })} required maxLength="200" /></label><label>Số tập trong chương<input type="number" min="1" max="100000" value={chapterForm.episodeNumber} onChange={event => setChapterForm({ ...chapterForm, episodeNumber: event.target.value })} required /></label><label>Tên tập<input value={chapterForm.title} onChange={event => setChapterForm({ ...chapterForm, title: event.target.value })} required maxLength="200" /></label></div><label>Nhập nội dung từ tệp .txt<input type="file" accept=".txt,text/plain" onChange={loadChapterText} /></label><label>Nội dung tập<textarea value={chapterForm.content} onChange={event => setChapterForm({ ...chapterForm, content: event.target.value })} rows="10" required disabled={chapterDetailLoading} /></label>{chapterDetailLoading && <p role="status" className="quiet-note">Đang tải nội dung tập…</p>}<label>Thời điểm phát hành<input type="datetime-local" value={chapterForm.publishAt} onChange={event => setChapterForm({ ...chapterForm, publishAt: event.target.value })} /></label><label className="check-label"><input type="checkbox" checked={chapterForm.isFree} disabled={currentStory.accessType !== "Mixed"} title={currentStory.accessType !== "Mixed" ? "Chỉ áp dụng cho truyện ở chế độ Kết hợp." : ""} onChange={event => setChapterForm({ ...chapterForm, isFree: event.target.checked })} /> Tập miễn phí</label>{chapterError && <p className="form-message form-message--error" role="alert">{chapterError}</p>}<div className="form-actions"><button className="button button--primary" type="submit" disabled={chapterBusy || chapterDetailLoading}>{chapterBusy ? "Đang lưu…" : editingChapterId ? "Lưu tập" : "Thêm tập"}</button>{editingChapterId && <button className="button button--outline" type="button" onClick={resetChapterForm}>Hủy sửa</button>}</div></form></div></section></div>}
  </div>;
}
