import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { responseError } from "../api/http.js";
import { useAuth } from "../context/AuthContext.jsx";
import { communityService } from "../services/communityService.js";
import { formatDate } from "../utils/format.js";

function discussionError(reason) {
  const status = reason?.response?.status;
  const serverMessage = reason?.response?.data?.message;
  if (serverMessage) return serverMessage;
  if (status === 404) return "API thảo luận chưa có trong backend đang chạy. Hãy cập nhật và khởi động lại Backend Sprint 4.";
  if (status >= 500) return "Máy chủ chưa xử lý được thảo luận. Kiểm tra migration Sprint 4 đã được áp dụng cho database chưa.";
  return responseError(reason);
}

function initials(name = "Độc giả") {
  return name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join("").toLocaleUpperCase("vi-VN");
}

function CommentSkeleton() {
  return <div className="reader-discussion__skeleton" aria-label="Đang tải bình luận" aria-busy="true">
    {[0, 1, 2].map(item => <div className="reader-discussion__skeleton-row" key={item}><span /><div><i /><i /></div></div>)}
  </div>;
}

export default function ChapterDiscussion({ storyChapterId, chapterTitle, chapterNumber }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [content, setContent] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [reportTarget, setReportTarget] = useState(null);
  const [reportReason, setReportReason] = useState("");
  const [sort, setSort] = useState("oldest");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const composeRef = useRef(null);

  const reload = useCallback(async ({ initial = false } = {}) => {
    if (!storyChapterId) {
      setItems([]);
      setError("Chưa xác định được chương truyện của tập này. Hãy tải lại trang sau khi cập nhật Backend.");
      setLoading(false);
      return;
    }
    if (initial) setLoading(true);
    try {
      const result = await communityService.getComments(storyChapterId);
      setItems(result.items || []);
      setError("");
    } catch (reason) {
      setError(discussionError(reason));
    } finally {
      setLoading(false);
    }
  }, [storyChapterId]);

  useEffect(() => { reload({ initial: true }); }, [reload]);

  const visibleItems = useMemo(() => [...items].sort((a, b) => {
    const direction = sort === "newest" ? -1 : 1;
    return direction * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }), [items, sort]);
  const roots = useMemo(() => visibleItems.filter(item => !item.parentCommentId), [visibleItems]);
  const repliesByParent = useMemo(() => {
    const groups = new Map();
    visibleItems.filter(item => item.parentCommentId).forEach(item => {
      const replies = groups.get(item.parentCommentId) || [];
      replies.push(item);
      groups.set(item.parentCommentId, replies);
    });
    return groups;
  }, [visibleItems]);

  async function submit(event) {
    event.preventDefault();
    if (!user || !content.trim() || busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await communityService.postComment(storyChapterId, { content: content.trim(), parentCommentId: replyTo?.id || null });
      setContent("");
      setReplyTo(null);
      setNotice("Bình luận đã được đăng.");
      await reload();
    } catch (reason) {
      setError(discussionError(reason));
    } finally {
      setBusy(false);
    }
  }

  async function report(event) {
    event.preventDefault();
    if (!reportTarget || !reportReason.trim() || busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await communityService.reportComment(reportTarget.id, reportReason.trim());
      setNotice("Đã gửi báo cáo để quản trị viên xem xét.");
      setReportTarget(null);
      setReportReason("");
    } catch (reason) {
      setError(discussionError(reason));
    } finally {
      setBusy(false);
    }
  }

  function startReply(comment) {
    setReplyTo(comment);
    setReportTarget(null);
    setContent("");
    composeRef.current?.focus();
    composeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function startReport(comment) {
    setReplyTo(null);
    setReportReason("");
    setReportTarget(current => current?.id === comment.id ? null : comment);
  }

  function renderComment(item, isReply = false) {
    const displayName = item.author || "Độc giả";
    const isOwnComment = String(user?.id) === String(item.userId);
    return <article className={`reader-comment${isReply ? " reader-comment--reply" : ""}`} key={item.id}>
      <span className="reader-comment__avatar" aria-hidden="true">{initials(displayName)}</span>
      <div className="reader-comment__body">
        <header className="reader-comment__meta">
          <strong>{displayName}</strong>
          <time dateTime={item.createdAt}>{formatDate(item.createdAt)}</time>
          {item.editedAt && <span>đã chỉnh sửa</span>}
        </header>
        <p className="reader-comment__text">{item.content}</p>
        {!item.isDeleted && !item.isHidden && <div className="reader-comment__actions">
          {!isReply && user && <button type="button" onClick={() => startReply(item)}>Trả lời</button>}
          {user && !isOwnComment && <button type="button" aria-expanded={reportTarget?.id === item.id} onClick={() => startReport(item)}>Báo cáo</button>}
        </div>}
        {reportTarget?.id === item.id && <form className="reader-comment__report" onSubmit={report}>
          <label htmlFor={`report-reason-${item.id}`}>Cho quản trị viên biết lý do bạn báo cáo bình luận này.</label>
          <textarea id={`report-reason-${item.id}`} value={reportReason} onChange={event => setReportReason(event.target.value)} rows="2" maxLength="500" placeholder="Nhập lý do báo cáo" required />
          <div><span>{reportReason.length}/500</span><button className="reader-discussion__text-button" type="button" onClick={() => setReportTarget(null)}>Hủy</button><button className="reader-discussion__send reader-discussion__send--small" type="submit" disabled={busy || !reportReason.trim()}>{busy ? "Đang gửi…" : "Gửi báo cáo"}</button></div>
        </form>}
      </div>
    </article>;
  }

  const author = user?.displayName || user?.username || "Độc giả";

  return <section className="chapter-discussion reader-discussion" aria-labelledby="discussion-title">
    <header className="reader-discussion__header">
      <div>
        <h2 id="discussion-title">Thảo luận</h2>
        <p>{chapterNumber ? `Chương ${chapterNumber}${chapterTitle ? ` · ${chapterTitle}` : ""}` : "Cùng bạn đọc trao đổi về câu chuyện"}</p>
      </div>
      <span className="reader-discussion__count"><strong>{items.length}</strong> bình luận</span>
    </header>

    {notice && <p className="reader-discussion__notice" role="status">{notice}</p>}
    {error && <div className="reader-discussion__error" role="alert"><p>{error}</p><button className="reader-discussion__text-button" type="button" onClick={() => reload({ initial: true })}>Thử lại</button></div>}

    {user ? <form className="reader-discussion__composer" onSubmit={submit}>
      <span className="reader-comment__avatar reader-comment__avatar--current" aria-hidden="true">{initials(author)}</span>
      <div className="reader-discussion__composer-main">
        {replyTo && <div className="reader-discussion__replying"><span>Đang trả lời <strong>{replyTo.author}</strong></span><button className="reader-discussion__text-button" type="button" onClick={() => setReplyTo(null)}>Hủy trả lời</button></div>}
        <label className="sr-only" htmlFor="discussion-compose">Viết bình luận</label>
        <textarea ref={composeRef} id="discussion-compose" value={content} onChange={event => setContent(event.target.value)} placeholder={replyTo ? "Viết câu trả lời của bạn…" : "Bạn nghĩ gì về chương này?"} rows="3" maxLength="2000" required />
        <div className="reader-discussion__composer-footer"><span>{content.length}/2000</span><button className="reader-discussion__send" type="submit" disabled={busy || !content.trim() || !storyChapterId}>{busy ? "Đang gửi…" : replyTo ? "Gửi trả lời" : "Đăng bình luận"}</button></div>
      </div>
    </form> : <div className="reader-discussion__signin"><p>Đọc xong muốn chia sẻ cảm nhận?</p><span>Đăng nhập để tham gia cuộc trò chuyện cùng độc giả khác.</span><Link to="/account">Đăng nhập</Link></div>}

    <div className="reader-discussion__list-heading">
      <h3>Bình luận của độc giả</h3>
      {!loading && items.length > 1 && <label>Hiển thị <select value={sort} onChange={event => setSort(event.target.value)} aria-label="Sắp xếp bình luận"><option value="oldest">Cũ nhất</option><option value="newest">Mới nhất</option></select></label>}
    </div>

    {loading ? <CommentSkeleton /> : roots.length ? <div className="reader-discussion__list">{roots.map(root => <div className="reader-discussion__thread" key={root.id}>
      {renderComment(root)}
      {(repliesByParent.get(root.id) || []).map(reply => renderComment(reply, true))}
    </div>)}</div> : !error && <div className="reader-discussion__empty"><span aria-hidden="true">“ ”</span><p>Chưa có lời bàn nào ở đây.</p><small>Một cảm nhận ngắn cũng có thể làm cuộc đọc vui hơn.</small></div>}
  </section>;
}
