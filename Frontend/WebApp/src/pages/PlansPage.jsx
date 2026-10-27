import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { responseError } from "../api/http.js";
import { useAuth } from "../context/AuthContext.jsx";
import { paymentService } from "../services/paymentService.js";
import { ErrorState, LoadingState } from "../components/StatePanel.jsx";

const money = value => `${Number(value || 0).toLocaleString("vi-VN")} ₫`;

export default function PlansPage() {
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => {
    let active = true;
    paymentService.getPlans().then(data => { if (active) setPlans(data); })
      .catch(reason => { if (active) setError(responseError(reason)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  if (!user) return <Navigate to="/account" replace state={{ from: "/plans" }} />;

  async function subscribe(plan) {
    setBusyId(plan.id); setError(""); setNotice("");
    try {
      const result = await paymentService.subscribe(plan.id, simulateFailure);
      setNotice(result.status === "Success" ? `Đã kích hoạt ${plan.name}. Gói được gia hạn từ ngày hết hạn hiện tại nếu bạn đang còn hạn.` : "Giao dịch mô phỏng thất bại; gói đọc chưa được kích hoạt. Bạn có thể thử lại hoặc xem lịch sử.");
    } catch (reason) { setError(responseError(reason)); }
    finally { setBusyId(null); }
  }

  return <section className="plans-page">
    <div className="page-intro"><p className="eyebrow">GÓI ĐỌC TRUYỆN</p><h1>Đọc tiếp theo cách của bạn</h1><p>Đăng ký hoặc gia hạn để mở truyện theo phạm vi của từng gói.</p></div>
    <aside className="demo-payment-note"><strong>Thanh toán mô phỏng</strong><span>Đây là luồng minh họa của đồ án, không kết nối ngân hàng và không trừ tiền thật.</span><label><input type="checkbox" checked={simulateFailure} onChange={event => setSimulateFailure(event.target.checked)} /> Mô phỏng giao dịch bị từ chối</label></aside>
    {notice && <p className="form-message form-message--success" role="status">{notice} <Link to="/payments">Xem lịch sử</Link></p>}{error && <p className="form-message form-message--error" role="alert">{error}</p>}
    {loading ? <LoadingState label="Đang tải các gói đọc…" /> : error && !plans.length ? <ErrorState message={error} /> : plans.length ? <div className="plan-cards">{plans.map(plan => <article className="plan-card" key={plan.id}><p className="eyebrow">{plan.durationDays} NGÀY TRUY CẬP</p><h2>{plan.name}</h2><strong className="plan-card__price">{money(plan.price)}</strong><p>{plan.accessScope === "AllStories" ? "Truy cập thư viện truyện trả phí." : plan.accessScope === "SelectedGenres" ? `Theo thể loại: ${plan.genreNames.join(", ")}` : `Theo truyện: ${plan.storyTitles.join(", ")}`}</p><button className="button button--primary" type="button" disabled={busyId !== null} onClick={() => subscribe(plan)}>{busyId === plan.id ? "Đang xử lý…" : plan.price > 0 ? "Đăng ký / Gia hạn" : "Kích hoạt gói"}</button></article>)}</div> : <div className="empty-ledger"><h2>Chưa có gói nào đang mở bán</h2><p>Quay lại thư viện để chọn truyện miễn phí.</p><Link to="/" className="button button--outline">Khám phá truyện</Link></div>}
    <p className="plans-page__history">Đã thanh toán trước đó? <Link to="/payments">Xem lịch sử giao dịch →</Link></p>
  </section>;
}
