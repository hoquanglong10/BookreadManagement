using System.ComponentModel.DataAnnotations;

namespace CustomerManagement.API.DTOs;

public class RegisterRequest
{
    [Required, RegularExpression(@"^[A-Za-z0-9_.-]{3,30}$", ErrorMessage = "Tên đăng nhập phải dài 3-30 ký tự và chỉ gồm chữ, số, _, . hoặc -.")]
    public string Username { get; set; } = string.Empty;

    [Required, EmailAddress, MaxLength(256)]
    public string Email { get; set; } = string.Empty;

    [Required, MinLength(8), MaxLength(128)]
    public string Password { get; set; } = string.Empty;
}
