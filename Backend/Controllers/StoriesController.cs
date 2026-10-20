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
    public async Task<IActionResult> GetAll([FromQuery] string? search, CancellationToken cancellationToken)
    {
        var query = context.Stories.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
        {
            var title = search.Trim();
            if (title.Length > 200)
                return BadRequest(new { message = "Từ khóa tìm kiếm tối đa 200 ký tự." });
            query = query.Where(story => story.Title.Contains(title));
        }

        var stories = await query.OrderByDescending(story => story.PublishedAt)
            .ThenBy(story => story.Id)
            .Select(story => new
            {
                story.Id, story.Title, story.Author, story.Genre, story.Description,
                story.Status, story.CoverTheme, story.PublishedAt,
                ChapterCount = story.Chapters.Count
            })
            .ToListAsync(cancellationToken);
        return Ok(stories);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
    {
        var story = await context.Stories.AsNoTracking()
            .Where(item => item.Id == id)
            .Select(item => new
            {
                item.Id, item.Title, item.Author, item.Genre, item.Description,
                item.Status, item.CoverTheme, item.PublishedAt,
                ChapterCount = item.Chapters.Count
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
            .Select(chapter => new { chapter.Id, chapter.Number, chapter.Title })
            .ToListAsync(cancellationToken);
        return Ok(chapters);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<IActionResult> Create(UpsertStoryRequest request, CancellationToken cancellationToken)
    {
        var story = new Story();
        ApplyStory(story, request);
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

        var chapter = new Chapter { StoryId = id, Number = request.Number, Title = request.Title.Trim() };
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

    private Task<bool> ChapterNumberExists(int storyId, int number, int? exceptId, CancellationToken cancellationToken) =>
        context.Chapters.AsNoTracking().AnyAsync(chapter => chapter.StoryId == storyId && chapter.Number == number && chapter.Id != exceptId, cancellationToken);
}
