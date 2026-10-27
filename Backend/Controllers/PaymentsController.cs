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
[Route("api/payments")]
public class PaymentsController(ApplicationDbContext context) : ControllerBase
{
    [HttpGet("mine")]
    public async Task<IActionResult> Mine(CancellationToken cancellationToken)
    {
        var userId = CurrentUserId();
        var rows = await context.PaymentTransactions.AsNoTracking()
            .Where(item => item.UserId == userId)
            .OrderByDescending(item => item.CreatedAt)
            .Select(item => new
            {
                item.Id, item.Reference, item.Type, item.Amount, item.Status,
                item.CreatedAt, item.ProcessedAt, item.FailureReason,
                item.EntitlementGranted, item.ReconciledAt,
                PlanName = item.Plan != null ? item.Plan.Name : null,
                StoryTitle = item.Story != null ? item.Story.Title : null
            })
            .ToListAsync(cancellationToken);
        return Ok(rows);
    }

    [HttpPost("plans/{planId:int}")]
    public async Task<IActionResult> Subscribe(int planId, CheckoutRequest request, CancellationToken cancellationToken)
    {
        if (request.RequestId == Guid.Empty) return BadRequest(new { message = "Thiếu mã yêu cầu thanh toán." });
        var userId = CurrentUserId();
        var repeated = await FindRepeatedRequest(userId, request.RequestId, cancellationToken);
        if (repeated is not null) return Ok(ToResult(repeated));

        var plan = await context.SubscriptionPlans.SingleOrDefaultAsync(item => item.Id == planId && item.IsAvailable, cancellationToken);
        if (plan is null) return NotFound(new { message = "Gói đọc không tồn tại hoặc đã ngừng bán." });

        var now = DateTime.UtcNow;
        var transaction = NewTransaction(userId, request.RequestId, "Plan", plan.Price, now, request.SimulateFailure);
        transaction.PlanId = plan.Id;
        if (!request.SimulateFailure)
        {
            var active = await context.UserSubscriptions
                .Where(item => item.UserId == userId && item.PlanId == plan.Id && item.Status == "Active" && item.EndsAt > now)
                .OrderByDescending(item => item.EndsAt).FirstOrDefaultAsync(cancellationToken);
            var startsAt = active?.EndsAt > now ? active.EndsAt : now;
            context.UserSubscriptions.Add(new UserSubscription
            {
                UserId = userId, PlanId = plan.Id, StartsAt = startsAt,
                EndsAt = startsAt.AddDays(plan.DurationDays), Status = "Active"
            });
            transaction.EntitlementGranted = true;
        }
        context.PaymentTransactions.Add(transaction);
        await context.SaveChangesAsync(cancellationToken);
        return Ok(ToResult(transaction));
    }

    [HttpPost("stories/{storyId:int}")]
    public async Task<IActionResult> PurchaseStory(int storyId, CheckoutRequest request, CancellationToken cancellationToken)
    {
        if (request.RequestId == Guid.Empty) return BadRequest(new { message = "Thiếu mã yêu cầu thanh toán." });
        var userId = CurrentUserId();
        var repeated = await FindRepeatedRequest(userId, request.RequestId, cancellationToken);
        if (repeated is not null) return Ok(ToResult(repeated));

        var story = await context.Stories.SingleOrDefaultAsync(item => item.Id == storyId, cancellationToken);
        if (story is null) return NotFound(new { message = "Không tìm thấy truyện." });
        if (story.AccessType == "Free") return BadRequest(new { message = "Truyện này miễn phí, không cần mua." });
        if (await context.StoryPurchases.AnyAsync(item => item.UserId == userId && item.StoryId == storyId, cancellationToken))
            return Conflict(new { message = "Bạn đã sở hữu quyền đọc truyện này." });

        var now = DateTime.UtcNow;
        var transaction = NewTransaction(userId, request.RequestId, "Story", story.Price, now, request.SimulateFailure);
        transaction.StoryId = story.Id;
        if (!request.SimulateFailure)
        {
            context.StoryPurchases.Add(new StoryPurchase { UserId = userId, StoryId = story.Id, PriceAtPurchase = story.Price, PurchasedAt = now });
            transaction.EntitlementGranted = true;
        }
        context.PaymentTransactions.Add(transaction);
        await context.SaveChangesAsync(cancellationToken);
        return Ok(ToResult(transaction));
    }

    private async Task<PaymentTransaction?> FindRepeatedRequest(int userId, Guid requestId, CancellationToken cancellationToken) =>
        await context.PaymentTransactions.AsNoTracking().SingleOrDefaultAsync(item => item.UserId == userId && item.IdempotencyKey == requestId, cancellationToken);

    private static PaymentTransaction NewTransaction(int userId, Guid requestId, string type, decimal amount, DateTime now, bool failed) => new()
    {
        Reference = $"BR-{Guid.NewGuid():N}".ToUpperInvariant(),
        IdempotencyKey = requestId,
        UserId = userId,
        Type = type,
        Amount = amount,
        Status = failed ? "Failed" : "Success",
        CreatedAt = now,
        ProcessedAt = now,
        FailureReason = failed ? "Thanh toán mô phỏng bị từ chối. Quyền đọc chưa được cấp." : null
    };

    private static object ToResult(PaymentTransaction transaction) => new
    {
        transaction.Id, transaction.Reference, transaction.Type, transaction.Amount,
        transaction.Status, transaction.CreatedAt, transaction.EntitlementGranted,
        transaction.FailureReason, transaction.ReconciledAt
    };

    private int CurrentUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/admin/payments")]
public class AdminPaymentsController(ApplicationDbContext context) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] string? status, [FromQuery] int page = 1, [FromQuery] int pageSize = 50, CancellationToken cancellationToken = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);
        var query = context.PaymentTransactions.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(status)) query = query.Where(item => item.Status == status);
        var total = await query.CountAsync(cancellationToken);
        var items = await query.OrderByDescending(item => item.CreatedAt)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(item => new
            {
                item.Id, item.Reference, item.UserId, item.Type, item.Amount, item.Status,
                item.CreatedAt, item.ProcessedAt, item.FailureReason, item.EntitlementGranted,
                item.ReconciledAt, item.ReconciliationNote,
                Username = item.User.Username,
                PlanName = item.Plan != null ? item.Plan.Name : null,
                StoryTitle = item.Story != null ? item.Story.Title : null
            }).ToListAsync(cancellationToken);
        return Ok(new { items, page, pageSize, totalCount = total });
    }

    [HttpPost("{id:int}/reconcile")]
    public async Task<IActionResult> Reconcile(int id, ReconcilePaymentRequest request, CancellationToken cancellationToken)
    {
        var transaction = await context.PaymentTransactions.SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (transaction is null) return NotFound(new { message = "Không tìm thấy giao dịch." });
        if (transaction.EntitlementGranted) return Ok(new { message = "Quyền đã được cấp trước đó.", transaction.Id, transaction.Status, transaction.EntitlementGranted });
        if (transaction.Status is not ("Success" or "Failed"))
            return Conflict(new { message = "Chỉ có thể đối soát giao dịch đã xử lý." });

        if (transaction.Type == "Story" && transaction.StoryId is int storyId)
        {
            var purchase = await context.StoryPurchases.SingleOrDefaultAsync(item => item.UserId == transaction.UserId && item.StoryId == storyId, cancellationToken);
            if (purchase is null)
                context.StoryPurchases.Add(new StoryPurchase { UserId = transaction.UserId, StoryId = storyId, PriceAtPurchase = transaction.Amount, PurchasedAt = transaction.ProcessedAt ?? transaction.CreatedAt });
        }
        else if (transaction.Type == "Plan" && transaction.PlanId is int planId)
        {
            var now = DateTime.UtcNow;
            var plan = await context.SubscriptionPlans.SingleOrDefaultAsync(item => item.Id == planId, cancellationToken);
            if (plan is null) return Conflict(new { message = "Gói đọc liên quan đã bị xóa; chưa thể cấp quyền." });
            var active = await context.UserSubscriptions.Where(item => item.UserId == transaction.UserId && item.PlanId == planId && item.Status == "Active" && item.EndsAt > now)
                .OrderByDescending(item => item.EndsAt).FirstOrDefaultAsync(cancellationToken);
            var startsAt = active?.EndsAt > now ? active.EndsAt : now;
            context.UserSubscriptions.Add(new UserSubscription { UserId = transaction.UserId, PlanId = planId, StartsAt = startsAt, EndsAt = startsAt.AddDays(plan.DurationDays), Status = "Active" });
        }
        else return Conflict(new { message = "Giao dịch thiếu thông tin loại quyền cần cấp." });

        transaction.EntitlementGranted = true;
        transaction.ReconciledAt = DateTime.UtcNow;
        transaction.ReconciledByUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        transaction.ReconciliationNote = request.Note.Trim();
        await context.SaveChangesAsync(cancellationToken);
        return Ok(new { message = "Đã ghi nhận đối soát và cấp quyền.", transaction.Id, transaction.Status, transaction.EntitlementGranted, transaction.ReconciledAt });
    }
}
