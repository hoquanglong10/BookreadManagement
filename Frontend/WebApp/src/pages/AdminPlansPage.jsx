import { useEffect, useState } from "react";
import { getGenresRequest, getStoriesRequest } from "../api/catalogApi.js";
import { responseError } from "../api/http.js";
import { adminService } from "../services/adminService.js";
import { EmptyState, ErrorState, LoadingState } from "../components/StatePanel.jsx";

const blankPlan = { name: "", price: "", durationDays: "30", accessScope: "AllStories", isAvailable: true, genreIds: [], storyIds: [] };
const scopeLabels = { AllStories: "Toàn bộ thư viện", SelectedGenres: "Theo thể loại", SelectedStories: "Theo truyện" };

export default function AdminPlansPage() {
  const [plans, setPlans] = useState([]);
  const [genres, setGenres] = useState([]);
  const [stories, setStories] = useState([]);
  const [form, setForm] = useState(blankPlan);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function reload() {
    setLoading(true);
    try {
      const [planItems, genreItems, storyResult] = await Promise.all([
        adminService.getPlans(), getGenresRequest(), getStoriesRequest({ page: 1, pageSize: 100 })
      ]);
      setPlans(planItems); setGenres(genreItems); setStories(Array.isArray(storyResult) ? storyResult : storyResult.items || []); setError("");
    } catch (reason) { setError(responseError(reason)); }
    finally { setLoading(false); }
  }
  useEffect(() => { reload(); }, []);

  function edit(plan) {
    setEditingId(plan.id);
    setForm({ name: plan.name, price: String(plan.price), durationDays: String(plan.durationDays), accessScope: plan.accessScope, isAvailable: plan.isAvailable, genreIds: plan.genreIds || [], storyIds: plan.storyIds || [] });
    setNotice(""); setError("");
  }

  function reset() { setEditingId(null); setForm(blankPlan); setError(""); }

  async function save(event) {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    const body = { ...form, name: form.name.trim(), price: Number(form.price), durationDays: Number(form.durationDays), genreIds: form.genreIds.map(Number), storyIds: form.storyIds.map(Number) };
    if (!body.name || !Number.isFinite(body.price) || body.price < 0 || !Number.isInteger(body.durationDays) || body.durationDays < 1) {
      setError("Kiểm tra tên gói, mức phí và thời hạn."); setBusy(false); return;
    }
    if (body.accessScope === "SelectedGenres" && !body.genreIds.length) { setError("Chọn ít nhất một thể loại."); setBusy(false); return; }
    if (body.accessScope === "SelectedStories" && !body.storyIds.length) { setError("Chọn ít nhất một truyện."); setBusy(false); return; }
    try {
      if (editingId) await adminService.updatePlan(editingId, body); else await adminService.createPlan(body);
      setNotice(editingId ? "Đã cập nhật gói đọc." : "Đã tạo gói đọc."); reset(); await reload();
    } catch (reason) { setError(responseError(reason)); }
    finally { setBusy(false); }
  }

  const toggleId = (key, id) => setForm(previous => ({ ...previous, [key]: previous[key].includes(id) ? previous[key].filter(item => item !== id) : [...previous[key], id] }));

  return <div className="admin-page">
    <div className="admin-page__heading"><div><p className="eyebrow">QUẢN TRỊ / QUYỀN ĐỌC</p><h1>Gói đọc</h1><p>Thiết lập giá, thời hạn và phạm vi nội dung được mở khóa.</p></div><span className="admin-page__total">{plans.length} gói</span></div>
    {notice && <p className="inline-notice" role="status">{notice}</p>}{error && <p className="form-message form-message--error" role="alert">{error}</p>}
    <div className="admin-two-column admin-plans-layout">
      <section className="admin-section"><div className="section-heading"><div><p className="section-heading__overline">DANH MỤC</p><h2>Gói đang cấu hình</h2></div></div>
        {loading ? <LoadingState label="Đang tải gói đọc…" /> : error && !plans.length ? <ErrorState message={error} onRetry={reload} /> : plans.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Gói</th><th>Phạm vi</th><th>Giá / thời hạn</th><th>Trạng thái</th><th /></tr></thead><tbody>{plans.map(plan => <tr key={plan.id}><td data-label="Gói"><strong>{plan.name}</strong><span>{plan.subscriptionCount} lượt đăng ký</span></td><td data-label="Phạm vi">{scopeLabels[plan.accessScope]}</td><td data-label="Giá / thời hạn">{Number(plan.price).toLocaleString("vi-VN")} ₫ / {plan.durationDays} ngày</td><td data-label="Trạng thái">{plan.isAvailable ? "Đang bán" : "Đã ngừng bán"}</td><td data-label="Thao tác"><button type="button" onClick={() => edit(plan)}>Sửa</button></td></tr>)}</tbody></table></div> : <EmptyState title="Chưa có gói đọc" detail="Tạo gói đầu tiên bằng biểu mẫu bên cạnh." />}
      </section>
      <aside className="admin-form-card"><p className="section-heading__overline">{editingId ? "CHỈNH SỬA" : "THÊM MỚI"}</p><h2>{editingId ? "Cập nhật gói" : "Tạo gói đọc"}</h2><form className="stack-form" onSubmit={save}>
        <label>Tên gói<input value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} required maxLength="100" /></label>
        <div className="form-grid"><label>Giá (₫)<input type="number" min="0" step="1000" value={form.price} onChange={event => setForm({ ...form, price: event.target.value })} required /></label><label>Thời hạn (ngày)<input type="number" min="1" max="3660" value={form.durationDays} onChange={event => setForm({ ...form, durationDays: event.target.value })} required /></label></div>
        <label>Phạm vi<select value={form.accessScope} onChange={event => setForm({ ...form, accessScope: event.target.value })}><option value="AllStories">Toàn bộ thư viện</option><option value="SelectedGenres">Theo thể loại</option><option value="SelectedStories">Theo truyện</option></select></label>
        {form.accessScope === "SelectedGenres" && <fieldset className="selection-fieldset"><legend>Thể loại áp dụng</legend>{genres.map(genre => <label className="check-label" key={genre.id}><input type="checkbox" checked={form.genreIds.includes(genre.id)} onChange={() => toggleId("genreIds", genre.id)} />{genre.name}</label>)}</fieldset>}
        {form.accessScope === "SelectedStories" && <fieldset className="selection-fieldset"><legend>Truyện áp dụng</legend>{stories.map(story => <label className="check-label" key={story.id}><input type="checkbox" checked={form.storyIds.includes(story.id)} onChange={() => toggleId("storyIds", story.id)} />{story.title}</label>)}</fieldset>}
        <label className="check-label"><input type="checkbox" checked={form.isAvailable} onChange={event => setForm({ ...form, isAvailable: event.target.checked })} /> Đang cho đăng ký</label>
        <p className="quiet-note">Ngừng bán chỉ ẩn gói khỏi đăng ký mới; quyền của lượt đăng ký hiện hành vẫn theo ngày hết hạn.</p>
        <div className="form-actions"><button className="button button--primary" disabled={busy}>{busy ? "Đang lưu…" : editingId ? "Lưu thay đổi" : "Tạo gói"}</button>{editingId && <button className="button button--outline" type="button" onClick={reset}>Hủy</button>}</div>
      </form></aside>
    </div>
  </div>;
}
