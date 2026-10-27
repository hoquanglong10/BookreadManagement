namespace CustomerManagement.API.Models;

public class SubscriptionPlanStory
{
    public int PlanId { get; set; }
    public SubscriptionPlan Plan { get; set; } = null!;
    public int StoryId { get; set; }
    public Story Story { get; set; } = null!;
}
