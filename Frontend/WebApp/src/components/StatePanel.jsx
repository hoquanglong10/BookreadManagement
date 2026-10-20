export function LoadingState({ label = "Đang tải dữ liệu…" }) {
  return <div className="state-panel" role="status"><span className="spinner" aria-hidden="true" />{label}</div>;
}

export function EmptyState({ title = "Chưa có truyện phù hợp", detail = "Thử đổi từ khóa hoặc chọn thể loại khác." }) {
  return <div className="state-panel state-panel--empty"><span className="empty-mark" aria-hidden="true">—</span><strong>{title}</strong><span>{detail}</span></div>;
}

export function ErrorState({ message, onRetry }) {
  return <div className="state-panel state-panel--error" role="alert"><strong>Chưa tải được nội dung</strong><span>{message}</span>{onRetry && <button className="button button--outline" type="button" onClick={onRetry}>Thử lại</button>}</div>;
}
