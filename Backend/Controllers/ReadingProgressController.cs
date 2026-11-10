using System.Security.Claims;
using CustomerManagement.API.Data;
using CustomerManagement.API.DTOs;
using CustomerManagement.API.Models;
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

    [HttpPost("sync")]
    public async Task<IActionResult> SyncOfflineProgress(ReadingProgressSyncRequest request, CancellationToken cancellationToken)
    {
        if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId)) return Unauthorized();
        var events = request.Events;
        if (events is null) return BadRequest(new { message = "Danh sÃ¡ch sá»± kiá»‡n Ä‘á»c khÃ´ng há»£p lá»‡." });
        if (events.Count > 100) return BadRequest(new { message = "Má»—i láº§n chá»‰ Ä‘á»“ng bá»™ tá»‘i Ä‘a 100 sá»± kiá»‡n." });

        var uniqueEvents = events.GroupBy(item => item.ClientEventId).Select(group => group.First()).ToList();
        var rejected = new List<object>();
        var valid = new List<OfflineReadEventRequest>();
        var now = DateTime.UtcNow;
        foreach (var item in uniqueEvents)
        {
            if (item.ClientEventId == Guid.Empty || item.StoryId < 1 || item.ChapterNumber < 1 || NormalizeUtc(item.ViewedAt) > now.AddMinutes(5))
                rejected.Add(new { clientEventId = item.ClientEventId, reason = "Sá»± kiá»‡n Ä‘á»c thiáº¿u thÃ´ng tin há»£p lá»‡." });
            else valid.Add(item);
        }

        var eventIds = valid.Select(item => item.ClientEventId).ToArray();
        var alreadySynced = eventIds.Length == 0
            ? new List<Guid>()
            : await context.ReadEvents.AsNoTracking()
                .Where(item => item.UserId == userId && item.ClientEventId.HasValue && eventIds.Contains(item.ClientEventId.Value))
                .Select(item => item.ClientEventId!.Value)
                .ToListAsync(cancellationToken);

        var alreadySyncedIds = alreadySynced.ToHashSet();
        var pending = valid.Where(item => !alreadySyncedIds.Contains(item.ClientEventId)).ToList();
        var storyIds = pending.Select(item => item.StoryId).Distinct().ToArray();
        var chapterNumbers = pending.Select(item => item.ChapterNumber).Distinct().ToArray();
        var earliestRead = pending.Count == 0 ? now : pending.Min(item =>
        {
            var viewedAt = NormalizeUtc(item.ViewedAt);
            return viewedAt > now ? now : viewedAt;
        });
        var chapters = pending.Count == 0
            ? new List<Chapter>()
            : await context.Chapters
                .Include(chapter => chapter.Story).ThenInclude(story => story.StoryGenres)
                .Include(chapter => chapter.StoryChapter)
                .Where(chapter => storyIds.Contains(chapter.StoryId) && chapterNumbers.Contains(chapter.Number)
                    && chapter.PublishAt <= now && chapter.Content.Trim() != "")
                .ToListAsync(cancellationToken);
        var chaptersByKey = chapters.ToDictionary(chapter => (chapter.StoryId, chapter.Number));
        var purchases = pending.Count == 0
            ? new List<StoryPurchase>()
            : await context.StoryPurchases.AsNoTracking()
                .Where(item => item.UserId == userId && storyIds.Contains(item.StoryId) && item.PurchasedAt <= now)
                .ToListAsync(cancellationToken);
        var subscriptions = pending.Count == 0
            ? new List<UserSubscription>()
            : await context.UserSubscriptions.AsNoTracking()
                .Include(item => item.Plan).ThenInclude(plan => plan.PlanStories)
                .Include(item => item.Plan).ThenInclude(plan => plan.PlanGenres)
                .Where(item => item.UserId == userId && item.Status == "Active"
                    && item.StartsAt <= now && item.EndsAt > earliestRead)
                .ToListAsync(cancellationToken);
        var syncedIds = new List<Guid>(alreadySynced);

        foreach (var item in pending)
        {
            if (!chaptersByKey.TryGetValue((item.StoryId, item.ChapterNumber), out var chapter))
            {
                rejected.Add(new { clientEventId = item.ClientEventId, reason = "Táº­p khÃ´ng tá»“n táº¡i hoáº·c chÆ°a phÃ¡t hÃ nh." });
                continue;
            }

            var viewedAt = NormalizeUtc(item.ViewedAt);
            if (viewedAt > now) viewedAt = now;
            if (!User.IsInRole("Admin") && !HasReadEntitlement(userId, chapter, viewedAt, purchases, subscriptions))
            {
                rejected.Add(new { clientEventId = item.ClientEventId, reason = "Tài khoản chưa có quyền đọc Tập tại thời điểm đã lưu." });
                continue;
            }
            context.ReadEvents.Add(new ReadEvent
            {
                UserId = userId,
                StoryId = chapter.StoryId,
                ChapterId = chapter.Id,
                ViewedAt = viewedAt,
                ClientEventId = item.ClientEventId
            });
            chapter.ViewCount++;
            syncedIds.Add(item.ClientEventId);
        }

        await context.SaveChangesAsync(cancellationToken);
        return Ok(new { syncedEventIds = syncedIds, rejected, syncedCount = syncedIds.Count, rejectedCount = rejected.Count });
    }

    private static bool HasReadEntitlement(
        int userId,
        Chapter chapter,
        DateTime viewedAt,
        IReadOnlyCollection<StoryPurchase> purchases,
        IReadOnlyCollection<UserSubscription> subscriptions)
    {
        var story = chapter.Story;
        var isFree = story.AccessType == "Free"
            || (story.AccessType == "Mixed" && (chapter.StoryChapter.Number <= story.FreeChapterCount || chapter.IsFree));
        if (isFree) return true;
        if (purchases.Any(item => item.StoryId == story.Id && item.PurchasedAt <= viewedAt)) return true;

        var genreIds = story.StoryGenres.Select(item => item.GenreId).ToHashSet();
        return subscriptions.Any(subscription =>
        {
            if (subscription.UserId != userId || subscription.StartsAt > viewedAt || subscription.EndsAt <= viewedAt) return false;
            var plan = subscription.Plan;
            return plan.AccessScope == "AllStories"
                || (plan.AccessScope == "SelectedStories" && plan.PlanStories.Any(link => link.StoryId == story.Id))
                || (plan.AccessScope == "SelectedGenres" && plan.PlanGenres.Any(link => genreIds.Contains(link.GenreId)));
        });
    }

    private static DateTime NormalizeUtc(DateTime value) => value.Kind switch
    {
        DateTimeKind.Utc => value,
        DateTimeKind.Local => value.ToUniversalTime(),
        _ => DateTime.SpecifyKind(value, DateTimeKind.Utc)
    };
}
