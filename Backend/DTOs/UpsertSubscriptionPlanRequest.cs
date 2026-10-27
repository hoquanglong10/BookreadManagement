using System.ComponentModel.DataAnnotations;

namespace CustomerManagement.API.DTOs;

public class UpsertSubscriptionPlanRequest
{
    [Required, StringLength(100, MinimumLength = 2)]
    public string Name { get; set; } = string.Empty;

    [Range(0, 1000000000)]
    public decimal Price { get; set; }

    [Range(1, 3660)]
    public int DurationDays { get; set; } = 30;

    [Required, RegularExpression("^(AllStories|SelectedGenres|SelectedStories)$")]
    public string AccessScope { get; set; } = "AllStories";

    public bool IsAvailable { get; set; } = true;
    public List<int> GenreIds { get; set; } = [];
    public List<int> StoryIds { get; set; } = [];
}
