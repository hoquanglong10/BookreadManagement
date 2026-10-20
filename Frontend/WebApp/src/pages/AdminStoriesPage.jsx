import { useEffect, useMemo, useRef, useState } from "react";
import { getStoryRequest, getStoriesRequest, getGenresRequest } from "../api/catalogApi.js";
import { responseError } from "../api/http.js";
import { adminService } from "../services/adminService.js";
import { loadChapters } from "../services/catalogService.js";
import { displayStatus, formatDate, formatDateTimeLocal, toIsoDate } from "../utils/format.js";
import { EmptyState, ErrorState, LoadingState } from "../components/StatePanel.jsx";

const blankStory = { title: "", author: "", genre: "", description: "", status: "Đang cập nhật", coverTheme: "ink" };
const blankChapter = { number: "", title: "", content: "", isFree: true, publishAt: "" };

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
    setEditingStoryId(null); setStoryForm({ ...blankStory, genre: genres[0]?.name || "" }); setStoryError(""); setStoryOpen(true);
  }

  async function openEditStory(story) {
    setStoryError(""); setNotice("");
    try {
      const detail = await getStoryRequest(story.id);
      setEditingStoryId(story.id);
      setStoryForm({ title: detail.title || "", author: detail.author || "", genre: detail.genre || "", description: detail.description || "", status: detail.status || "Đang cập nhật", coverTheme: detail.coverTheme || "ink" });
      setStoryOpen(true);
    } catch (reason) { setError(responseError(reason)); }
  }

  async function saveStory(event) {
    event.preventDefault(); setStoryBusy(true); setStoryError(""); setNotice("");
    const body = { ...storyForm, title: storyForm.title.trim(), author: storyForm.author.trim(), genre: storyForm.genre.trim(), description: storyForm.description.trim() };
    if ([body.title, body.author, body.genre, body.description].some(value => !value)) {
      setStoryError("Vui lòng nhập đầy đủ tên, tác giả, thể loại và giới thiệu."); setStoryBusy(false); return;
    }
    try {
      const wasEditing = editingStoryId !== null;
      if (wasEditing) await adminService.updateStory(editingStoryId, body);
      else await adminService.createStory(body);
      setStoryOpen(false); setNotice(wasEditing ? "Đã cập nhật thông tin truyện." : "Đã thêm truyện vào thư viện."); await reload();
    } catch (reason) { setStoryError(responseError(reason)); }
    finally { setStoryBusy(false); }
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
    setChapterDetailLoading(false); setCurrentStory(story); setChapters([]); setChapterForm({ ...blankChapter, number: String((story.chapterCount || 0) + 1) }); setEditingChapterId(null); setChapterOpen(true);
    const loaded = await loadChapterList(story.id);
    if (Array.isArray(loaded)) setChapterForm({ ...blankChapter, number: String(loaded.reduce((max, item) => Math.max(max, item.number), 0) + 1) });
  }

  async function editChapter(chapter) {
    const requestId = ++chapterEditRequest.current;
    setChapterError(""); setEditingChapterId(chapter.id); setChapterDetailLoading(true);
    setChapterForm({ number: String(chapter.number), title: chapter.title, content: "", isFree: Boolean(chapter.isFree), publishAt: formatDateTimeLocal(chapter.publishAt) });
    try {
      const detail = await adminService.getChapter(chapter.id);
      if (requestId === chapterEditRequest.current) setChapterForm({ number: String(detail.number), title: detail.title, content: detail.content || "", isFree: Boolean(detail.isFree), publishAt: formatDateTimeLocal(detail.publishAt) });
    } catch (reason) { if (requestId === chapterEditRequest.current) setChapterError(responseError(reason)); }
    finally { if (requestId === chapterEditRequest.current) setChapterDetailLoading(false); }
  }

  function resetChapterForm(chapterItems) {
    chapterEditRequest.current += 1;
    setChapterDetailLoading(false);
    setEditingChapterId(null);
    const list = Array.isArray(chapterItems) ? chapterItems : chapters;
    setChapterForm({ ...blankChapter, number: String(list.reduce((max, item) => Math.max(max, item.number), 0) + 1) });
    setChapterError("");
  }

  async function saveChapter(event) {
    event.preventDefault();
    const number = Number(chapterForm.number);
    if (!Number.isSafeInteger(number) || number < 1 || !chapterForm.title.trim() || !chapterForm.content.trim()) {
      setChapterError("Nhập số chương, tiêu đề và nội dung chương."); return;
    }
    setChapterBusy(true); setChapterError("");
    const body = { number, title: chapterForm.title.trim(), content: chapterForm.content.trim(), isFree: chapterForm.isFree, publishAt: toIsoDate(chapterForm.publishAt) };
    try {
      const editing = editingChapterId !== null;
      if (editing) await adminService.updateChapter(currentStory.id, editingChapterId, body);
      else await adminService.createChapter(currentStory.id, body);
      const updatedChapters = await loadChapterList(currentStory.id); setNotice(editing ? "Đã lưu chương." : "Đã thêm chương."); resetChapterForm(Array.isArray(updatedChapters) ? updatedChapters : chapters); await reload();
    } catch (reason) { setChapterError(responseError(reason)); }
    finally { setChapterBusy(false); }
  }

  async function removeChapter(chapter) {
    if (!window.confirm(`Xóa chương ${chapter.number}: “${chapter.title}”?`)) return;
    try { await adminService.deleteChapter(currentStory.id, chapter.id); const updatedChapters = await loadChapterList(currentStory.id); resetChapterForm(Array.isArray(updatedChapters) ? updatedChapters : chapters); setNotice(`Đã xóa chương ${chapter.number}.`); await reload(); }
    catch (reason) { setChapterError(responseError(reason)); }
  }

  return <div className="admin-page">
    <div className="admin-page__heading"><div><p className="eyebrow">QUẢN TRỊ / NỘI DUNG</p><h1>Truyện & chương</h1><p>Chỉnh sửa nội dung hiển thị trong thư viện.</p></div><button className="button button--primary" type="button" onClick={openCreateStory}>Thêm truyện <span aria-hidden="true">+</span></button></div>
    {notice && <p className="inline-notice" role="status">{notice}</p>}{error && <p className="form-message form-message--error" role="alert">{error}</p>}
    <div className="admin-toolbar"><label className="admin-search"><span className="sr-only">Tìm truyện</span><svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="10.8" cy="10.8" r="6.4"/><path d="m16 16 4 4"/></svg><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Tìm truyện, tác giả hoặc thể loại" /></label><span>{filtered.length} truyện trong danh sách</span></div>
    {loading ? <LoadingState label="Đang tải thư viện…" /> : error && !stories.length ? <ErrorState message={error} onRetry={reload} /> : filtered.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Tên truyện</th><th>Thể loại</th><th>Tình trạng</th><th>Chương</th><th>Thao tác</th></tr></thead><tbody>{filtered.map(story => <tr key={story.id}><td data-label="Tên truyện"><strong>{story.title}</strong><span>{story.author}</span></td><td data-label="Thể loại">{story.genre}</td><td data-label="Tình trạng">{displayStatus(story.status)}</td><td data-label="Chương">{story.chapterCount ?? 0}</td><td data-label="Thao tác"><div className="table-actions"><button type="button" onClick={() => openChapters(story)}>Chương</button><button type="button" onClick={() => openEditStory(story)}>Sửa</button><button className="button-text--danger" type="button" onClick={() => removeStory(story)}>Xóa</button></div></td></tr>)}</tbody></table></div> : <EmptyState title="Không tìm thấy truyện" detail="Thử tìm theo tên khác hoặc thêm truyện mới." />}

    {storyOpen && <div className="modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setStoryOpen(false); }}><section className="form-dialog form-dialog--wide" role="dialog" aria-modal="true" aria-labelledby="story-dialog-title"><div className="form-dialog__heading"><div><p className="section-heading__overline">THƯ VIỆN</p><h2 id="story-dialog-title">{editingStoryId ? "Chỉnh sửa truyện" : "Thêm truyện mới"}</h2></div><button className="icon-button" type="button" aria-label="Đóng" onClick={() => setStoryOpen(false)}>×</button></div><form className="stack-form" onSubmit={saveStory}><div className="form-grid"><label>Tên truyện<input value={storyForm.title} onChange={event => setStoryForm({ ...storyForm, title: event.target.value })} required maxLength="180" /></label><label>Tác giả<input value={storyForm.author} onChange={event => setStoryForm({ ...storyForm, author: event.target.value })} required maxLength="120" /></label><label>Thể loại<input list="genre-options" value={storyForm.genre} onChange={event => setStoryForm({ ...storyForm, genre: event.target.value })} required maxLength="80" /><datalist id="genre-options">{genres.map(genre => <option key={genre.id} value={genre.name} />)}</datalist></label><label>Tình trạng<select value={storyForm.status} onChange={event => setStoryForm({ ...storyForm, status: event.target.value })}><option>Đang cập nhật</option><option>Hoàn thành</option></select></label><label>Kiểu bìa<select value={storyForm.coverTheme} onChange={event => setStoryForm({ ...storyForm, coverTheme: event.target.value })}><option value="ink">Mực xanh</option><option value="clay">Đất nung</option><option value="moss">Rêu</option><option value="plum">Mận</option><option value="ochre">Đất vàng</option><option value="blue">Xanh biển</option></select></label></div><label>Giới thiệu<textarea value={storyForm.description} onChange={event => setStoryForm({ ...storyForm, description: event.target.value })} rows="5" required maxLength="4000" /></label>{storyError && <p className="form-message form-message--error" role="alert">{storyError}</p>}<div className="form-actions"><button className="button button--primary" type="submit" disabled={storyBusy}>{storyBusy ? "Đang lưu…" : "Lưu truyện"}</button><button className="button button--outline" type="button" onClick={() => setStoryOpen(false)}>Hủy</button></div></form></section></div>}

    {chapterOpen && currentStory && <div className="modal-backdrop modal-backdrop--chapters" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setChapterOpen(false); }}><section className="chapter-manager" role="dialog" aria-modal="true" aria-labelledby="chapter-manager-title"><div className="form-dialog__heading"><div><p className="section-heading__overline">{currentStory.title}</p><h2 id="chapter-manager-title">Quản lý chương</h2></div><button className="icon-button" type="button" aria-label="Đóng" onClick={() => setChapterOpen(false)}>×</button></div><div className="chapter-manager__grid"><div className="chapter-manager__list"><div className="chapter-manager__list-head"><strong>{chapters.length} chương</strong><button type="button" className="text-link" onClick={resetChapterForm}>+ Thêm chương</button></div>{chaptersLoading ? <LoadingState label="Đang tải chương…" /> : chapterError && !chapters.length ? <ErrorState message={chapterError} onRetry={() => loadChapterList(currentStory.id)} /> : chapters.length ? <ol className="admin-chapter-list">{chapters.map(chapter => <li key={chapter.id} className={editingChapterId === chapter.id ? "is-current" : ""}><button className="admin-chapter-list__edit" type="button" onClick={() => editChapter(chapter)}><span>Chương {chapter.number}</span><strong>{chapter.title}</strong><small>{chapter.isPublished === false ? "Đã lên lịch" : chapter.hasContent === false ? "Thiếu nội dung" : "Đã phát hành"}</small></button><button className="button-text--danger" type="button" onClick={() => removeChapter(chapter)} aria-label={`Xóa chương ${chapter.number}`}>Xóa</button></li>)}</ol> : <EmptyState title="Chưa có chương" detail="Dùng biểu mẫu để thêm chương đầu tiên." />}</div><form className="chapter-form stack-form" onSubmit={saveChapter}><p className="section-heading__overline">{editingChapterId ? "CHỈNH SỬA" : "THÊM MỚI"}</p><h3>{editingChapterId ? "Cập nhật chương" : "Thêm chương"}</h3><div className="form-grid"><label>Số chương<input type="number" min="1" max="100000" value={chapterForm.number} onChange={event => setChapterForm({ ...chapterForm, number: event.target.value })} required /></label><label>Tiêu đề<input value={chapterForm.title} onChange={event => setChapterForm({ ...chapterForm, title: event.target.value })} required maxLength="180" /></label></div><label>Nội dung<textarea value={chapterForm.content} onChange={event => setChapterForm({ ...chapterForm, content: event.target.value })} rows="10" required disabled={chapterDetailLoading} /></label>{chapterDetailLoading && <p role="status" className="quiet-note">Đang tải nội dung chương…</p>}<label>Thời điểm phát hành<input type="datetime-local" value={chapterForm.publishAt} onChange={event => setChapterForm({ ...chapterForm, publishAt: event.target.value })} /></label><label className="check-label"><input type="checkbox" checked={chapterForm.isFree} onChange={event => setChapterForm({ ...chapterForm, isFree: event.target.checked })} /> Chương miễn phí</label>{chapterError && <p className="form-message form-message--error" role="alert">{chapterError}</p>}<div className="form-actions"><button className="button button--primary" type="submit" disabled={chapterBusy || chapterDetailLoading}>{chapterBusy ? "Đang lưu…" : editingChapterId ? "Lưu chương" : "Thêm chương"}</button>{editingChapterId && <button className="button button--outline" type="button" onClick={resetChapterForm}>Hủy sửa</button>}</div></form></div></section></div>}
  </div>;
}
