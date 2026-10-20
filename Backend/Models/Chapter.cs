namespace CustomerManagement.API.Models;

public class Chapter
{
    public int Id { get; set; }
    public int StoryId { get; set; }
    public Story Story { get; set; } = null!;
    public int Number { get; set; }
    public string Title { get; set; } = string.Empty;
}
