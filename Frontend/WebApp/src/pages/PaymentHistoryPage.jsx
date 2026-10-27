import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { responseError } from "../api/http.js";
import { useAuth } from "../context/AuthContext.jsx";
import { paymentService } from "../services/paymentService.js";
import { ErrorState, LoadingState } from "../components/StatePanel.jsx";

const money = value => `${Number(value || 0).toLocaleString("vi-VN")} ₫`;
const date = value => value ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "—";
const statusText = item => item.reconciledAt ? "Đã đối soát · đã cấp quyền" : item.status === "Success" ? "Thành công" : item.status === "Failed" ? "Thất bại · chưa cấp quyền" : item.status;

export default function PaymentHistoryPage() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    paymentService.getHistory().then(data => { if (active) setItems(data); })
      .catch(reason => { if (active) setError(responseError(reason)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  if (!user) return <Navigate to="/account" replace state={{ from: "/payments" }} />;
  return <section className="account-ledger">
    <div className="page-intro"><p className="eyebrow">TÀI KHOẢN / GIAO DỊCH</p><h1>Lịch sử thanh toán</h1><p>Mỗi lần mua gói hoặc mở khóa truyện được lưu tại đây.</p></div>
    {loading ? <LoadingState label="Đang tải lịch sử…" /> : error ? <ErrorState message={error} /> : items.length ? <div className="ledger-list">{items.map(item => <article className="ledger-row" key={item.id}><div className="ledger-row__main"><span className={`payment-status payment-status--${item.reconciledAt ? "reconciled" : item.status.toLowerCase()}`}>{statusText(item)}</span><strong>{item.type === "Plan" ? `Gói ${item.planName || "đọc truyện"}` : item.storyTitle || "Mua truyện"}</strong><small>Mã {item.reference} · {date(item.createdAt)}</small>{item.failureReason && <small className="ledger-row__reason">{item.failureReason}</small>}</div><strong className="ledger-row__amount">{money(item.amount)}</strong></article>)}</div> : <div className="empty-ledger"><h2>Chưa có giao dịch</h2><p>Khi bạn đăng ký gói hoặc mua truyện, lịch sử sẽ xuất hiện ở đây.</p><Link className="button button--primary" to="/plans">Xem các gói đọc</Link></div>}
  </section>;
}
