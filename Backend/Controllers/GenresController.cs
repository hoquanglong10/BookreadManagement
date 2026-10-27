using CustomerManagement.API.Data;
using CustomerManagement.API.DTOs;
using CustomerManagement.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CustomerManagement.API.Controllers;

[ApiController]
[Route("api/genres")]
public class GenresController(ApplicationDbContext context) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var genres = await context.Genres.AsNoTracking()
            .OrderBy(genre => genre.Name)
            .Select(genre => new
            {
                genre.Id,
                genre.Name,
                StoryCount = context.StoryGenres.Count(link => link.GenreId == genre.Id)
            })
            .ToListAsync(cancellationToken);
        return Ok(genres);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<IActionResult> Create(UpsertGenreRequest request, CancellationToken cancellationToken)
    {
        var name = request.Name.Trim();
        if (await context.Genres.AnyAsync(genre => genre.Name == name, cancellationToken))
            return Conflict(new { message = "Thể loại này đã tồn tại." });
        var genre = new Genre { Name = name };
        context.Genres.Add(genre);
        await context.SaveChangesAsync(cancellationToken);
        return CreatedAtAction(nameof(GetAll), new { id = genre.Id }, new { genre.Id, genre.Name, StoryCount = 0 });
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, UpsertGenreRequest request, CancellationToken cancellationToken)
    {
        var genre = await context.Genres.FindAsync([id], cancellationToken);
        if (genre is null) return NotFound(new { message = "Không tìm thấy thể loại." });
        var name = request.Name.Trim();
        if (await context.Genres.AnyAsync(item => item.Id != id && item.Name == name, cancellationToken))
            return Conflict(new { message = "Thể loại này đã tồn tại." });

        var oldName = genre.Name;
        genre.Name = name;
        var stories = await context.Stories.Where(story => story.Genre == oldName).ToListAsync(cancellationToken);
        foreach (var story in stories)
        {
            story.Genre = name;
            story.UpdatedAt = DateTime.UtcNow;
        }
        await context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var genre = await context.Genres.FindAsync([id], cancellationToken);
        if (genre is null) return NotFound(new { message = "Không tìm thấy thể loại." });
        if (await context.StoryGenres.AnyAsync(link => link.GenreId == genre.Id, cancellationToken)
            || await context.Stories.AnyAsync(story => story.Genre == genre.Name, cancellationToken)
            || await context.SubscriptionPlanGenres.AnyAsync(link => link.GenreId == genre.Id, cancellationToken))
            return Conflict(new { message = "Không thể xóa thể loại đang được truyện hoặc gói đọc sử dụng." });
        context.Genres.Remove(genre);
        await context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }
}
