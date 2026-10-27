namespace CustomerManagement.API.Models;

public class Genre
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public List<StoryGenre> StoryGenres { get; set; } = [];
    public List<SubscriptionPlanGenre> SubscriptionPlanGenres { get; set; } = [];
}
