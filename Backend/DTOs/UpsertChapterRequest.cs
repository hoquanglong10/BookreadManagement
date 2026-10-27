using System.ComponentModel.DataAnnotations;

namespace CustomerManagement.API.DTOs;

public class UpsertChapterRequest
{
    // Number is retained for older clients; new clients let the API allocate a legacy reader sequence.
    [Range(1, 100000, ErrorMessage = "Số tập đọc phải từ 1 đến 100000.")]
    public int? Number { get; set; }

    [Range(1, 100000, ErrorMessage = "Số chương phải từ 1 đến 100000.")]
    public int? StoryChapterNumber { get; set; }

    [StringLength(200)]
    public string? StoryChapterTitle { get; set; }

    [Range(1, 100000, ErrorMessage = "Số tập phải từ 1 đến 100000.")]
    public int EpisodeNumber { get; set; } = 1;

    [Required(ErrorMessage = "Vui lòng nhập tên tập.")]
    [StringLength(200, ErrorMessage = "Tên tập tối đa 200 ký tự.")]
    public string Title { get; set; } = string.Empty;

    [Required(ErrorMessage = "Vui lòng nhập nội dung tập.")]
    [StringLength(1000000, ErrorMessage = "Nội dung tập tối đa 1.000.000 ký tự.")]
    public string Content { get; set; } = string.Empty;

    public bool IsFree { get; set; }

    public DateTime? PublishAt { get; set; }
}
