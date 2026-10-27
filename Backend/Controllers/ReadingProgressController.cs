using System.Security.Claims;
using CustomerManagement.API.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CustomerManagement.API.Controllers;

[ApiController]
[Authorize]
[Route("api/reading-progress")]
public class ReadingProgressController(ApplicationDbContext context) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetMine(CancellationToken cancellationToken)
    {
        if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId))
            return Unauthorized();

        var latestEventIds = context.ReadEvents.AsNoTracking()
            .Where(readEvent => readEvent.UserId == userId)
            .GroupBy(readEvent => readEvent.StoryId)
            .Select(events => events
                .OrderByDescending(readEvent => readEvent.ViewedAt)
                .ThenByDescending(readEvent => readEvent.Id)
                .Select(readEvent => readEvent.Id)
                .First());

        var progress = await (
            from readEvent in context.ReadEvents.AsNoTracking()
            join story in context.Stories.AsNoTracking() on readEvent.StoryId equals story.Id
            join episode in context.Chapters.AsNoTracking() on readEvent.ChapterId equals episode.Id
            join storyChapter in context.StoryChapters.AsNoTracking() on episode.StoryChapterId equals storyChapter.Id
            where readEvent.UserId == userId && latestEventIds.Contains(readEvent.Id)
            orderby readEvent.ViewedAt descending, readEvent.Id descending
            select new
            {
                StoryId = story.Id,
                StoryTitle = story.Title,
                story.Author,
                story.Genre,
                story.CoverTheme,
                story.CoverUrl,
                ChapterNumber = episode.Number,
                ChapterTitle = episode.Title,
                StoryChapterNumber = storyChapter.Number,
                StoryChapterTitle = storyChapter.Title,
                episode.EpisodeNumber,
                ReadAt = readEvent.ViewedAt
            })
            .ToListAsync(cancellationToken);

        return Ok(new { Items = progress });
    }
}
