namespace CustomerManagement.API.Models;

public class UserSubscription
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public int PlanId { get; set; }
    public SubscriptionPlan Plan { get; set; } = null!;
    public DateTime StartsAt { get; set; }
    public DateTime EndsAt { get; set; }
    public string Status { get; set; } = "Active";
}
