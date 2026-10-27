using CustomerManagement.API.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CustomerManagement.API.Controllers;

[ApiController]
[Route("api/chapters")]
[Authorize(Roles = "Admin")]
public class ChaptersController(ApplicationDbContext context) : ControllerBase
{
    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id, CancellationToken cancellationToken)
    {
        var chapter = await context.Chapters.AsNoTracking()
            .Where(item => item.Id == id)
            .Select(item => new
            {
                item.Id,
                item.StoryId,
                item.Number,
                item.StoryChapterId,
                StoryChapterNumber = item.StoryChapter.Number,
                StoryChapterTitle = item.StoryChapter.Title,
                item.EpisodeNumber,
                item.Title,
                item.Content,
                item.IsFree,
                item.PublishAt
            })
            .SingleOrDefaultAsync(cancellationToken);
        return chapter is null ? NotFound(new { message = "Không tìm thấy chương." }) : Ok(chapter);
    }
}
