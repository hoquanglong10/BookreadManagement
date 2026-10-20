using System.ComponentModel.DataAnnotations;

namespace CustomerManagement.API.DTOs;

public class UpsertChapterRequest
{
    [Range(1, 100000, ErrorMessage = "Số chương phải từ 1 đến 100000.")]
    public int Number { get; set; }

    [Required(ErrorMessage = "Vui lòng nhập tên chương.")]
    [StringLength(200, ErrorMessage = "Tên chương tối đa 200 ký tự.")]
    public string Title { get; set; } = string.Empty;
}
