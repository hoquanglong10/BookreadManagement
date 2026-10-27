using System.ComponentModel.DataAnnotations;

namespace CustomerManagement.API.DTOs;

public class UpsertStoryRequest
{
    [Required(ErrorMessage = "Vui lòng nhập tên truyện.")]
    [StringLength(200, ErrorMessage = "Tên truyện tối đa 200 ký tự.")]
    public string Title { get; set; } = string.Empty;

    [Required(ErrorMessage = "Vui lòng nhập tên tác giả.")]
    [StringLength(120, ErrorMessage = "Tên tác giả tối đa 120 ký tự.")]
    public string Author { get; set; } = string.Empty;

    [StringLength(80, ErrorMessage = "Thể loại tối đa 80 ký tự.")]
    public string? Genre { get; set; }

    public List<int>? GenreIds { get; set; }

    [Required(ErrorMessage = "Vui lòng nhập giới thiệu truyện.")]
    [StringLength(3000, ErrorMessage = "Giới thiệu tối đa 3000 ký tự.")]
    public string Description { get; set; } = string.Empty;

    [Required]
    [RegularExpression("^(Đang cập nhật|Hoàn thành)$", ErrorMessage = "Trạng thái không hợp lệ.")]
    public string Status { get; set; } = string.Empty;

    [Required]
    [RegularExpression("^(teal|indigo|rose|amber|sage|slate)$", ErrorMessage = "Màu bìa không hợp lệ.")]
    public string CoverTheme { get; set; } = string.Empty;

    [StringLength(500)]
    public string? CoverUrl { get; set; }

    [RegularExpression("^(Free|Paid|Mixed)$", ErrorMessage = "Hình thức truy cập không hợp lệ.")]
    public string AccessType { get; set; } = "Free";

    [Range(0, 1000000000, ErrorMessage = "Giá truyện không hợp lệ.")]
    public decimal Price { get; set; }

    [Range(0, 100000, ErrorMessage = "Số chương miễn phí không hợp lệ.")]
    public int FreeChapterCount { get; set; }
}
