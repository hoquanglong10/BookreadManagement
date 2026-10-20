import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return <section className="not-found-page"><p className="eyebrow">KHÔNG TÌM THẤY TRANG</p><h1>Trang này chưa có trong thư viện.</h1><p>Đường dẫn có thể đã thay đổi hoặc không tồn tại.</p><Link className="button button--primary" to="/">Về trang khám phá</Link></section>;
}
