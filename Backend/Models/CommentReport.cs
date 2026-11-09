namespace CustomerManagement.API.Models;

public class CommentReport
{
    public int Id { get; set; }
    public int CommentId { get; set; }
    public ChapterComment Comment { get; set; } = null!;
    public int ReporterId { get; set; }
    public User Reporter { get; set; } = null!;
    public string Reason { get; set; } = string.Empty;
    public string Status { get; set; } = "Pending";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public int? ResolvedByUserId { get; set; }
    public User? ResolvedByUser { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public string? AdminNote { get; set; }
}
