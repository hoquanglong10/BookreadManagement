namespace CustomerManagement.API.Models;

/// <summary>A numbered story chapter that can contain multiple readable episodes.</summary>
public class StoryChapter
{
    public int Id { get; set; }
    public int StoryId { get; set; }
    public Story Story { get; set; } = null!;
    public int Number { get; set; }
    public string Title { get; set; } = string.Empty;
    public List<Chapter> Episodes { get; set; } = [];
}
