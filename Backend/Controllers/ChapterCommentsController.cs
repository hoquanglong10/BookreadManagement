using System.Security.Claims;
using CustomerManagement.API.Data;
using CustomerManagement.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CustomerManagement.API.Controllers;

[ApiController]
[Route("api")]
public class ChapterCommentsController(ApplicationDbContext context) : ControllerBase
{
    [HttpGet("story-chapters/{storyChapterId:int}/comments")]
    public async Task<IActionResult> Get(int storyChapterId, CancellationToken cancellationToken)
    {
        var isAdmin = User.IsInRole("Admin");
        var exists = await context.StoryChapters.AsNoTracking().AnyAsync(chapter => chapter.Id == storyChapterId
            && (isAdmin || chapter.Episodes.Any(episode => episode.PublishAt <= DateTime.UtcNow && episode.Content != "")), cancellationToken);
        if (!exists) return NotFound(new { message = "Không tìm thấy chương truyện." });

        var comments = await context.ChapterComments.AsNoTracking()
            .Where(item => item.StoryChapterId == storyChapterId && (isAdmin || item.DeletedAt == null))
            .OrderBy(item => item.CreatedAt)
            .Take(500)
            .Select(item => new
            {
                item.Id,
                item.ParentCommentId,
                item.UserId,
                Author = item.User.DisplayName == "" ? item.User.Username : item.User.DisplayName,
                Content = item.DeletedAt != null ? "Bình luận đã bị xóa." : (!isAdmin && item.IsHidden ? "Bình luận đã bị ẩn bởi quản trị viên." : item.Content),
                item.IsHidden,
                IsDeleted = item.DeletedAt != null,
                item.CreatedAt,
                item.EditedAt,
                ReplyCount = item.Replies.Count(reply => isAdmin || reply.DeletedAt == null)
            }).ToListAsync(cancellationToken);
        return Ok(new { Items = comments });
    }

    [Authorize]
    [HttpPost("story-chapters/{storyChapterId:int}/comments")]
    public async Task<IActionResult> Create(int storyChapterId, [FromBody] CreateCommentRequest request, CancellationToken cancellationToken)
    {
        var userId = CurrentUserId();
        if (userId is null) return Unauthorized();
        var chapterExists = await context.StoryChapters.AnyAsync(chapter => chapter.Id == storyChapterId
            && chapter.Episodes.Any(episode => episode.PublishAt <= DateTime.UtcNow && episode.Content != ""), cancellationToken);
        if (!chapterExists) return NotFound(new { message = "Không tìm thấy chương truyện." });
        var content = request.Content?.Trim();
        if (string.IsNullOrWhiteSpace(content) || content.Length > 2000)
            return BadRequest(new { message = "Nội dung bình luận phải có từ 1 đến 2.000 ký tự." });
        if (request.ParentCommentId is int parentId)
        {
            var parent = await context.ChapterComments.AsNoTracking()
                .SingleOrDefaultAsync(item => item.Id == parentId && item.StoryChapterId == storyChapterId && item.ParentCommentId == null && item.DeletedAt == null && !item.IsHidden, cancellationToken);
            if (parent is null) return BadRequest(new { message = "Chỉ có thể trả lời bình luận gốc đang hiển thị trong tập này." });
        }

        var comment = new ChapterComment { StoryChapterId = storyChapterId, UserId = userId.Value, ParentCommentId = request.ParentCommentId, Content = content };
        context.ChapterComments.Add(comment);
        await context.SaveChangesAsync(cancellationToken);
        return Created($"/api/story-chapters/{storyChapterId}/comments", new { comment.Id, comment.ParentCommentId, comment.Content, comment.CreatedAt });
    }

    [Authorize]
    [HttpPost("comments/{commentId:int}/reports")]
    public async Task<IActionResult> Report(int commentId, [FromBody] CreateCommentReportRequest request, CancellationToken cancellationToken)
    {
        var userId = CurrentUserId();
        if (userId is null) return Unauthorized();
        var comment = await context.ChapterComments.AsNoTracking().SingleOrDefaultAsync(item => item.Id == commentId && item.DeletedAt == null && !item.IsHidden, cancellationToken);
        if (comment is null) return NotFound(new { message = "Bình luận không còn khả dụng." });
        if (comment.UserId == userId) return BadRequest(new { message = "Bạn không thể báo cáo bình luận của chính mình." });
        var reason = request.Reason?.Trim();
        if (string.IsNullOrWhiteSpace(reason) || reason.Length > 500)
            return BadRequest(new { message = "Lý do báo cáo phải có từ 1 đến 500 ký tự." });
        if (await context.CommentReports.AnyAsync(item => item.CommentId == commentId && item.ReporterId == userId && item.Status == "Pending", cancellationToken))
            return Conflict(new { message = "Bạn đã gửi báo cáo cho bình luận này; quản trị viên đang xem xét." });
        var report = new CommentReport { CommentId = commentId, ReporterId = userId.Value, Reason = reason };
        context.CommentReports.Add(report);
        await context.SaveChangesAsync(cancellationToken);
        return StatusCode(StatusCodes.Status201Created, new { report.Id, report.Status, report.CreatedAt });
    }

    private int? CurrentUserId() => int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : null;
}

public sealed record CreateCommentRequest(string? Content, int? ParentCommentId);
public sealed record CreateCommentReportRequest(string? Reason);
