using System.ComponentModel.DataAnnotations;

namespace CustomerManagement.API.DTOs;

public class UpdateCustomerDto
{
    [Required]
    public string FullName { get; set; } = string.Empty;

    [Required]
    public string Phone { get; set; } = string.Empty;

    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string Address { get; set; } = string.Empty;
}
