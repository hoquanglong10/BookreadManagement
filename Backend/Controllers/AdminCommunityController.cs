using System.Security.Claims;
using CustomerManagement.API.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CustomerManagement.API.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/admin/community")]
public class AdminCommunityController(ApplicationDbContext context) : ControllerBase
{
    [HttpGet("reports")]
    public async Task<IActionResult> Reports([FromQuery] string status = "Pending", CancellationToken cancellationToken = default)
    {
        var normalized = status.Trim();
        if (normalized is not ("Pending" or "Resolved" or "Dismissed" or "All"))
            return BadRequest(new { message = "Trạng thái báo cáo không hợp lệ." });
        var query = context.CommentReports.AsNoTracking().AsQueryable();
        if (normalized != "All") query = query.Where(item => item.Status == normalized);
        var items = await query.OrderByDescending(item => item.CreatedAt).Take(300)
            .Select(item => new
            {
                item.Id,
                item.CommentId,
                item.Reason,
                item.Status,
                item.CreatedAt,
                item.AdminNote,
                Reporter = item.Reporter.DisplayName == "" ? item.Reporter.Username : item.Reporter.DisplayName,
                Comment = item.Comment.DeletedAt == null ? item.Comment.Content : "Bình luận đã bị xóa.",
                item.Comment.IsHidden,
                ChapterId = item.Comment.StoryChapterId,
                ChapterTitle = item.Comment.StoryChapter.Title,
                ChapterNumber = item.Comment.StoryChapter.Number,
                StoryId = item.Comment.StoryChapter.StoryId,
                StoryTitle = item.Comment.StoryChapter.Story.Title,
                CommentAuthor = item.Comment.User.DisplayName == "" ? item.Comment.User.Username : item.Comment.User.DisplayName
            }).ToListAsync(cancellationToken);
        return Ok(new { Items = items });
    }

    [HttpGet("comments")]
    public async Task<IActionResult> Comments([FromQuery] string? search, [FromQuery] string visibility = "All", CancellationToken cancellationToken = default)
    {
        if (visibility is not ("All" or "Visible" or "Hidden" or "Deleted"))
            return BadRequest(new { message = "Bộ lọc trạng thái bình luận không hợp lệ." });
        var query = context.ChapterComments.AsNoTracking().AsQueryable();
        if (visibility == "Visible") query = query.Where(item => !item.IsHidden && item.DeletedAt == null);
        if (visibility == "Hidden") query = query.Where(item => item.IsHidden && item.DeletedAt == null);
        if (visibility == "Deleted") query = query.Where(item => item.DeletedAt != null);
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(item => item.Content.Contains(term) || item.User.Username.Contains(term) || item.User.DisplayName.Contains(term) || item.StoryChapter.Story.Title.Contains(term));
        }
        var items = await query.OrderByDescending(item => item.CreatedAt).Take(300)
            .Select(item => new
            {
                item.Id,
                item.ParentCommentId,
                Content = item.Content,
                item.IsHidden,
                item.DeletedAt,
                item.CreatedAt,
                Author = item.User.DisplayName == "" ? item.User.Username : item.User.DisplayName,
                ChapterId = item.StoryChapterId,
                ChapterTitle = item.StoryChapter.Title,
                ChapterNumber = item.StoryChapter.Number,
                StoryTitle = item.StoryChapter.Story.Title,
                PendingReports = item.Reports.Count(report => report.Status == "Pending")
            }).ToListAsync(cancellationToken);
        return Ok(new { Items = items });
    }

    [HttpPut("comments/{id:int}/visibility")]
    public async Task<IActionResult> SetVisibility(int id, [FromBody] SetCommentVisibilityRequest request, CancellationToken cancellationToken)
    {
        var comment = await context.ChapterComments.SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (comment is null) return NotFound(new { message = "Không tìm thấy bình luận." });
        if (comment.DeletedAt is not null) return Conflict(new { message = "Bình luận đã bị xóa mềm và không thể hiện lại." });
        comment.IsHidden = request.IsHidden;
        await context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpDelete("comments/{id:int}")]
    public async Task<IActionResult> DeleteComment(int id, CancellationToken cancellationToken)
    {
        var comment = await context.ChapterComments.SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (comment is null) return NotFound(new { message = "Không tìm thấy bình luận." });
        if (comment.DeletedAt is null)
        {
            comment.DeletedAt = DateTime.UtcNow;
            comment.Content = "";
            comment.IsHidden = true;
            await context.SaveChangesAsync(cancellationToken);
        }
        return NoContent();
    }

    [HttpPut("reports/{id:int}")]
    public async Task<IActionResult> ResolveReport(int id, [FromBody] ResolveCommentReportRequest request, CancellationToken cancellationToken)
    {
        if (request.Status is not ("Resolved" or "Dismissed"))
            return BadRequest(new { message = "Chọn xử lý hoặc bỏ qua báo cáo." });
        if (request.AdminNote?.Trim().Length > 500)
            return BadRequest(new { message = "Ghi chú tối đa 500 ký tự." });
        var report = await context.CommentReports.Include(item => item.Comment).SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (report is null) return NotFound(new { message = "Không tìm thấy báo cáo." });
        var adminId = int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var value) ? value : (int?)null;
        if (adminId is null) return Unauthorized();
        report.Status = request.Status;
        report.AdminNote = string.IsNullOrWhiteSpace(request.AdminNote) ? null : request.AdminNote.Trim();
        report.ResolvedByUserId = adminId;
        report.ResolvedAt = DateTime.UtcNow;
        if (request.Status == "Resolved" && request.HideComment && report.Comment.DeletedAt == null)
            report.Comment.IsHidden = true;
        await context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }
}

public sealed record SetCommentVisibilityRequest(bool IsHidden);
public sealed record ResolveCommentReportRequest(string Status, bool HideComment = false, string? AdminNote = null);
