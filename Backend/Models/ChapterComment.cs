namespace CustomerManagement.API.Models;

public class ChapterComment
{
    public int Id { get; set; }
    public int StoryChapterId { get; set; }
    public StoryChapter StoryChapter { get; set; } = null!;
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public int? ParentCommentId { get; set; }
    public ChapterComment? ParentComment { get; set; }
    public List<ChapterComment> Replies { get; set; } = [];
    public List<CommentReport> Reports { get; set; } = [];
    public string Content { get; set; } = string.Empty;
    public bool IsHidden { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? EditedAt { get; set; }
    public DateTime? DeletedAt { get; set; }
}
