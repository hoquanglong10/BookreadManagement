namespace CustomerManagement.API.Models;

public class Chapter
{
    public int Id { get; set; }
    public int StoryId { get; set; }
    public Story Story { get; set; } = null!;
    public int StoryChapterId { get; set; }
    public StoryChapter StoryChapter { get; set; } = null!;
    /// <summary>Legacy per-story sequence retained for existing reader URLs and APIs.</summary>
    public int Number { get; set; }
    public int EpisodeNumber { get; set; } = 1;
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public bool IsFree { get; set; }
    public DateTime PublishAt { get; set; } = DateTime.UtcNow;
    public int ViewCount { get; set; }
}
