using CustomerManagement.API.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CustomerManagement.API.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/admin/read-events")]
public class ReadReportsController(ApplicationDbContext context) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] DateTime? from, [FromQuery] DateTime? to, CancellationToken cancellationToken)
    {
        var end = to?.ToUniversalTime() ?? DateTime.UtcNow;
        var start = from?.ToUniversalTime() ?? end.AddDays(-30);
        if (start >= end) return BadRequest(new { message = "Thời điểm bắt đầu phải trước thời điểm kết thúc." });
        if (end - start > TimeSpan.FromDays(366)) return BadRequest(new { message = "Khoảng thống kê tối đa 366 ngày." });

        var grouped = await (
            from readEvent in context.ReadEvents.AsNoTracking()
            join story in context.Stories.AsNoTracking() on readEvent.StoryId equals story.Id
            join chapter in context.Chapters.AsNoTracking() on readEvent.ChapterId equals chapter.Id
            join storyChapter in context.StoryChapters.AsNoTracking() on chapter.StoryChapterId equals storyChapter.Id
            where readEvent.ViewedAt >= start && readEvent.ViewedAt < end
            group readEvent by new
            {
                readEvent.StoryId, readEvent.ChapterId, StoryTitle = story.Title,
                StoryChapterNumber = storyChapter.Number, StoryChapterTitle = storyChapter.Title,
                chapter.EpisodeNumber, EpisodeTitle = chapter.Title
            } into events
            select new
            {
                events.Key.StoryId, events.Key.StoryTitle, events.Key.ChapterId,
                events.Key.StoryChapterNumber, events.Key.StoryChapterTitle,
                events.Key.EpisodeNumber, EpisodeTitle = events.Key.EpisodeTitle,
                ViewCount = events.Count(),
                FirstViewedAt = events.Min(item => item.ViewedAt),
                LastViewedAt = events.Max(item => item.ViewedAt)
            })
            .OrderByDescending(item => item.ViewCount)
            .ToListAsync(cancellationToken);
        return Ok(new { From = start, To = end, Items = grouped });
    }
}
