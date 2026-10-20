using System.ComponentModel.DataAnnotations;

namespace CustomerManagement.API.DTOs;

public class UpsertGenreRequest
{
    [Required(ErrorMessage = "Vui lòng nhập tên thể loại.")]
    [StringLength(80, ErrorMessage = "Tên thể loại tối đa 80 ký tự.")]
    public string Name { get; set; } = string.Empty;
}
