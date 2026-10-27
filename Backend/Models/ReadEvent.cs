namespace CustomerManagement.API.Models;

public class ReadEvent
{
    public long Id { get; set; }
    public int? UserId { get; set; }
    public int StoryId { get; set; }
    public int ChapterId { get; set; }
    public DateTime ViewedAt { get; set; } = DateTime.UtcNow;
}
