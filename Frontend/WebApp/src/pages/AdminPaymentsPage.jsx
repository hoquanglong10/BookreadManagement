import { useCallback, useEffect, useState } from "react";
import { responseError } from "../api/http.js";
import { paymentService } from "../services/paymentService.js";
import { EmptyState, ErrorState, LoadingState } from "../components/StatePanel.jsx";

const pageSize = 50;
const date = value => value ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : "—";
const status = item => item.reconciledAt ? "Đã cấp quyền bù" : item.status === "Failed" && !item.entitlementGranted ? "Thất bại · chưa cấp quyền" : item.status === "Success" ? "Thành công" : item.status;

export default function AdminPaymentsPage() {
  const [filter, setFilter] = useState("");
  const [items, setItems] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [notice, setNotice] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await paymentService.getAdminPayments({ page, pageSize, status: filter || undefined });
      setItems(result.items || []); setTotalCount(result.totalCount || 0); setError("");
    }
    catch (reason) { setError(responseError(reason)); }
    finally { setLoading(false); }
  }, [filter, page]);
  useEffect(() => { load(); }, [load]);

  async function reconcile(item) {
    const note = window.prompt(`Ghi lý do xác nhận giao dịch ${item.reference} và cấp quyền bù (tối thiểu 8 ký tự):`);
    if (note === null) return;
    if (note.trim().length < 8) { setError("Ghi chú đối soát cần ít nhất 8 ký tự."); return; }
    setBusyId(item.id); setError(""); setNotice("");
    try { await paymentService.reconcile(item.id, note); setNotice(`Đã đối soát ${item.reference} và cấp quyền.`); await load(); }
    catch (reason) { setError(responseError(reason)); }
    finally { setBusyId(null); }
  }

  return <section className="admin-page">
    <div className="admin-page__heading"><div><p className="eyebrow">QUẢN TRỊ / THANH TOÁN</p><h1>Giao dịch & đối soát</h1><p>Xác minh giao dịch mô phỏng và cấp lại quyền khi thanh toán đã được xác nhận.</p></div><span className="admin-page__total">{totalCount} giao dịch</span></div>
    <div className="admin-toolbar"><label>Trạng thái<select value={filter} onChange={event => { setFilter(event.target.value); setPage(1); }}><option value="">Tất cả</option><option value="Success">Thành công</option><option value="Failed">Thất bại</option></select></label><span>Giao dịch thất bại không tự cấp quyền.</span></div>
    {notice && <p className="form-message form-message--success" role="status">{notice}</p>}{error && <p className="form-message form-message--error" role="alert">{error}</p>}
    {loading ? <LoadingState label="Đang tải giao dịch…" /> : error && !items.length ? <ErrorState message={error} onRetry={load} /> : items.length ? <>
      <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Mã / thời gian</th><th>Độc giả</th><th>Nội dung</th><th>Giá trị</th><th>Trạng thái</th><th>Đối soát</th></tr></thead><tbody>{items.map(item => <tr key={item.id}><td data-label="Mã / thời gian"><strong>{item.reference}</strong><span>{date(item.createdAt)}</span></td><td data-label="Độc giả">{item.username}</td><td data-label="Nội dung">{item.type === "Plan" ? `Gói ${item.planName}` : item.storyTitle}</td><td data-label="Giá trị">{Number(item.amount).toLocaleString("vi-VN")} ₫</td><td data-label="Trạng thái"><span className={`payment-status payment-status--${item.reconciledAt ? "reconciled" : item.status.toLowerCase()}`}>{status(item)}</span>{item.failureReason && <small className="ledger-row__reason">{item.failureReason}</small>}</td><td data-label="Đối soát">{item.entitlementGranted ? <span title={item.reconciliationNote || "Quyền đã cấp"}>Đã cấp</span> : <button className="button button--outline button--small" type="button" disabled={busyId !== null} onClick={() => reconcile(item)}>{busyId === item.id ? "Đang lưu…" : "Xác minh & cấp quyền"}</button>}</td></tr>)}</tbody></table></div>
      {totalCount > pageSize && <nav className="catalog-pagination" aria-label="Phân trang giao dịch"><button className="button button--outline" type="button" onClick={() => setPage(value => value - 1)} disabled={page <= 1}>← Trang trước</button><span>Trang {page} / {Math.ceil(totalCount / pageSize)}</span><button className="button button--outline" type="button" onClick={() => setPage(value => value + 1)} disabled={page >= Math.ceil(totalCount / pageSize)}>Trang sau →</button></nav>}
    </> : <EmptyState title="Chưa có giao dịch" detail="Các giao dịch đăng ký và mua truyện sẽ được lưu tại đây." />}
  </section>;
}
