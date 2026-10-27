namespace CustomerManagement.API.Models;

public class PaymentTransaction
{
    public int Id { get; set; }
    public string Reference { get; set; } = string.Empty;
    public Guid IdempotencyKey { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public string Type { get; set; } = string.Empty;
    public int? PlanId { get; set; }
    public SubscriptionPlan? Plan { get; set; }
    public int? StoryId { get; set; }
    public Story? Story { get; set; }
    public decimal Amount { get; set; }
    public string Status { get; set; } = "Pending";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ProcessedAt { get; set; }
    public string? FailureReason { get; set; }
    public bool EntitlementGranted { get; set; }
    public DateTime? ReconciledAt { get; set; }
    public int? ReconciledByUserId { get; set; }
    public User? ReconciledByUser { get; set; }
    public string? ReconciliationNote { get; set; }
}
