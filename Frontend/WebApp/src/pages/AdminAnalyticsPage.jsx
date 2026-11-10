import { useEffect, useMemo, useState } from "react";
import { adminService } from "../services/adminService.js";
import { responseError } from "../api/http.js";
import { ErrorState, LoadingState } from "../components/StatePanel.jsx";

function dateValue(date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

function initialRange() {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - 29);
  return { from: dateValue(from), to: dateValue(to) };
}

function utcStart(date) { return new Date(`${date}T00:00:00`).toISOString(); }
function utcEndExclusive(date) {
  const end = new Date(`${date}T00:00:00`);
  end.setDate(end.getDate() + 1);
  return end.toISOString();
}

const number = new Intl.NumberFormat("vi-VN");
const money = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });

function Metric({ label, value, detail, tone = "" }) {
  return <article className={`analytics-metric${tone ? ` analytics-metric--${tone}` : ""}`}>
    <span>{label}</span><strong>{number.format(value ?? 0)}</strong>{detail && <small>{detail}</small>}
  </article>;
}

function LineChart({ items, valueKey, format = value => number.format(value), label = "Biểu đồ" }) {
  const width = 720, height = 210, left = 46, right = 14, top = 18, bottom = 38;
  const chartWidth = width - left - right;
  const chartHeight = height - top - bottom;
  const values = items.map(item => Number(item[valueKey]) || 0);
  const max = Math.max(1, ...values);
  const points = values.map((value, index) => ({
    x: left + (items.length <= 1 ? chartWidth / 2 : (index / (items.length - 1)) * chartWidth),
    y: top + chartHeight - (value / max) * chartHeight,
    value,
    label: items[index].period ?? items[index].date
  }));
  const path = points.map((point, index) => `${index ? "L" : "M"}${point.x},${point.y}`).join(" ");
  const area = points.length ? `${path} L${points.at(-1).x},${top + chartHeight} L${points[0].x},${top + chartHeight} Z` : "";
  const shownLabels = points.length <= 6 ? points : [points[0], points[Math.round((points.length - 1) / 2)], points.at(-1)];

  return <div className="analytics-chart" role="img" aria-label={label}>
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      {[0, 1, 2, 3].map(index => {
        const y = top + (chartHeight / 3) * index;
        const value = max * (1 - index / 3);
        return <g key={index}><line x1={left} x2={width - right} y1={y} y2={y} className="analytics-chart__grid" /><text x={left - 9} y={y + 4} textAnchor="end" className="analytics-chart__scale">{format(value)}</text></g>;
      })}
      {area && <path d={area} className="analytics-chart__area" />}
      {path && <path d={path} className="analytics-chart__line" />}
      {points.map(point => <circle key={point.label} cx={point.x} cy={point.y} r="3.5" className="analytics-chart__dot"><title>{point.label}: {format(point.value)}</title></circle>)}
      {shownLabels.map(point => <text key={point.label} x={point.x} y={height - 8} textAnchor="middle" className="analytics-chart__date">{point.label}</text>)}
    </svg>
  </div>;
}

function Ranking({ title, caption, items, valueLabel, valueFormat = number.format }) {
  return <section className="analytics-panel analytics-ranking">
    <div className="analytics-panel__heading"><div><h2>{title}</h2><p>{caption}</p></div></div>
    {items?.length ? <ol>{items.map((item, index) => <li key={`${item.storyId ?? item.genreId}-${item.title ?? item.name}`}>
      <span className="analytics-ranking__rank">{String(index + 1).padStart(2, "0")}</span>
      <span className="analytics-ranking__name">{item.title ?? item.name}</span>
      <strong>{valueFormat(item.count)} <small>{valueLabel}</small></strong>
    </li>)}</ol> : <p className="analytics-empty">Chưa có dữ liệu trong khoảng này.</p>}
  </section>;
}

function RevenueRanking({ title, caption, total, items }) {
  return <section className="analytics-panel analytics-ranking">
    <div className="analytics-panel__heading"><div><h2>{title}</h2><p>{caption}</p><strong className="analytics-ranking__total">{money.format(total)}</strong></div></div>
    {items?.length ? <ol>{items.map((item, index) => <li key={item.storyId ?? item.name}>
      <span className="analytics-ranking__rank">{String(index + 1).padStart(2, "0")}</span>
      <span className="analytics-ranking__name">{item.title ?? item.name}<small>{number.format(item.count)} giao dịch</small></span>
      <strong>{money.format(item.amount)}</strong>
    </li>)}</ol> : <p className="analytics-empty">Chưa có giao dịch trong khoảng này.</p>}
  </section>;
}

export default function AdminAnalyticsPage() {
  const [range, setRange] = useState(initialRange);
  const [appliedRange, setAppliedRange] = useState(initialRange);
  const [groupBy, setGroupBy] = useState("day");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const params = useMemo(() => ({ from: utcStart(appliedRange.from), to: utcEndExclusive(appliedRange.to) }), [appliedRange]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      adminService.getAnalyticsActivity(params),
      adminService.getAnalyticsRevenue({ ...params, groupBy }),
      adminService.getAnalyticsContent(params)
    ]).then(([activity, revenue, content]) => {
      if (active) { setData({ activity, revenue, content }); setError(""); }
    }).catch(reason => { if (active) setError(responseError(reason)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [params, groupBy, reload]);

  function submit(event) {
    event.preventDefault();
    if (range.from > range.to) { setError("Ngày bắt đầu phải trước hoặc bằng ngày kết thúc."); return; }
    if ((new Date(range.to) - new Date(range.from)) / 86_400_000 > 365) { setError("Khoảng thống kê tối đa là 366 ngày."); return; }
    setError("");
    setAppliedRange({ ...range });
    setReload(value => value + 1);
  }

  return <section className="admin-page analytics-page">
    <div className="admin-page__heading">
      <div><p className="eyebrow">QUẢN TRỊ / BÁO CÁO</p><h1>Số liệu thư viện</h1><p>Hoạt động thành viên, doanh thu và nội dung được quan tâm.</p></div>
      <span className="analytics-period">{range.from} — {range.to}</span>
    </div>

    <form className="read-report-filters" onSubmit={submit}>
      <label>Từ ngày<input type="date" value={range.from} max={range.to} onChange={event => setRange(current => ({ ...current, from: event.target.value }))} required /></label>
      <label>Đến ngày<input type="date" value={range.to} min={range.from} max={dateValue(new Date())} onChange={event => setRange(current => ({ ...current, to: event.target.value }))} required /></label>
      <button className="button button--primary" type="submit">Cập nhật số liệu</button>
      <div className="analytics-grain-toggle" role="group" aria-label="Đơn vị biểu đồ doanh thu">
        <button type="button" className={groupBy === "day" ? "is-active" : ""} onClick={() => setGroupBy("day")}>Ngày</button>
        <button type="button" className={groupBy === "month" ? "is-active" : ""} onClick={() => setGroupBy("month")}>Tháng</button>
      </div>
    </form>

    {error && <p className="form-message form-message--error" role="alert">{error}</p>}
    {loading && !data ? <LoadingState label="Đang tổng hợp số liệu…" /> : null}
    {error && !data ? <ErrorState message={error} onRetry={() => setReload(value => value + 1)} /> : null}
    {data && <div className="analytics-content" aria-live="polite">
      <div className="analytics-section-label"><span>THÀNH VIÊN & GIAO DỊCH</span><i /></div>
      <div className="analytics-metric-grid">
        <Metric label="Thành viên mới" value={data.activity.summary.registeredMembers} detail="Tài khoản độc giả tạo trong kỳ" />
        <Metric label="Đăng ký gói" value={data.activity.summary.planRegistrations} detail="Lần mua gói đầu tiên thành công" />
        <Metric label="Gia hạn gói" value={data.activity.summary.renewals} detail="Giao dịch gói có lịch sử trước đó" />
        <Metric label="Mua truyện" value={data.activity.summary.storyPurchases} detail="Giao dịch truyện thành công" />
        <Metric label="Gói còn hiệu lực" value={data.activity.summary.activeSubscriptionsAtEnd} detail="Tại thời điểm kết thúc kỳ" />
        <Metric label="Giao dịch thành công" value={data.activity.summary.transactions.successful} detail="Thanh toán được xác nhận" tone="success" />
        <Metric label="Đang chờ xử lý" value={data.activity.summary.transactions.pending} detail="Chưa có trạng thái kết thúc" tone="quiet" />
        <Metric label="Giao dịch thất bại" value={data.activity.summary.transactions.failed} detail="Không được tính vào doanh thu" tone="quiet" />
      </div>

      <div className="analytics-primary-grid">
        <section className="analytics-panel"><div className="analytics-panel__heading"><div><h2>Độc giả mới</h2><p>Số tài khoản đăng ký theo ngày</p></div></div><LineChart items={data.activity.daily} valueKey="newMembers" label="Số thành viên mới theo ngày" /></section>
        <section className="analytics-panel"><div className="analytics-panel__heading"><div><h2>Doanh thu</h2><p>{money.format(data.revenue.totalRevenue)} · {number.format(data.revenue.successfulTransactions)} giao dịch thành công</p></div></div><LineChart items={data.revenue.series} valueKey="amount" format={value => money.format(value)} label="Doanh thu theo thời gian" /></section>
      </div>

      <div className="analytics-secondary-grid">
        <RevenueRanking title="Doanh thu theo gói" caption="Giao dịch thành công" total={data.revenue.planRevenue} items={data.revenue.byPlan} />
        <RevenueRanking title="Doanh thu theo truyện" caption="10 truyện có doanh thu cao nhất" total={data.revenue.storyRevenue} items={data.revenue.topPurchasedStories} />
        <Ranking title="Thể loại độc giả theo dõi" caption="Mức quan tâm tính từ lượt theo dõi truyện" items={data.content.favoriteGenres} valueLabel="lượt" />
      </div>

      <div className="analytics-section-label"><span>NỘI DUNG TRONG KỲ</span><i /></div>
      <div className="analytics-ranking-grid">
        <Ranking title="Được đọc nhiều" caption="Lượt mở tập truyện" items={data.content.mostRead} valueLabel="lượt đọc" />
        <Ranking title="Được theo dõi nhiều" caption="Lượt theo dõi còn trong thư viện" items={data.content.mostFollowed} valueLabel="theo dõi" />
        <Ranking title="Được mua nhiều" caption="Giao dịch mua truyện thành công" items={data.content.mostPurchased} valueLabel="lượt mua" />
      </div>
    </div>}
    {loading && data && <p className="analytics-refreshing" role="status">Đang cập nhật số liệu…</p>}
  </section>;
}
