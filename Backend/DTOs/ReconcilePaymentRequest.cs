using System.ComponentModel.DataAnnotations;

namespace CustomerManagement.API.DTOs;

public class ReconcilePaymentRequest
{
    [Required, StringLength(500, MinimumLength = 8)]
    public string Note { get; set; } = string.Empty;
}
