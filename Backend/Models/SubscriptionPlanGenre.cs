namespace CustomerManagement.API.Models;

public class SubscriptionPlanGenre
{
    public int PlanId { get; set; }
    public SubscriptionPlan Plan { get; set; } = null!;
    public int GenreId { get; set; }
    public Genre Genre { get; set; } = null!;
}
