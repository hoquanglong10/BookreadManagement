using CustomerManagement.API.Data;
using CustomerManagement.API.DTOs;
using CustomerManagement.API.Models;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CustomerManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StoriesController(ApplicationDbContext context, IWebHostEnvironment environment) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? search,
        [FromQuery] string? keyword,
        [FromQuery] int? genreId,
        [FromQuery] string? status,
        [FromQuery] string? sort,
        [FromQuery] int? page,
        [FromQuery] int? pageSize,
        CancellationToken cancellationToken)
    {
        var query = context.Stories.AsNoTracking().AsQueryable();
        var term = keyword ?? search;
        if (!string.IsNullOrWhiteSpace(term))
        {
            term = term.Trim();
            if (term.Length > 200)
                return BadRequest(new { message = "Từ khóa tìm kiếm tối đa 200 ký tự." });
            query = query.Where(story => story.Title.Contains(term) || story.Author.Contains(term));
        }

        if (genreId.HasValue)
            query = query.Where(story => story.StoryGenres.Any(link => link.GenreId == genreId));

        if (!string.IsNullOrWhiteSpace(status))
        {
            var value = status.Trim() switch
            {
                "Ongoing" => "Đang cập nhật",
                "Completed" => "Hoàn thành",
                var other => other
            };
            query = query.Where(story => story.Status == value);
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var requestedPage = Math.Max(1, page ?? 1);
        var requestedPageSize = Math.Clamp(pageSize ?? 24, 1, 100);
        var ordered = (sort ?? "updated").ToLowerInvariant() switch
        {
            "newest" => query.OrderByDescending(story => story.PublishedAt).ThenBy(story => story.Id),
            "views" => query.OrderByDescending(story => story.Chapters.Sum(chapter => (int?)chapter.ViewCount) ?? 0)
                .ThenByDescending(story => story.PublishedAt),
            _ => query.OrderByDescending(story => story.UpdatedAt).ThenBy(story => story.Id)
        };
        var stories = await ordered
            .Skip((requestedPage - 1) * requestedPageSize)
            .Take(requestedPageSize)
            .Select(story => new
            {
                story.Id, story.Title, story.Author,
                Genre = story.StoryGenres.Select(link => link.Genre.Name).FirstOrDefault() ?? story.Genre,
                Genres = story.StoryGenres.Select(link => new { link.Genre.Id, link.Genre.Name }).ToList(),
                story.Description, story.Status, story.CoverTheme, story.CoverUrl, story.AccessType,
                story.Price, story.FreeChapterCount, story.PublishedAt,
                ChapterCount = story.Chapters.Count(chapter => chapter.PublishAt <= DateTime.UtcNow),
                EpisodeCount = story.Chapters.Count(chapter => chapter.PublishAt <= DateTime.UtcNow),
                StoryChapterCount = story.StoryChapters.Count(chapter => chapter.Episodes.Any(episode => episode.PublishAt <= DateTime.UtcNow)),
                ViewCount = story.Chapters.Sum(chapter => (int?)chapter.ViewCount) ?? 0,
                CreatedAt = story.PublishedAt,
                story.UpdatedAt
            })
            .ToListAsync(cancellationToken);

        if (page.HasValue || pageSize.HasValue || genreId.HasValue || status is not null || sort is not null || keyword is not null)
            return Ok(new
            {
                Items = stories,
                Page = requestedPage,
                PageSize = requestedPageSize,
                TotalCount = totalCount,
                TotalPages = (int)Math.Ceiling(totalCount / (double)requestedPageSize)
            });

        return Ok(stories);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
    {
        var includeUnpublished = User.IsInRole("Admin");
        var now = DateTime.UtcNow;
        var userId = GetCurrentUserId();
        var story = await context.Stories.AsNoTracking()
            .Include(item => item.StoryGenres).ThenInclude(link => link.Genre)
            .Include(item => item.Chapters.Where(chapter => includeUnpublished || (chapter.PublishAt <= now && !string.IsNullOrWhiteSpace(chapter.Content)))).ThenInclude(chapter => chapter.StoryChapter)
            .SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (story is null) return NotFound(new { message = "Không tìm thấy truyện." });
        var readChapterIds = userId.HasValue
            ? (await context.ReadEvents.AsNoTracking()
                .Where(readEvent => readEvent.UserId == userId.Value && readEvent.StoryId == id)
                .Select(readEvent => readEvent.ChapterId)
                .Distinct()
                .ToListAsync(cancellationToken)).ToHashSet()
            : new HashSet<int>();
        var lastReadChapterId = userId.HasValue
            ? await context.ReadEvents.AsNoTracking()
                .Where(readEvent => readEvent.UserId == userId.Value && readEvent.StoryId == id)
                .OrderByDescending(readEvent => readEvent.ViewedAt)
                .ThenByDescending(readEvent => readEvent.Id)
                .Select(readEvent => (int?)readEvent.ChapterId)
                .FirstOrDefaultAsync(cancellationToken)
            : null;
        var lastReadNumber = lastReadChapterId.HasValue
            ? story.Chapters.Where(chapter => chapter.Id == lastReadChapterId.Value).Select(chapter => (int?)chapter.Number).FirstOrDefault()
            : null;
        var hasPurchase = userId.HasValue && await HasStoryPurchaseAsync(userId.Value, id, cancellationToken);
        var hasPlanAccess = userId.HasValue && await HasPlanAccessAsync(userId.Value, story, cancellationToken);
        var chapters = story.Chapters.OrderBy(chapter => chapter.StoryChapter.Number)
            .ThenBy(chapter => chapter.EpisodeNumber)
            .Select(chapter =>
        {
            var isFree = IsChapterFree(story, chapter);
            var canRead = includeUnpublished || isFree || hasPurchase || hasPlanAccess;
            return new
            {
                chapter.Id, chapter.Number, chapter.Title,
                StoryChapterId = chapter.StoryChapterId,
                StoryChapterNumber = chapter.StoryChapter.Number,
                StoryChapterTitle = chapter.StoryChapter.Title,
                chapter.EpisodeNumber,
                IsRead = readChapterIds.Contains(chapter.Id),
                IsFree = isFree, CanRead = canRead,
                AccessLabel = hasPurchase || hasPlanAccess ? "Đã mở khóa" : isFree ? "Miễn phí" : "Trả phí",
                HasContent = chapter.Content != "", IsPublished = chapter.PublishAt <= now,
                chapter.PublishAt
            };
        }).ToList();
        var result = new
        {
            story.Id, story.Title, story.Author,
            Genre = story.StoryGenres.FirstOrDefault()?.Genre.Name ?? story.Genre,
            Genres = story.StoryGenres.Select(link => new { link.Genre.Id, link.Genre.Name }).ToList(),
            story.Description, story.Status, story.CoverTheme, story.CoverUrl,
            story.AccessType, story.Price, story.FreeChapterCount, story.PublishedAt,
            HasPurchase = hasPurchase, HasPlanAccess = hasPlanAccess,
            LastReadNumber = lastReadNumber,
            ChapterCount = chapters.Count,
            EpisodeCount = chapters.Count,
            StoryChapterCount = chapters.Select(chapter => chapter.StoryChapterId).Distinct().Count(),
            ViewCount = story.Chapters.Sum(chapter => chapter.ViewCount),
            Chapters = chapters,
            StoryChapters = chapters.GroupBy(chapter => new { chapter.StoryChapterId, chapter.StoryChapterNumber, chapter.StoryChapterTitle })
                .OrderBy(group => group.Key.StoryChapterNumber)
                .Select(group => new
                {
                    Id = group.Key.StoryChapterId,
                    Number = group.Key.StoryChapterNumber,
                    Title = group.Key.StoryChapterTitle,
                    Episodes = group.OrderBy(chapter => chapter.EpisodeNumber).ToList()
                }).ToList(),
            CreatedAt = story.PublishedAt, story.UpdatedAt
        };
        return Ok(result);
    }

    [HttpGet("{id:int}/chapters")]
    public async Task<IActionResult> GetChapters(int id, CancellationToken cancellationToken)
    {
        if (!await context.Stories.AsNoTracking().AnyAsync(story => story.Id == id, cancellationToken))
            return NotFound(new { message = "Không tìm thấy truyện." });

        var includeUnpublished = User.IsInRole("Admin");
        var now = DateTime.UtcNow;
        var story = await context.Stories.AsNoTracking().Include(item => item.StoryGenres)
            .ThenInclude(link => link.Genre).SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (story is null) return NotFound(new { message = "Không tìm thấy truyện." });
        var userId = GetCurrentUserId();
        var hasPurchase = userId.HasValue && await HasStoryPurchaseAsync(userId.Value, id, cancellationToken);
        var hasPlanAccess = userId.HasValue && await HasPlanAccessAsync(userId.Value, story, cancellationToken);
        var chapters = await context.Chapters.AsNoTracking()
            .Where(chapter => chapter.StoryId == id && (includeUnpublished || (chapter.PublishAt <= now && !string.IsNullOrWhiteSpace(chapter.Content))))
            .OrderBy(chapter => chapter.StoryChapter.Number).ThenBy(chapter => chapter.EpisodeNumber)
            .Select(chapter => new
            {
                chapter.Id,
                chapter.Number,
                StoryChapterId = chapter.StoryChapterId,
                StoryChapterNumber = chapter.StoryChapter.Number,
                StoryChapterTitle = chapter.StoryChapter.Title,
                chapter.EpisodeNumber,
                chapter.Title,
                IsRead = userId.HasValue && context.ReadEvents.Any(readEvent =>
                    readEvent.UserId == userId.Value && readEvent.StoryId == id && readEvent.ChapterId == chapter.Id),
                IsFree = story.AccessType == "Free" || (story.AccessType == "Mixed" && (chapter.StoryChapter.Number <= story.FreeChapterCount || chapter.IsFree)),
                CanRead = includeUnpublished || hasPurchase || hasPlanAccess || story.AccessType == "Free" || (story.AccessType == "Mixed" && (chapter.StoryChapter.Number <= story.FreeChapterCount || chapter.IsFree)),
                AccessLabel = hasPurchase || hasPlanAccess ? "Đã mở khóa" : (story.AccessType == "Free" || (story.AccessType == "Mixed" && (chapter.StoryChapter.Number <= story.FreeChapterCount || chapter.IsFree))) ? "Miễn phí" : "Trả phí",
                HasContent = chapter.Content != "",
                IsPublished = chapter.PublishAt <= now,
                chapter.PublishAt
            })
            .ToListAsync(cancellationToken);
        return Ok(chapters);
    }

    [HttpGet("{storyId:int}/chapters/{number:int}")]
    public async Task<IActionResult> ReadChapter(int storyId, int number, CancellationToken cancellationToken)
    {
        var includeUnpublished = User.IsInRole("Admin");
        var now = DateTime.UtcNow;
        var chapter = await context.Chapters
            .Include(item => item.Story).ThenInclude(story => story.StoryGenres)
            .Include(item => item.StoryChapter)
            .SingleOrDefaultAsync(item => item.StoryId == storyId && item.Number == number
                && (includeUnpublished || item.PublishAt <= now), cancellationToken);
        if (chapter is null) return NotFound(new { message = "Không tìm thấy chương hoặc chương chưa phát hành." });
        if (string.IsNullOrWhiteSpace(chapter.Content))
            return Conflict(new { message = "Chương này chưa có nội dung. Quản trị viên cần bổ sung trước khi đọc." });
        var userId = GetCurrentUserId();
        var canRead = User.IsInRole("Admin") || IsChapterFree(chapter.Story, chapter);
        if (!canRead && userId.HasValue)
            canRead = await HasStoryPurchaseAsync(userId.Value, storyId, cancellationToken)
                || await HasPlanAccessAsync(userId.Value, chapter.Story, cancellationToken);
        if (!canRead)
            return StatusCode(StatusCodes.Status403Forbidden, new { code = "subscription_required", message = "Chương này cần gói đọc còn hiệu lực hoặc quyền mua truyện." });

        // Navigate in the same Chapter → Episode order shown by the table of contents.
        // Number remains the stable URL key; it is not assumed to be the reading order.
        var previous = await context.Chapters.AsNoTracking()
            .Where(item => item.StoryId == storyId
                && (item.StoryChapter.Number < chapter.StoryChapter.Number
                    || (item.StoryChapter.Number == chapter.StoryChapter.Number && item.EpisodeNumber < chapter.EpisodeNumber))
                && item.Content.Trim() != ""
                && (includeUnpublished || item.PublishAt <= now))
            .OrderByDescending(item => item.StoryChapter.Number).ThenByDescending(item => item.EpisodeNumber)
            .Select(item => (int?)item.Number)
            .FirstOrDefaultAsync(cancellationToken);
        var next = await context.Chapters.AsNoTracking()
            .Where(item => item.StoryId == storyId
                && (item.StoryChapter.Number > chapter.StoryChapter.Number
                    || (item.StoryChapter.Number == chapter.StoryChapter.Number && item.EpisodeNumber > chapter.EpisodeNumber))
                && item.Content.Trim() != ""
                && (includeUnpublished || item.PublishAt <= now))
            .OrderBy(item => item.StoryChapter.Number).ThenBy(item => item.EpisodeNumber)
            .Select(item => (int?)item.Number)
            .FirstOrDefaultAsync(cancellationToken);

        chapter.ViewCount++;
        context.ReadEvents.Add(new ReadEvent { UserId = userId, StoryId = storyId, ChapterId = chapter.Id, ViewedAt = now });
        await context.SaveChangesAsync(cancellationToken);
        return Ok(new
        {
            chapter.Id,
            chapter.StoryId,
            StoryTitle = chapter.Story.Title,
            chapter.Number,
            StoryChapterNumber = chapter.StoryChapter.Number,
            StoryChapterTitle = chapter.StoryChapter.Title,
            chapter.EpisodeNumber,
            chapter.Title,
            chapter.Content,
            chapter.PublishAt,
            PrevNumber = previous,
            NextNumber = next
        });
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<IActionResult> Create(UpsertStoryRequest request, CancellationToken cancellationToken)
    {
        var genres = await ResolveGenresAsync(request, cancellationToken);
        if (genres is null) return BadRequest(new { message = "Chọn ít nhất một thể loại hợp lệ." });
        var story = new Story();
        ApplyStory(story, request, genres);
        SetStoryGenres(story, genres);
        context.Stories.Add(story);
        await context.SaveChangesAsync(cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = story.Id }, new { story.Id });
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, UpsertStoryRequest request, CancellationToken cancellationToken)
    {
        var story = await context.Stories.FindAsync([id], cancellationToken);
        if (story is null) return NotFound(new { message = "Không tìm thấy truyện." });
        await context.Entry(story).Collection(item => item.StoryGenres).LoadAsync(cancellationToken);
        var genres = await ResolveGenresAsync(request, cancellationToken);
        if (genres is null) return BadRequest(new { message = "Chọn ít nhất một thể loại hợp lệ." });
        ApplyStory(story, request, genres);
        SetStoryGenres(story, genres);
        story.UpdatedAt = DateTime.UtcNow;
        await context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var story = await context.Stories.FindAsync([id], cancellationToken);
        if (story is null) return NotFound(new { message = "Không tìm thấy truyện." });
        if (await context.StoryPurchases.AnyAsync(item => item.StoryId == id, cancellationToken)
            || await context.SubscriptionPlanStories.AnyAsync(item => item.StoryId == id, cancellationToken)
            || await context.ReadEvents.AnyAsync(item => item.StoryId == id, cancellationToken))
            return Conflict(new { message = "Truyện đã có lượt đọc hoặc gắn với quyền mua/gói đọc nên không thể xóa. Hãy chuyển truyện sang trạng thái phù hợp." });
        context.Stories.Remove(story);
        await context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("covers")]
    [RequestSizeLimit(5_242_880)]
    public async Task<IActionResult> UploadCover(IFormFile file, CancellationToken cancellationToken)
    {
        if (file.Length is <= 0 or > 5_242_880)
            return BadRequest(new { message = "Ảnh bìa phải có dung lượng tối đa 5 MB." });
        var allowed = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            [".jpg"] = "image/jpeg", [".jpeg"] = "image/jpeg",
            [".png"] = "image/png", [".webp"] = "image/webp"
        };
        var extension = Path.GetExtension(file.FileName);
        if (!allowed.TryGetValue(extension, out var contentType) || !string.Equals(file.ContentType, contentType, StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { message = "Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP." });

        var directory = Path.Combine(environment.ContentRootPath, "wwwroot", "uploads", "covers");
        Directory.CreateDirectory(directory);
        var fileName = $"{Guid.NewGuid():N}{extension.ToLowerInvariant()}";
        var filePath = Path.Combine(directory, fileName);
        await using (var stream = System.IO.File.Create(filePath))
            await file.CopyToAsync(stream, cancellationToken);
        return Ok(new { coverUrl = $"/uploads/covers/{fileName}" });
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("{id:int}/chapters")]
    public async Task<IActionResult> CreateChapter(int id, UpsertChapterRequest request, CancellationToken cancellationToken)
    {
        var story = await context.Stories.SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (story is null) return NotFound(new { message = "Không tìm thấy truyện." });
        var sequence = request.Number ?? (await context.Chapters.Where(item => item.StoryId == id).MaxAsync(item => (int?)item.Number, cancellationToken) ?? 0) + 1;
        if (await ChapterNumberExists(id, sequence, null, cancellationToken))
            return Conflict(new { message = "Số đọc nội bộ đã tồn tại trong truyện này." });

        var storyChapter = await ResolveStoryChapterAsync(id, request, sequence, cancellationToken);
        if (storyChapter is null) return BadRequest(new { message = "Số tập đã tồn tại trong chương này." });

        var chapter = new Chapter
        {
            StoryId = id,
            StoryChapter = storyChapter,
            Number = sequence,
            EpisodeNumber = request.EpisodeNumber,
            Title = request.Title.Trim(),
            Content = request.Content.Trim(),
            IsFree = request.IsFree,
            PublishAt = request.PublishAt?.ToUniversalTime() ?? DateTime.UtcNow
        };
        story.UpdatedAt = DateTime.UtcNow;
        context.Chapters.Add(chapter);
        try
        {
            await context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            if (await ChapterNumberExists(id, sequence, null, cancellationToken))
                return Conflict(new { message = "Số đọc nội bộ đã tồn tại trong truyện này." });
            throw;
        }
        return CreatedAtAction(nameof(GetChapters), new { id }, new { chapter.Id, chapter.Number, chapter.EpisodeNumber, StoryChapterNumber = storyChapter.Number, chapter.Title });
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id:int}/chapters/{chapterId:int}")]
    public async Task<IActionResult> UpdateChapter(int id, int chapterId, UpsertChapterRequest request, CancellationToken cancellationToken)
    {
        var chapter = await context.Chapters.Include(item => item.Story)
            .SingleOrDefaultAsync(item => item.Id == chapterId && item.StoryId == id, cancellationToken);
        if (chapter is null) return NotFound(new { message = "Không tìm thấy chương." });
        var requestedSequence = request.Number ?? chapter.Number;
        if (await ChapterNumberExists(id, requestedSequence, chapterId, cancellationToken))
            return Conflict(new { message = "Số đọc nội bộ đã tồn tại trong truyện này." });
        var storyChapter = await ResolveStoryChapterAsync(id, request, requestedSequence, cancellationToken, chapter.StoryChapterId, chapterId);
        if (storyChapter is null) return Conflict(new { message = "Số tập đã tồn tại trong chương này." });

        chapter.StoryChapter = storyChapter;
        chapter.Number = requestedSequence;
        chapter.EpisodeNumber = request.EpisodeNumber;
        chapter.Title = request.Title.Trim();
        chapter.Content = request.Content.Trim();
        chapter.IsFree = request.IsFree;
        chapter.PublishAt = request.PublishAt?.ToUniversalTime() ?? DateTime.UtcNow;
        chapter.Story.UpdatedAt = DateTime.UtcNow;
        try
        {
            await context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            if (await ChapterNumberExists(id, requestedSequence, chapterId, cancellationToken))
                return Conflict(new { message = "Số đọc nội bộ đã tồn tại trong truyện này." });
            throw;
        }
        return NoContent();
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:int}/chapters/{chapterId:int}")]
    public async Task<IActionResult> DeleteChapter(int id, int chapterId, CancellationToken cancellationToken)
    {
        var chapter = await context.Chapters.Include(item => item.Story)
            .SingleOrDefaultAsync(item => item.Id == chapterId && item.StoryId == id, cancellationToken);
        if (chapter is null) return NotFound(new { message = "Không tìm thấy chương." });
        if (await context.ReadEvents.AnyAsync(item => item.ChapterId == chapterId, cancellationToken))
            return Conflict(new { message = "Chương đã có lượt đọc nên không thể xóa để giữ nguyên thống kê." });
        chapter.Story.UpdatedAt = DateTime.UtcNow;
        context.Chapters.Remove(chapter);
        await context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    private static void ApplyStory(Story story, UpsertStoryRequest request, IReadOnlyList<Genre> genres)
    {
        story.Title = request.Title.Trim();
        story.Author = request.Author.Trim();
        story.Genre = genres[0].Name;
        story.Description = request.Description.Trim();
        story.Status = request.Status;
        story.CoverTheme = request.CoverTheme;
        story.CoverUrl = string.IsNullOrWhiteSpace(request.CoverUrl) ? null : request.CoverUrl.Trim();
        story.AccessType = request.AccessType;
        story.Price = request.Price;
        story.FreeChapterCount = request.AccessType == "Mixed" ? request.FreeChapterCount : 0;
    }

    private static void SetStoryGenres(Story story, IReadOnlyList<Genre> genres)
    {
        var ids = genres.Select(genre => genre.Id).ToHashSet();
        foreach (var removed in story.StoryGenres.Where(link => !ids.Contains(link.GenreId)).ToList())
            story.StoryGenres.Remove(removed);
        foreach (var genre in genres.Where(genre => !story.StoryGenres.Any(link => link.GenreId == genre.Id)))
            story.StoryGenres.Add(new StoryGenre { Story = story, Genre = genre });
    }

    private async Task<List<Genre>?> ResolveGenresAsync(UpsertStoryRequest request, CancellationToken cancellationToken)
    {
        if (request.GenreIds is { Count: > 0 })
        {
            var ids = request.GenreIds.Distinct().ToList();
            var selected = await context.Genres.Where(genre => ids.Contains(genre.Id)).ToListAsync(cancellationToken);
            return selected.Count == ids.Count ? selected.OrderBy(genre => ids.IndexOf(genre.Id)).ToList() : null;
        }

        var name = request.Genre?.Trim();
        if (string.IsNullOrWhiteSpace(name)) return null;
        var existing = await context.Genres.SingleOrDefaultAsync(genre => genre.Name == name, cancellationToken);
        if (existing is not null) return [existing];
        var created = new Genre { Name = name };
        context.Genres.Add(created);
        return [created];
    }

    private static bool IsChapterFree(Story story, Chapter chapter) => story.AccessType switch
    {
        "Free" => true,
        "Mixed" => chapter.StoryChapter.Number <= story.FreeChapterCount || chapter.IsFree,
        _ => false
    };

    private int? GetCurrentUserId() =>
        int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : null;

    private Task<bool> HasStoryPurchaseAsync(int userId, int storyId, CancellationToken cancellationToken) =>
        context.StoryPurchases.AsNoTracking().AnyAsync(purchase => purchase.UserId == userId && purchase.StoryId == storyId, cancellationToken);

    private Task<bool> HasPlanAccessAsync(int userId, Story story, CancellationToken cancellationToken)
    {
        var genreIds = story.StoryGenres.Select(link => link.GenreId).ToArray();
        return context.UserSubscriptions.AsNoTracking().AnyAsync(subscription =>
            subscription.UserId == userId && subscription.Status == "Active"
            && subscription.StartsAt <= DateTime.UtcNow && subscription.EndsAt > DateTime.UtcNow
            && (subscription.Plan.AccessScope == "AllStories"
                || (subscription.Plan.AccessScope == "SelectedStories" && subscription.Plan.PlanStories.Any(link => link.StoryId == story.Id))
                || (subscription.Plan.AccessScope == "SelectedGenres" && subscription.Plan.PlanGenres.Any(link => genreIds.Contains(link.GenreId)))), cancellationToken);
    }

    private Task<bool> ChapterNumberExists(int storyId, int number, int? exceptId, CancellationToken cancellationToken) =>
        context.Chapters.AsNoTracking().AnyAsync(chapter => chapter.StoryId == storyId && chapter.Number == number && chapter.Id != exceptId, cancellationToken);

    private async Task<StoryChapter?> ResolveStoryChapterAsync(int storyId, UpsertChapterRequest request, int legacySequence, CancellationToken cancellationToken, int? currentStoryChapterId = null, int? currentEpisodeId = null)
    {
        var groupNumber = request.StoryChapterNumber;
        if (!groupNumber.HasValue && currentStoryChapterId.HasValue)
            groupNumber = await context.StoryChapters.Where(item => item.Id == currentStoryChapterId.Value).Select(item => (int?)item.Number).SingleOrDefaultAsync(cancellationToken);
        groupNumber ??= legacySequence;
        var groupTitle = string.IsNullOrWhiteSpace(request.StoryChapterTitle) ? $"Chương {groupNumber.Value}" : request.StoryChapterTitle.Trim();
        var group = await context.StoryChapters.SingleOrDefaultAsync(item => item.StoryId == storyId && item.Number == groupNumber.Value, cancellationToken);
        if (group is null)
        {
            group = new StoryChapter { StoryId = storyId, Number = groupNumber.Value, Title = groupTitle };
            context.StoryChapters.Add(group);
        }
        else if (!string.IsNullOrWhiteSpace(request.StoryChapterTitle))
        {
            group.Title = groupTitle;
        }

        var duplicateEpisode = await context.Chapters.AnyAsync(item => item.StoryChapterId == group.Id
            && item.EpisodeNumber == request.EpisodeNumber
            && item.Id != currentEpisodeId, cancellationToken);
        return duplicateEpisode ? null : group;
    }
}
