using CustomerManagement.API.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CustomerManagement.API.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/admin/analytics")]
public sealed class AdminAnalyticsController(ApplicationDbContext context) : ControllerBase
{
    [HttpGet("activity")]
    public async Task<IActionResult> Activity([FromQuery] DateTime? from, [FromQuery] DateTime? to, CancellationToken cancellationToken)
    {
        if (!TryGetRange(from, to, out var start, out var end, out var error)) return BadRequest(new { message = error });

        var registrations = context.Users.AsNoTracking()
            .Where(user => user.Role != "Admin" && user.CreatedAt >= start && user.CreatedAt < end);
        var transactions = context.PaymentTransactions.AsNoTracking()
            .Where(item => item.CreatedAt >= start && item.CreatedAt < end);

        var registeredMembers = await registrations.CountAsync(cancellationToken);
        var transactionStates = await transactions.GroupBy(item => item.Status)
            .Select(group => new { status = group.Key, count = group.Count() })
            .ToDictionaryAsync(item => item.status, item => item.count, cancellationToken);

        var successfulPlans = transactions.Where(item => item.Type == "Plan" && item.Status == "Success");
        var renewals = await successfulPlans.CountAsync(item => context.PaymentTransactions.Any(previous =>
            previous.UserId == item.UserId && previous.PlanId == item.PlanId && previous.Type == "Plan" && previous.Status == "Success"
            && (previous.CreatedAt < item.CreatedAt || (previous.CreatedAt == item.CreatedAt && previous.Id < item.Id))), cancellationToken);
        var planTransactions = await successfulPlans.CountAsync(cancellationToken);
        var storyPurchases = await transactions.CountAsync(item => item.Type == "Story" && item.Status == "Success", cancellationToken);
        var activeSubscriptionsAtEnd = await context.UserSubscriptions.AsNoTracking()
            .CountAsync(item => item.Status == "Active" && item.StartsAt < end && item.EndsAt >= end, cancellationToken);

        var registrationDays = await registrations
            .GroupBy(user => new { user.CreatedAt.Year, user.CreatedAt.Month, user.CreatedAt.Day })
            .Select(group => new { group.Key.Year, group.Key.Month, group.Key.Day, count = group.Count() })
            .ToListAsync(cancellationToken);
        var transactionDays = await transactions.Where(item => item.Status == "Success")
            .GroupBy(item => new { item.CreatedAt.Year, item.CreatedAt.Month, item.CreatedAt.Day })
            .Select(group => new { group.Key.Year, group.Key.Month, group.Key.Day, count = group.Count() })
            .ToListAsync(cancellationToken);
        var registrationsByDay = registrationDays.ToDictionary(item => new DateOnly(item.Year, item.Month, item.Day), item => item.count);
        var transactionsByDay = transactionDays.ToDictionary(item => new DateOnly(item.Year, item.Month, item.Day), item => item.count);
        var firstDay = DateOnly.FromDateTime(start);
        var lastDay = DateOnly.FromDateTime(end.AddTicks(-1));
        var daily = Enumerable.Range(0, lastDay.DayNumber - firstDay.DayNumber + 1)
            .Select(offset => firstDay.AddDays(offset))
            .Select(day => new
            {
                date = day.ToString("yyyy-MM-dd"),
                newMembers = registrationsByDay.GetValueOrDefault(day),
                successfulTransactions = transactionsByDay.GetValueOrDefault(day)
            });

        return Ok(new
        {
            from = start,
            to = end,
            summary = new
            {
                registeredMembers,
                planTransactions,
                planRegistrations = Math.Max(0, planTransactions - renewals),
                renewals,
                storyPurchases,
                activeSubscriptionsAtEnd,
                transactions = new
                {
                    pending = transactionStates.GetValueOrDefault("Pending"),
                    successful = transactionStates.GetValueOrDefault("Success"),
                    failed = transactionStates.GetValueOrDefault("Failed")
                }
            },
            daily
        });
    }

    [HttpGet("revenue")]
    public async Task<IActionResult> Revenue([FromQuery] DateTime? from, [FromQuery] DateTime? to, [FromQuery] string? groupBy = "day", CancellationToken cancellationToken = default)
    {
        if (!TryGetRange(from, to, out var start, out var end, out var error)) return BadRequest(new { message = error });
        groupBy = string.IsNullOrWhiteSpace(groupBy) ? "day" : groupBy.Trim().ToLowerInvariant();
        if (groupBy is not ("day" or "month")) return BadRequest(new { message = "groupBy chỉ nhận day hoặc month." });

        var successful = context.PaymentTransactions.AsNoTracking()
            .Where(item => item.Status == "Success" && item.CreatedAt >= start && item.CreatedAt < end);
        var totalRevenue = await successful.SumAsync(item => (decimal?)item.Amount, cancellationToken) ?? 0m;
        var successfulTransactions = await successful.CountAsync(cancellationToken);
        var plans = await successful.Where(item => item.Type == "Plan")
            .GroupBy(item => item.Plan == null ? "Gói không còn trong danh mục" : item.Plan.Name)
            .Select(group => new { name = group.Key, amount = group.Sum(item => item.Amount), count = group.Count() })
            .OrderByDescending(item => item.amount).ToListAsync(cancellationToken);
        var storySales = successful.Where(item => item.Type == "Story");
        var storyRevenue = await storySales.SumAsync(item => (decimal?)item.Amount, cancellationToken) ?? 0m;
        var stories = await storySales
            .GroupBy(item => item.Story == null ? "Truyện không còn trong danh mục" : item.Story.Title)
            .Select(group => new { name = group.Key, amount = group.Sum(item => item.Amount), count = group.Count() })
            .OrderByDescending(item => item.amount).Take(10).ToListAsync(cancellationToken);

        var rawSeries = groupBy == "month"
            ? await successful.GroupBy(item => new { item.CreatedAt.Year, item.CreatedAt.Month })
                .Select(group => new { group.Key.Year, group.Key.Month, Day = 1, amount = group.Sum(item => item.Amount), count = group.Count() })
                .ToListAsync(cancellationToken)
            : await successful.GroupBy(item => new { item.CreatedAt.Year, item.CreatedAt.Month, item.CreatedAt.Day })
                .Select(group => new { group.Key.Year, group.Key.Month, Day = group.Key.Day, amount = group.Sum(item => item.Amount), count = group.Count() })
                .ToListAsync(cancellationToken);

        return Ok(new
        {
            from = start,
            to = end,
            groupBy,
            totalRevenue,
            successfulTransactions,
            planRevenue = plans.Sum(item => item.amount),
            storyRevenue,
            series = rawSeries.OrderBy(item => item.Year).ThenBy(item => item.Month).ThenBy(item => item.Day)
                .Select(item => new { period = groupBy == "month" ? $"{item.Year:D4}-{item.Month:D2}" : $"{item.Year:D4}-{item.Month:D2}-{item.Day:D2}", item.amount, item.count }),
            byPlan = plans,
            topPurchasedStories = stories
        });
    }

    [HttpGet("content")]
    public async Task<IActionResult> Content([FromQuery] DateTime? from, [FromQuery] DateTime? to, CancellationToken cancellationToken)
    {
        if (!TryGetRange(from, to, out var start, out var end, out var error)) return BadRequest(new { message = error });

        var mostRead = await (
            from read in context.ReadEvents.AsNoTracking()
            join story in context.Stories.AsNoTracking() on read.StoryId equals story.Id
            where read.ViewedAt >= start && read.ViewedAt < end
            group read by new { story.Id, story.Title } into grouped
            orderby grouped.Count() descending
            select new { storyId = grouped.Key.Id, title = grouped.Key.Title, count = grouped.Count() })
            .Take(10).ToListAsync(cancellationToken);

        var mostFollowed = await (
            from follow in context.FollowedStories.AsNoTracking()
            join story in context.Stories.AsNoTracking() on follow.StoryId equals story.Id
            where follow.CreatedAt >= start && follow.CreatedAt < end
            group follow by new { story.Id, story.Title } into grouped
            orderby grouped.Count() descending
            select new { storyId = grouped.Key.Id, title = grouped.Key.Title, count = grouped.Count() })
            .Take(10).ToListAsync(cancellationToken);

        var mostPurchased = await (
            from transaction in context.PaymentTransactions.AsNoTracking()
            join story in context.Stories.AsNoTracking() on transaction.StoryId equals story.Id
            where transaction.Type == "Story" && transaction.Status == "Success" && transaction.CreatedAt >= start && transaction.CreatedAt < end
            group transaction by new { story.Id, story.Title } into grouped
            orderby grouped.Count() descending
            select new { storyId = grouped.Key.Id, title = grouped.Key.Title, count = grouped.Count() })
            .Take(10).ToListAsync(cancellationToken);

        var favoriteGenres = await (
            from follow in context.FollowedStories.AsNoTracking()
            join storyGenre in context.StoryGenres.AsNoTracking() on follow.StoryId equals storyGenre.StoryId
            join genre in context.Genres.AsNoTracking() on storyGenre.GenreId equals genre.Id
            where follow.CreatedAt >= start && follow.CreatedAt < end
            group follow by new { genre.Id, genre.Name } into grouped
            orderby grouped.Count() descending
            select new { genreId = grouped.Key.Id, name = grouped.Key.Name, count = grouped.Count() })
            .Take(10).ToListAsync(cancellationToken);

        return Ok(new { from = start, to = end, mostRead, mostFollowed, mostPurchased, favoriteGenres });
    }

    private static bool TryGetRange(DateTime? from, DateTime? to, out DateTime start, out DateTime end, out string error)
    {
        var now = DateTime.UtcNow;
        error = string.Empty;
        try
        {
            end = NormalizeUtc(to ?? now);
            start = NormalizeUtc(from ?? end.AddDays(-29));
        }
        catch (ArgumentOutOfRangeException)
        {
            start = DateTime.MinValue;
            end = DateTime.MinValue;
            error = "Khoảng thời gian không hợp lệ.";
            return false;
        }
        if (start >= end)
        {
            error = "Ngày bắt đầu phải trước ngày kết thúc.";
            return false;
        }
        if ((end - start).TotalDays > 366)
        {
            error = "Khoảng thống kê tối đa là 366 ngày.";
            return false;
        }
        return true;
    }

    private static DateTime NormalizeUtc(DateTime value) => value.Kind switch
    {
        DateTimeKind.Utc => value,
        DateTimeKind.Local => value.ToUniversalTime(),
        _ => DateTime.SpecifyKind(value, DateTimeKind.Utc)
    };
}
