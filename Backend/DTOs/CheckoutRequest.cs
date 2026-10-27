using System.ComponentModel.DataAnnotations;

namespace CustomerManagement.API.DTOs;

public class CheckoutRequest
{
    [Required]
    public Guid RequestId { get; set; }

    // The payment gateway is intentionally simulated for this project.
    public bool SimulateFailure { get; set; }
}
