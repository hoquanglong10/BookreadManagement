using CustomerManagement.API.Data;
using CustomerManagement.API.DTOs;
using CustomerManagement.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CustomerManagement.API.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/plans")]
public class SubscriptionPlansController(ApplicationDbContext context) : ControllerBase
{
    [AllowAnonymous]
    [HttpGet("available")]
    public async Task<IActionResult> GetAvailable(CancellationToken cancellationToken)
    {
        var plans = await context.SubscriptionPlans.AsNoTracking()
            .Where(plan => plan.IsAvailable)
            .OrderBy(plan => plan.Price)
            .Select(plan => new
            {
                plan.Id, plan.Name, plan.Price, plan.DurationDays, plan.AccessScope,
                GenreNames = plan.PlanGenres.Select(link => link.Genre.Name).ToList(),
                StoryTitles = plan.PlanStories.Select(link => link.Story.Title).ToList()
            })
            .ToListAsync(cancellationToken);
        return Ok(plans);
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var plans = await context.SubscriptionPlans.AsNoTracking()
            .OrderBy(plan => plan.Id)
            .Select(plan => new
            {
                plan.Id, plan.Name, plan.Price, plan.DurationDays, plan.AccessScope,
                plan.IsAvailable, plan.CreatedAt,
                GenreIds = plan.PlanGenres.Select(link => link.GenreId).ToList(),
                GenreNames = plan.PlanGenres.Select(link => link.Genre.Name).ToList(),
                StoryIds = plan.PlanStories.Select(link => link.StoryId).ToList(),
                SubscriptionCount = context.UserSubscriptions.Count(item => item.PlanId == plan.Id)
            })
            .ToListAsync(cancellationToken);
        return Ok(plans);
    }

    [HttpPost]
    public async Task<IActionResult> Create(UpsertSubscriptionPlanRequest request, CancellationToken cancellationToken)
    {
        var relationError = await ValidateScopeAsync(request, cancellationToken);
        if (relationError is not null) return BadRequest(new { message = relationError });
        var plan = new SubscriptionPlan();
        Apply(plan, request);
        SetScopeRelations(plan, request);
        context.SubscriptionPlans.Add(plan);
        await context.SaveChangesAsync(cancellationToken);
        return CreatedAtAction(nameof(GetAll), new { id = plan.Id }, new { plan.Id });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, UpsertSubscriptionPlanRequest request, CancellationToken cancellationToken)
    {
        var plan = await context.SubscriptionPlans
            .Include(item => item.PlanGenres)
            .Include(item => item.PlanStories)
            .SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (plan is null) return NotFound(new { message = "Không tìm thấy gói đọc." });
        var relationError = await ValidateScopeAsync(request, cancellationToken);
        if (relationError is not null) return BadRequest(new { message = relationError });
        Apply(plan, request);
        SetScopeRelations(plan, request);
        await context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    private async Task<string?> ValidateScopeAsync(UpsertSubscriptionPlanRequest request, CancellationToken cancellationToken)
    {
        var genreIds = request.GenreIds.Distinct().ToList();
        var storyIds = request.StoryIds.Distinct().ToList();
        if (request.AccessScope == "SelectedGenres")
        {
            if (genreIds.Count == 0) return "Chọn ít nhất một thể loại cho phạm vi gói.";
            if (await context.Genres.CountAsync(item => genreIds.Contains(item.Id), cancellationToken) != genreIds.Count)
                return "Có thể loại được chọn không còn tồn tại.";
        }
        if (request.AccessScope == "SelectedStories")
        {
            if (storyIds.Count == 0) return "Chọn ít nhất một truyện cho phạm vi gói.";
            if (await context.Stories.CountAsync(item => storyIds.Contains(item.Id), cancellationToken) != storyIds.Count)
                return "Có truyện được chọn không còn tồn tại.";
        }
        return null;
    }

    private static void Apply(SubscriptionPlan plan, UpsertSubscriptionPlanRequest request)
    {
        plan.Name = request.Name.Trim();
        plan.Price = request.Price;
        plan.DurationDays = request.DurationDays;
        plan.AccessScope = request.AccessScope;
        plan.IsAvailable = request.IsAvailable;
    }

    private static void SetScopeRelations(SubscriptionPlan plan, UpsertSubscriptionPlanRequest request)
    {
        var genreIds = request.AccessScope == "SelectedGenres" ? request.GenreIds.Distinct().ToHashSet() : [];
        var storyIds = request.AccessScope == "SelectedStories" ? request.StoryIds.Distinct().ToHashSet() : [];
        foreach (var relation in plan.PlanGenres.Where(item => !genreIds.Contains(item.GenreId)).ToList())
            plan.PlanGenres.Remove(relation);
        foreach (var relation in plan.PlanStories.Where(item => !storyIds.Contains(item.StoryId)).ToList())
            plan.PlanStories.Remove(relation);
        foreach (var id in genreIds.Where(id => plan.PlanGenres.All(item => item.GenreId != id)))
            plan.PlanGenres.Add(new SubscriptionPlanGenre { Plan = plan, GenreId = id });
        foreach (var id in storyIds.Where(id => plan.PlanStories.All(item => item.StoryId != id)))
            plan.PlanStories.Add(new SubscriptionPlanStory { Plan = plan, StoryId = id });
    }
}
