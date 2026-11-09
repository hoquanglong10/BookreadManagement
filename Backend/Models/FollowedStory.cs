namespace CustomerManagement.API.Models;

public class FollowedStory
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public int StoryId { get; set; }
    public Story Story { get; set; } = null!;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
