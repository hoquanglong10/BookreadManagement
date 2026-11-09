using System.Security.Claims;
using CustomerManagement.API.Data;
using CustomerManagement.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CustomerManagement.API.Controllers;

[ApiController]
[Authorize]
[Route("api/follows")]
public class FollowsController(ApplicationDbContext context) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Mine(CancellationToken cancellationToken)
    {
        var userId = CurrentUserId();
        if (userId is null) return Unauthorized();
        var items = await context.FollowedStories.AsNoTracking()
            .Where(follow => follow.UserId == userId.Value)
            .OrderByDescending(follow => follow.CreatedAt)
            .Select(follow => new
            {
                follow.StoryId,
                follow.CreatedAt,
                Story = new
                {
                    follow.Story.Id,
                    follow.Story.Title,
                    follow.Story.Author,
                    follow.Story.CoverUrl,
                    follow.Story.CoverTheme,
                    follow.Story.Status,
                    Genre = follow.Story.StoryGenres.Select(link => link.Genre.Name).FirstOrDefault() ?? follow.Story.Genre,
                    ChapterCount = follow.Story.Chapters.Count(chapter => chapter.PublishAt <= DateTime.UtcNow && chapter.Content != "")
                }
            }).ToListAsync(cancellationToken);
        return Ok(new { Items = items });
    }

    [HttpPost("{storyId:int}")]
    public async Task<IActionResult> Follow(int storyId, CancellationToken cancellationToken)
    {
        var userId = CurrentUserId();
        if (userId is null) return Unauthorized();
        if (!await context.Stories.AnyAsync(story => story.Id == storyId, cancellationToken))
            return NotFound(new { message = "Không tìm thấy truyện." });
        if (!await context.FollowedStories.AnyAsync(item => item.UserId == userId && item.StoryId == storyId, cancellationToken))
        {
            context.FollowedStories.Add(new FollowedStory { UserId = userId.Value, StoryId = storyId });
            try { await context.SaveChangesAsync(cancellationToken); }
            catch (DbUpdateException)
            {
                if (!await context.FollowedStories.AnyAsync(item => item.UserId == userId && item.StoryId == storyId, cancellationToken)) throw;
                var duplicate = context.ChangeTracker.Entries<FollowedStory>()
                    .FirstOrDefault(entry => entry.Entity.UserId == userId && entry.Entity.StoryId == storyId);
                if (duplicate is not null) duplicate.State = EntityState.Detached;
            }
        }
        return NoContent();
    }

    [HttpDelete("{storyId:int}")]
    public async Task<IActionResult> Unfollow(int storyId, CancellationToken cancellationToken)
    {
        var userId = CurrentUserId();
        if (userId is null) return Unauthorized();
        await context.FollowedStories.Where(item => item.UserId == userId && item.StoryId == storyId).ExecuteDeleteAsync(cancellationToken);
        return NoContent();
    }

    private int? CurrentUserId() => int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : null;
}

[ApiController]
[Authorize]
[Route("api/notifications")]
public class NotificationsController(ApplicationDbContext context) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Mine([FromQuery] bool unreadOnly = false, CancellationToken cancellationToken = default)
    {
        var userId = CurrentUserId();
        if (userId is null) return Unauthorized();
        await CreateMissingNotifications(userId.Value, cancellationToken);

        var query = context.ReaderNotifications.AsNoTracking().Where(item => item.UserId == userId.Value);
        var unreadCount = await query.CountAsync(item => item.ReadAt == null, cancellationToken);
        if (unreadOnly) query = query.Where(item => item.ReadAt == null);
        var items = await query.OrderByDescending(item => item.CreatedAt).ThenByDescending(item => item.Id)
            .Take(100)
            .Select(item => new
            {
                item.Id,
                item.StoryId,
                StoryTitle = item.Story.Title,
                item.ChapterId,
                ChapterTitle = item.Chapter.Title,
                ChapterNumber = item.Chapter.Number,
                StoryChapterNumber = item.Chapter.StoryChapter.Number,
                StoryChapterTitle = item.Chapter.StoryChapter.Title,
                item.CreatedAt,
                item.ReadAt
            }).ToListAsync(cancellationToken);
        return Ok(new { Items = items, UnreadCount = unreadCount });
    }

    [HttpPut("{id:int}/read")]
    public async Task<IActionResult> MarkRead(int id, CancellationToken cancellationToken)
    {
        var userId = CurrentUserId();
        if (userId is null) return Unauthorized();
        await context.ReaderNotifications.Where(item => item.Id == id && item.UserId == userId.Value && item.ReadAt == null)
            .ExecuteUpdateAsync(setters => setters.SetProperty(item => item.ReadAt, DateTime.UtcNow), cancellationToken);
        return NoContent();
    }

    [HttpPut("read-all")]
    public async Task<IActionResult> MarkAllRead(CancellationToken cancellationToken)
    {
        var userId = CurrentUserId();
        if (userId is null) return Unauthorized();
        await context.ReaderNotifications.Where(item => item.UserId == userId.Value && item.ReadAt == null)
            .ExecuteUpdateAsync(setters => setters.SetProperty(item => item.ReadAt, DateTime.UtcNow), cancellationToken);
        return NoContent();
    }

    private async Task CreateMissingNotifications(int userId, CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var missing = await (
            from follow in context.FollowedStories.AsNoTracking()
            join chapter in context.Chapters.AsNoTracking() on follow.StoryId equals chapter.StoryId
            where follow.UserId == userId && chapter.PublishAt <= now && chapter.Content != ""
                && chapter.PublishAt >= follow.CreatedAt
                && !context.ReaderNotifications.Any(notification => notification.UserId == userId && notification.ChapterId == chapter.Id)
            select new ReaderNotification
            {
                UserId = userId,
                StoryId = follow.StoryId,
                ChapterId = chapter.Id,
                CreatedAt = chapter.PublishAt
            }).Take(500).ToListAsync(cancellationToken);
        if (missing.Count == 0) return;
        context.ReaderNotifications.AddRange(missing);
        try { await context.SaveChangesAsync(cancellationToken); }
        catch (DbUpdateException)
        {
            foreach (var item in missing) context.Entry(item).State = EntityState.Detached;
            var stillMissing = await context.FollowedStories.AnyAsync(follow => follow.UserId == userId, cancellationToken)
                && await context.ReaderNotifications.CountAsync(item => item.UserId == userId && missing.Select(value => value.ChapterId).Contains(item.ChapterId), cancellationToken) < missing.Count;
            if (stillMissing) throw;
        }
    }

    private int? CurrentUserId() => int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : null;
}
