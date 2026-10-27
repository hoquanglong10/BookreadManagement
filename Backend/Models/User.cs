namespace CustomerManagement.API.Models;

public class User
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string PasswordHash { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public string Role { get; set; } = "User";
    public bool IsLocked { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
