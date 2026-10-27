using System.ComponentModel.DataAnnotations;

namespace CustomerManagement.API.DTOs;

public class UpdateProfileRequest
{
    [Required, StringLength(80, MinimumLength = 2)]
    public string DisplayName { get; set; } = string.Empty;

    [StringLength(500), Url]
    public string? AvatarUrl { get; set; }
}
