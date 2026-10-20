using System.ComponentModel.DataAnnotations;

namespace CustomerManagement.API.DTOs;

public class UpsertChapterRequest
{
    [Range(1, 100000, ErrorMessage = "Số chương phải từ 1 đến 100000.")]
    public int Number { get; set; }

    [Required(ErrorMessage = "Vui lòng nhập tên chương.")]
    [StringLength(200, ErrorMessage = "Tên chương tối đa 200 ký tự.")]
    public string Title { get; set; } = string.Empty;

    [Required(ErrorMessage = "Vui lòng nhập nội dung chương.")]
    [StringLength(1000000, ErrorMessage = "Nội dung chương tối đa 1.000.000 ký tự.")]
    public string Content { get; set; } = string.Empty;

    public bool IsFree { get; set; } = true;

    public DateTime? PublishAt { get; set; }
}
