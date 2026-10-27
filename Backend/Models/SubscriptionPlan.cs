namespace CustomerManagement.API.Models;

public class SubscriptionPlan
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int DurationDays { get; set; } = 30;
    public string AccessScope { get; set; } = "AllStories";
    public bool IsAvailable { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public List<SubscriptionPlanGenre> PlanGenres { get; set; } = [];
    public List<SubscriptionPlanStory> PlanStories { get; set; } = [];
}
