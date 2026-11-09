using System.Security.Claims;
using CustomerManagement.API.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CustomerManagement.API.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/admin/users")]
public class AdminUsersController(ApplicationDbContext context) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List([FromQuery] string? search, [FromQuery] string status = "All", [FromQuery] int page = 1, [FromQuery] int pageSize = 50, CancellationToken cancellationToken = default)
    {
        if (status is not ("All" or "Active" or "Locked")) return BadRequest(new { message = "Bộ lọc trạng thái tài khoản không hợp lệ." });
        var query = context.Users.AsNoTracking().AsQueryable();
        if (status == "Active") query = query.Where(user => !user.IsLocked);
        if (status == "Locked") query = query.Where(user => user.IsLocked);
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(user => user.Username.Contains(term) || (user.Email != null && user.Email.Contains(term)) || user.DisplayName.Contains(term));
        }
        var totalCount = await query.CountAsync(cancellationToken);
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);
        var users = await query.OrderByDescending(user => user.CreatedAt).ThenBy(user => user.Id)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(user => new { user.Id, user.Username, user.Email, user.DisplayName, user.Role, user.IsLocked, user.CreatedAt })
            .ToListAsync(cancellationToken);
        var ids = users.Select(user => user.Id).ToArray();
        var now = DateTime.UtcNow;
        var subscriptions = await context.UserSubscriptions.AsNoTracking()
            .Where(subscription => ids.Contains(subscription.UserId) && subscription.Status == "Active" && subscription.EndsAt > now)
            .Select(subscription => new { subscription.UserId, Plan = subscription.Plan.Name, subscription.EndsAt })
            .ToListAsync(cancellationToken);
        var purchases = await context.StoryPurchases.AsNoTracking()
            .Where(purchase => ids.Contains(purchase.UserId))
            .OrderByDescending(purchase => purchase.PurchasedAt)
            .Select(purchase => new { purchase.UserId, Story = purchase.Story.Title, purchase.PurchasedAt })
            .ToListAsync(cancellationToken);
        var items = users.Select(user => new
        {
            user.Id,
            user.Username,
            user.Email,
            DisplayName = string.IsNullOrWhiteSpace(user.DisplayName) ? user.Username : user.DisplayName,
            user.Role,
            user.IsLocked,
            user.CreatedAt,
            ActivePlans = subscriptions.Where(item => item.UserId == user.Id).ToArray(),
            PurchasedStories = purchases.Where(item => item.UserId == user.Id).Take(20).ToArray(),
            PurchasedStoryCount = purchases.Count(item => item.UserId == user.Id)
        }).ToArray();
        return Ok(new { Items = items, Page = page, PageSize = pageSize, TotalCount = totalCount, TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize) });
    }

    [HttpPut("{id:int}/lock")]
    public async Task<IActionResult> SetLock(int id, [FromBody] SetUserLockRequest request, CancellationToken cancellationToken)
    {
        var currentId = int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId) ? userId : (int?)null;
        if (request.IsLocked && currentId == id) return BadRequest(new { message = "Bạn không thể khóa tài khoản quản trị đang sử dụng." });
        var user = await context.Users.SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (user is null) return NotFound(new { message = "Không tìm thấy tài khoản." });
        if (request.IsLocked && user.Role == "Admin")
            return BadRequest(new { message = "Không thể khóa tài khoản quản trị viên qua chức năng quản lý thành viên." });
        user.IsLocked = request.IsLocked;
        await context.SaveChangesAsync(cancellationToken);
        return Ok(new { user.Id, user.IsLocked });
    }
}

public sealed record SetUserLockRequest(bool IsLocked);
