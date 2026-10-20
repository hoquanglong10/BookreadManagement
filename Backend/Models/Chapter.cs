namespace CustomerManagement.API.Models;

public class Chapter
{
    public int Id { get; set; }
    public int StoryId { get; set; }
    public Story Story { get; set; } = null!;
    public int Number { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public bool IsFree { get; set; } = true;
    public DateTime PublishAt { get; set; } = DateTime.UtcNow;
    public int ViewCount { get; set; }
}
