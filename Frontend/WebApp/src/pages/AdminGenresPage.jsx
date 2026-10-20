import { useEffect, useState } from "react";
import { getGenresRequest } from "../api/catalogApi.js";
import { responseError } from "../api/http.js";
import { adminService } from "../services/adminService.js";
import { EmptyState, ErrorState, LoadingState } from "../components/StatePanel.jsx";

export default function AdminGenresPage() {
  const [genres, setGenres] = useState([]);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function reload() {
    setLoading(true);
    try { const result = await getGenresRequest(); setGenres(result); setError(""); }
    catch (reason) { setError(responseError(reason)); }
    finally { setLoading(false); }
  }
  useEffect(() => { reload(); }, []);

  async function save(event) {
    event.preventDefault();
    const value = name.trim();
    if (!value) return setError("Nhập tên thể loại trước khi lưu.");
    setBusy(true); setError(""); setNotice("");
    try {
      if (editingId) await adminService.updateGenre(editingId, value);
      else await adminService.createGenre(value);
      setName(""); setEditingId(null); setNotice(editingId ? "Đã cập nhật thể loại." : "Đã thêm thể loại."); await reload();
    } catch (reason) { setError(responseError(reason)); }
    finally { setBusy(false); }
  }

  async function remove(genre) {
    if (!window.confirm(`Xóa thể loại “${genre.name}”?`)) return;
    setError(""); setNotice("");
    try { await adminService.deleteGenre(genre.id); setNotice(`Đã xóa thể loại “${genre.name}”.`); await reload(); }
    catch (reason) { setError(responseError(reason)); }
  }

  function edit(genre) { setEditingId(genre.id); setName(genre.name); setNotice(""); setError(""); }
  function cancelEdit() { setEditingId(null); setName(""); }

  return <div className="admin-page">
    <div className="admin-page__heading"><div><p className="eyebrow">QUẢN TRỊ / PHÂN LOẠI</p><h1>Thể loại truyện</h1><p>Nhóm truyện theo cách độc giả tìm kiếm.</p></div><span className="admin-page__total">{genres.length} thể loại</span></div>
    <div className="admin-two-column">
      <section className="admin-section"><div className="section-heading"><div><p className="section-heading__overline">DANH MỤC</p><h2>Đang sử dụng</h2></div></div>
        {loading ? <LoadingState label="Đang tải thể loại…" /> : error && !genres.length ? <ErrorState message={error} onRetry={reload} /> : genres.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Tên thể loại</th><th>Truyện</th><th>Thao tác</th></tr></thead><tbody>{genres.map(genre => <tr key={genre.id}><td data-label="Tên thể loại"><strong>{genre.name}</strong></td><td data-label="Truyện">{genre.storyCount ?? 0}</td><td data-label="Thao tác"><div className="table-actions"><button type="button" onClick={() => edit(genre)}>Sửa</button><button className="button-text--danger" type="button" onClick={() => remove(genre)}>Xóa</button></div></td></tr>)}</tbody></table></div> : <EmptyState title="Chưa có thể loại" detail="Thêm thể loại đầu tiên bằng biểu mẫu bên cạnh." />}
      </section>
      <aside className="admin-form-card"><p className="section-heading__overline">{editingId ? "CHỈNH SỬA" : "THÊM MỚI"}</p><h2>{editingId ? "Đổi tên thể loại" : "Thêm thể loại"}</h2><form className="stack-form" onSubmit={save}><label htmlFor="genre-name">Tên thể loại</label><input id="genre-name" value={name} onChange={event => setName(event.target.value)} maxLength="80" required placeholder="Ví dụ: Kỳ ảo" />{error && <p className="form-message form-message--error" role="alert">{error}</p>}{notice && <p className="form-message form-message--success" role="status">{notice}</p>}<div className="form-actions"><button className="button button--primary" type="submit" disabled={busy}>{busy ? "Đang lưu…" : editingId ? "Lưu thay đổi" : "Thêm thể loại"}</button>{editingId && <button className="button button--outline" type="button" onClick={cancelEdit}>Hủy</button>}</div></form></aside>
    </div>
  </div>;
}
