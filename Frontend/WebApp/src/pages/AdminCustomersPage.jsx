import { useEffect, useMemo, useState } from "react";
import { responseError } from "../api/http.js";
import { adminService } from "../services/adminService.js";
import { EmptyState, ErrorState, LoadingState } from "../components/StatePanel.jsx";

const blankCustomer = { fullName: "", phone: "", email: "", address: "" };

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(blankCustomer);
  const [editingId, setEditingId] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function reload() {
    setLoading(true);
    try { setCustomers(await adminService.getCustomers()); setError(""); }
    catch (reason) { setError(responseError(reason)); }
    finally { setLoading(false); }
  }
  useEffect(() => { reload(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLocaleLowerCase("vi");
    if (!q) return customers;
    return customers.filter(customer => [customer.fullName, customer.email, customer.phone].some(value => value?.toLocaleLowerCase("vi").includes(q)));
  }, [customers, search]);

  function openCreate() { setEditingId(null); setForm(blankCustomer); setError(""); setNotice(""); setDialogOpen(true); }
  async function openEdit(customer) {
    setError(""); setNotice("");
    try { setForm(await adminService.getCustomer(customer.id)); setEditingId(customer.id); setDialogOpen(true); }
    catch (reason) { setError(responseError(reason)); }
  }
  async function remove(customer) {
    if (!window.confirm(`Xóa tài khoản “${customer.fullName}”?`)) return;
    try { await adminService.deleteCustomer(customer.id); setNotice(`Đã xóa “${customer.fullName}”.`); await reload(); }
    catch (reason) { setError(responseError(reason)); }
  }
  async function save(event) {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    try {
      const body = Object.fromEntries(Object.entries(form).map(([key, value]) => [key, String(value || "").trim()]));
      if (Object.values(body).some(value => !value)) throw new Error("Vui lòng nhập đầy đủ thông tin.");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) throw new Error("Email chưa hợp lệ.");
      if (editingId) await adminService.updateCustomer(editingId, body);
      else await adminService.createCustomer(body);
      setDialogOpen(false); setNotice(editingId ? "Đã cập nhật tài khoản." : "Đã thêm tài khoản."); await reload();
    } catch (reason) { setError(reason?.response ? responseError(reason) : reason.message); }
    finally { setBusy(false); }
  }

  return <div className="admin-page">
    <div className="admin-page__heading"><div><p className="eyebrow">QUẢN TRỊ / NGƯỜI DÙNG</p><h1>Tài khoản</h1><p>Quản lý hồ sơ người dùng trong hệ thống.</p></div><button className="button button--primary" type="button" onClick={openCreate}>Thêm tài khoản <span aria-hidden="true">+</span></button></div>
    {notice && <p className="inline-notice" role="status">{notice}</p>}{error && !dialogOpen && <p className="form-message form-message--error" role="alert">{error}</p>}
    <div className="admin-toolbar"><label className="admin-search"><span className="sr-only">Tìm tài khoản</span><svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="10.8" cy="10.8" r="6.4"/><path d="m16 16 4 4"/></svg><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Tìm theo tên, email hoặc số điện thoại" /></label><span>{filtered.length} / {customers.length} tài khoản</span></div>
    {loading ? <LoadingState label="Đang tải tài khoản…" /> : error && !customers.length ? <ErrorState message={error} onRetry={reload} /> : filtered.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Họ tên</th><th>Email</th><th>Điện thoại</th><th>Địa chỉ</th><th>Thao tác</th></tr></thead><tbody>{filtered.map(customer => <tr key={customer.id}><td data-label="Họ tên"><strong>{customer.fullName}</strong></td><td data-label="Email">{customer.email}</td><td data-label="Điện thoại">{customer.phone}</td><td data-label="Địa chỉ">{customer.address}</td><td data-label="Thao tác"><div className="table-actions"><button type="button" onClick={() => openEdit(customer)}>Sửa</button><button className="button-text--danger" type="button" onClick={() => remove(customer)}>Xóa</button></div></td></tr>)}</tbody></table></div> : <EmptyState title="Không có tài khoản phù hợp" detail="Kiểm tra từ khóa hoặc thêm tài khoản mới." />}
    {dialogOpen && <div className="modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setDialogOpen(false); }}><section className="form-dialog" role="dialog" aria-modal="true" aria-labelledby="customer-dialog-title"><div className="form-dialog__heading"><div><p className="section-heading__overline">NGƯỜI DÙNG</p><h2 id="customer-dialog-title">{editingId ? "Chỉnh sửa tài khoản" : "Thêm tài khoản"}</h2></div><button className="icon-button" type="button" aria-label="Đóng" onClick={() => setDialogOpen(false)}>×</button></div><form className="stack-form" onSubmit={save}><label>Họ tên<input value={form.fullName || ""} onChange={event => setForm({ ...form, fullName: event.target.value })} required maxLength="120" /></label><label>Email<input type="email" value={form.email || ""} onChange={event => setForm({ ...form, email: event.target.value })} required maxLength="200" /></label><label>Số điện thoại<input value={form.phone || ""} onChange={event => setForm({ ...form, phone: event.target.value })} required maxLength="30" /></label><label>Địa chỉ<textarea value={form.address || ""} onChange={event => setForm({ ...form, address: event.target.value })} required rows="3" maxLength="300" /></label>{error && <p className="form-message form-message--error" role="alert">{error}</p>}<div className="form-actions"><button className="button button--primary" type="submit" disabled={busy}>{busy ? "Đang lưu…" : "Lưu tài khoản"}</button><button className="button button--outline" type="button" onClick={() => setDialogOpen(false)}>Hủy</button></div></form></section></div>}
  </div>;
}
