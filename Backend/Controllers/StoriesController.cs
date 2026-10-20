using CustomerManagement.API.Data;
using CustomerManagement.API.DTOs;
using CustomerManagement.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CustomerManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StoriesController(ApplicationDbContext context) : ControllerBase
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
            query = query.Where(story => context.Genres.Any(genre => genre.Id == genreId && genre.Name == story.Genre));

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
                story.Id, story.Title, story.Author, story.Genre, story.Description,
                story.Status, story.CoverTheme, story.PublishedAt,
                CoverUrl = (string?)null,
                AccessType = "Free",
                ChapterCount = story.Chapters.Count(chapter => chapter.PublishAt <= DateTime.UtcNow),
                ViewCount = story.Chapters.Sum(chapter => (int?)chapter.ViewCount) ?? 0,
                Genres = context.Genres.Where(genre => genre.Name == story.Genre)
                    .Select(genre => new { genre.Id, genre.Name }).ToList(),
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
        var story = await context.Stories.AsNoTracking()
            .Where(item => item.Id == id)
            .Select(item => new
            {
                item.Id, item.Title, item.Author, item.Genre, item.Description,
                item.Status, item.CoverTheme, item.PublishedAt,
                CoverUrl = (string?)null,
                AccessType = "Free",
                Price = 0,
                FreeChapterCount = item.Chapters.Count,
                ChapterCount = item.Chapters.Count(chapter => includeUnpublished || chapter.PublishAt <= now),
                ViewCount = item.Chapters.Sum(chapter => (int?)chapter.ViewCount) ?? 0,
                Genres = context.Genres.Where(genre => genre.Name == item.Genre)
                    .Select(genre => new { genre.Id, genre.Name }).ToList(),
                Chapters = item.Chapters
                    .Where(chapter => includeUnpublished || chapter.PublishAt <= now)
                    .OrderBy(chapter => chapter.Number)
                    .Select(chapter => new
                    {
                        chapter.Id,
                        chapter.Number,
                        chapter.Title,
                        chapter.IsFree,
                        HasContent = chapter.Content != "",
                        IsPublished = chapter.PublishAt <= now,
                        chapter.PublishAt
                    }).ToList(),
                CreatedAt = item.PublishedAt,
                item.UpdatedAt
            })
            .SingleOrDefaultAsync(cancellationToken);
        return story is null ? NotFound(new { message = "Không tìm thấy truyện." }) : Ok(story);
    }

    [HttpGet("{id:int}/chapters")]
    public async Task<IActionResult> GetChapters(int id, CancellationToken cancellationToken)
    {
        if (!await context.Stories.AsNoTracking().AnyAsync(story => story.Id == id, cancellationToken))
            return NotFound(new { message = "Không tìm thấy truyện." });

        var chapters = await context.Chapters.AsNoTracking()
            .Where(chapter => chapter.StoryId == id)
            .OrderBy(chapter => chapter.Number)
            .Select(chapter => new
            {
                chapter.Id,
                chapter.Number,
                chapter.Title,
                chapter.IsFree,
                HasContent = chapter.Content != "",
                IsPublished = chapter.PublishAt <= DateTime.UtcNow,
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
            .Include(item => item.Story)
            .SingleOrDefaultAsync(item => item.StoryId == storyId && item.Number == number
                && (includeUnpublished || item.PublishAt <= now), cancellationToken);
        if (chapter is null) return NotFound(new { message = "Không tìm thấy chương hoặc chương chưa phát hành." });
        if (string.IsNullOrWhiteSpace(chapter.Content))
            return Conflict(new { message = "Chương này chưa có nội dung. Quản trị viên cần bổ sung trước khi đọc." });

        var previous = await context.Chapters.AsNoTracking()
            .Where(item => item.StoryId == storyId && item.Number < number && (includeUnpublished || item.PublishAt <= now))
            .MaxAsync(item => (int?)item.Number, cancellationToken);
        var next = await context.Chapters.AsNoTracking()
            .Where(item => item.StoryId == storyId && item.Number > number && (includeUnpublished || item.PublishAt <= now))
            .MinAsync(item => (int?)item.Number, cancellationToken);

        chapter.ViewCount++;
        await context.SaveChangesAsync(cancellationToken);
        return Ok(new
        {
            chapter.Id,
            chapter.StoryId,
            StoryTitle = chapter.Story.Title,
            chapter.Number,
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
        var story = new Story();
        ApplyStory(story, request);
        await EnsureGenreAsync(story.Genre, cancellationToken);
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
        ApplyStory(story, request);
        story.UpdatedAt = DateTime.UtcNow;
        await EnsureGenreAsync(story.Genre, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var story = await context.Stories.FindAsync([id], cancellationToken);
        if (story is null) return NotFound(new { message = "Không tìm thấy truyện." });
        context.Stories.Remove(story);
        await context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("{id:int}/chapters")]
    public async Task<IActionResult> CreateChapter(int id, UpsertChapterRequest request, CancellationToken cancellationToken)
    {
        if (!await context.Stories.AnyAsync(story => story.Id == id, cancellationToken))
            return NotFound(new { message = "Không tìm thấy truyện." });
        if (await ChapterNumberExists(id, request.Number, null, cancellationToken))
            return Conflict(new { message = "Số chương đã tồn tại trong truyện này." });

        var chapter = new Chapter
        {
            StoryId = id,
            Number = request.Number,
            Title = request.Title.Trim(),
            Content = request.Content.Trim(),
            IsFree = request.IsFree,
            PublishAt = request.PublishAt?.ToUniversalTime() ?? DateTime.UtcNow
        };
        context.Chapters.Add(chapter);
        try
        {
            await context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            if (await ChapterNumberExists(id, request.Number, null, cancellationToken))
                return Conflict(new { message = "Số chương đã tồn tại trong truyện này." });
            throw;
        }
        return CreatedAtAction(nameof(GetChapters), new { id }, new { chapter.Id, chapter.Number, chapter.Title });
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id:int}/chapters/{chapterId:int}")]
    public async Task<IActionResult> UpdateChapter(int id, int chapterId, UpsertChapterRequest request, CancellationToken cancellationToken)
    {
        var chapter = await context.Chapters.SingleOrDefaultAsync(item => item.Id == chapterId && item.StoryId == id, cancellationToken);
        if (chapter is null) return NotFound(new { message = "Không tìm thấy chương." });
        if (await ChapterNumberExists(id, request.Number, chapterId, cancellationToken))
            return Conflict(new { message = "Số chương đã tồn tại trong truyện này." });

        chapter.Number = request.Number;
        chapter.Title = request.Title.Trim();
        chapter.Content = request.Content.Trim();
        chapter.IsFree = request.IsFree;
        chapter.PublishAt = request.PublishAt?.ToUniversalTime() ?? DateTime.UtcNow;
        try
        {
            await context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            if (await ChapterNumberExists(id, request.Number, chapterId, cancellationToken))
                return Conflict(new { message = "Số chương đã tồn tại trong truyện này." });
            throw;
        }
        return NoContent();
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:int}/chapters/{chapterId:int}")]
    public async Task<IActionResult> DeleteChapter(int id, int chapterId, CancellationToken cancellationToken)
    {
        var chapter = await context.Chapters.SingleOrDefaultAsync(item => item.Id == chapterId && item.StoryId == id, cancellationToken);
        if (chapter is null) return NotFound(new { message = "Không tìm thấy chương." });
        context.Chapters.Remove(chapter);
        await context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    private static void ApplyStory(Story story, UpsertStoryRequest request)
    {
        story.Title = request.Title.Trim();
        story.Author = request.Author.Trim();
        story.Genre = request.Genre.Trim();
        story.Description = request.Description.Trim();
        story.Status = request.Status;
        story.CoverTheme = request.CoverTheme;
    }

    private async Task EnsureGenreAsync(string name, CancellationToken cancellationToken)
    {
        var normalized = name.Trim();
        if (!await context.Genres.AnyAsync(genre => genre.Name == normalized, cancellationToken))
            context.Genres.Add(new Genre { Name = normalized });
    }

    private Task<bool> ChapterNumberExists(int storyId, int number, int? exceptId, CancellationToken cancellationToken) =>
        context.Chapters.AsNoTracking().AnyAsync(chapter => chapter.StoryId == storyId && chapter.Number == number && chapter.Id != exceptId, cancellationToken);
}
