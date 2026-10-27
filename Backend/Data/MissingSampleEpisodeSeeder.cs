using CustomerManagement.API.Models;
using Microsoft.EntityFrameworkCore;

namespace CustomerManagement.API.Data;

/// <summary>Fills legacy Development sample episodes that had titles but no readable body.</summary>
public static class MissingSampleEpisodeSeeder
{
    private sealed record EpisodeSeed(string StoryTitle, int StoryChapterNumber, string EpisodeTitle, string Content);

    private static readonly EpisodeSeed[] Episodes =
    [
        E("Tiệm sách ở cuối con hẻm", 2, "Cuốn sách không có tên", "Chi tìm thấy một cuốn sách bọc giấy nâu ở ngăn thấp nhất. Bìa không ghi tên tác giả, chỉ có một nét mực xanh giống màu chiếc ô người khách bỏ quên. Cô mang sách ra quầy, định hỏi bác đóng sách già ở đầu phố thì một cậu bé bước vào và nói bà ngoại từng kể về nó.\n\nCậu không nhớ cốt truyện, chỉ nhớ nhân vật chính luôn để dành trang cuối cho người đọc tự viết. Chi mở sách ra; trang cuối đã bị xé mất. Cậu bé hẹn ngày mai sẽ mang theo tấm ảnh cũ của bà để giúp cô tìm người từng mượn cuốn sách."),
        E("Tiệm sách ở cuối con hẻm", 3, "Người khách lúc năm giờ", "Đúng năm giờ, chuông cửa reo lên và một người đàn ông đứng dưới mái hiên, tay cầm chiếc ô xanh đã sờn. Ông hỏi Chi có còn giữ cuốn sách không tên hay không. Cô nhận ra nét chữ trên cán ô giống hệt dòng ghi chú trong cuốn sổ của mẹ, nhưng chưa vội hỏi về mối liên hệ ấy.\n\nNgười khách nói mình từng hứa sẽ quay lại trước khi tiệm đóng cửa, rồi rời thành phố quá lâu. Chi đặt cuốn sách lên quầy. Ông chỉ xin đọc một trang, sau đó lặng im khi thấy nét chữ quen thuộc của người bạn cũ ở lề giấy."),
        E("Bản đồ những vì sao", 2, "Lối đi qua rừng bạc", "Mai và Khải rời thị trấn khi trăng vừa lên, mang theo tấm bản đồ được bọc trong vải dầu. Lối vào rừng bạc nằm sau con suối cạn, nhưng những cành cây phản chiếu ánh trăng khiến mỗi ngã rẽ trông giống hệt nhau. Khải đánh dấu đường bằng phấn, còn Mai đối chiếu từng vệt sáng với những chấm mực trên giấy.\n\nMột dấu chân mới xuất hiện cạnh lối mòn dù họ chưa gặp ai. Nó hướng về phía ngọn đồi không có tên trên bản đồ. Mai nhận ra dấu giày ấy giống đôi giày mẹ cô để lại trong căn gác mái, và quyết định đi theo trước khi sương tan."),
        E("Bản đồ những vì sao", 3, "Ngôi sao thứ bảy", "Trên đỉnh đồi, Khải dựng kính thiên văn trong khi Mai trải bản đồ lên phiến đá phẳng. Sáu ngôi sao được đánh dấu hiện đúng vị trí, nhưng khoảng trống ở giữa dường như cũng phát sáng. Khi Mai xoay tờ giấy về hướng bắc, một nét mực mới hiện ra và nối ngọn đồi với hồ nước phía xa.\n\nTại bờ hồ, họ nhìn thấy bầu trời phản chiếu những mái nhà không còn trên mặt đất. Một giọng nói vọng lên từ phía bên kia, gọi tên mẹ Mai. Cả hai không bước xuống nước; họ ghi lại thời điểm và đường đi, rồi hẹn trở lại cùng những người hiểu lịch sử của thung lũng."),
        E("Mùa mưa trên mái ngói", 2, "Một chiếc ô màu xanh", "Hạ trú mưa ở căn nhà mái ngói bên đường ray, nơi chiếc ô xanh được treo ngay ngắn cạnh cửa. Minh nhận ra trên cán ô có khắc ký hiệu giống tấm vé cũ của mẹ mình. Chủ nhà không biết ai đã mang nó tới, chỉ kể rằng chiếc ô thường được chuyền cho người lỡ chuyến tàu cuối.\n\nHạ tìm thấy một mẩu giấy gấp trong túi đựng ô, ghi số sân ga và giờ hẹn đã bị nhòe. Minh đối chiếu với lịch tàu cũ, phát hiện sân ga số bốn từng có một chuyến dừng lúc nửa đêm. Họ quyết định quay lại nhà ga trước khi cơn mưa tiếp theo kéo đến."),
        E("Mùa mưa trên mái ngói", 3, "Lá thư chưa gửi", "Minh mở chiếc hộp gỗ tìm thấy dưới mái hiên và thấy một lá thư chưa dán tem. Người nhận là một địa chỉ đã bị xóa khỏi bản đồ, còn người gửi ký tên bằng chữ cái đầu giống tên cha anh. Hạ đề nghị hỏi người soát vé cũ trước khi đọc, vì bức thư có thể chứa chuyện riêng của một gia đình.\n\nÔng lão xác nhận con phố ấy từng nằm sát đường ray và bị dỡ bỏ sau trận lũ. Ông nhận ra nét chữ nhưng không chắc lá thư có tới đúng người hay không. Minh giữ nguyên phong bì, bắt đầu tìm những người còn sống từng cư trú ở khu phố cũ."),
        E("Kẻ giữ ngọn hải đăng", 2, "Tín hiệu từ biển", "Trong ca trực đầu tiên sau cơn bão, An nhìn thấy ba vệt sáng ngắn ngoài khơi rồi một vệt dài hướng về phía mũi đá. Tín hiệu không khớp với quy ước của tàu cá trong vùng. Cô ghi lại thời gian, hướng gió và độ cao con sóng, sau đó gọi trạm cứu hộ để xác nhận không có tàu mất liên lạc.\n\nSáng hôm sau, một chiếc phao dạt vào chân tháp, buộc kèm mảnh vải có tên một hòn đảo không xuất hiện trên hải đồ. An đem nó xuống làng hỏi những người đi biển lâu năm. Một ngư dân già nhận ra ký hiệu ấy và kể về con tàu từng trú bão ở nơi đó."),
        E("Kẻ giữ ngọn hải đăng", 3, "Đêm không trăng", "Đêm không trăng, máy quay của hải đăng ghi lại một khoảng tối bất thường giữa hai lần quét sáng. An kiểm tra bóng đèn, dây dẫn và nguồn điện nhưng mọi thứ đều hoạt động bình thường. Cô xuống bãi đá, nơi dấu chân ướt dừng lại ngay dưới chân tháp rồi biến mất trước mép nước.\n\nTrong phòng trực, cuốn sổ của người tiền nhiệm có cùng một ghi chú vào đúng ngày này nhiều năm trước. Trang sau bị xé, nhưng vết hằn cho thấy từng có tên một con tàu. An đặt tờ giấy lên ánh đèn, chép lại những nét còn đọc được trước khi thủy triều lên."),
        E("Vườn thư gửi mai sau", 2, "Gửi người chưa gặp", "An Nhiên tìm thấy lá thư đầu tiên trong hòm gỗ cạnh nhà kính. Người viết là mẹ cô, gửi cho một người chưa từng được ghi tên. Lá thư kể về luống đất ở phía đông và cách nhận ra mùa khô sắp đến bằng mùi của lớp đất dưới tán cây.\n\nNhiên làm theo hướng dẫn, nhưng thay vì đào luống lên, cô mời bác làm vườn trong xóm tới xem. Bác nhận ra giống cây bản địa đang mọc tự nhiên ở mép rào và khuyên cô giữ lại. Nhiên viết một lá thư hồi đáp, kể rằng khu vườn đã có thêm người chăm sóc."),
        E("Vườn thư gửi mai sau", 3, "Lời nhắn cho ngày mai", "Một nhành hoa lạ nở bên cửa nhà kính dù không ai nhớ đã gieo hạt. Nhiên chụp ảnh gửi tới địa chỉ cuối cùng trong cuốn sổ của mẹ. Vài ngày sau, thư hồi âm đến từ một người phụ nữ sống ở ngôi làng ven sông; bà nói giống hoa ấy thường được trồng trước hiên nhà để báo rằng gia đình sẵn sàng đón khách.\n\nNhiên cùng nhóm tình nguyện mang một nhánh hoa tới gặp bà. Bà trao lại những bức thư cũ và kể về người đã khởi đầu khu vườn. Trước khi chia tay, họ ghi tên giống cây và cách chăm sóc vào tấm bảng mới cạnh cổng."),
        E("Thành phố không ngủ", 2, "Những con đường lặp lại", "Lam đi qua ba con phố nhưng lần nào cũng trở lại cùng một ngã tư. Biển báo chỉ hướng khác nhau, còn chiếc đồng hồ ở quảng trường vẫn đứng ở mười hai giờ mười bảy phút. Phúc đánh dấu lối đi bằng những mẩu giấy, nhưng sau mỗi vòng quay chúng lại xuất hiện trong túi áo của Lam.\n\nMột người bán hàng đêm chỉ cho họ con hẻm không có đèn. Cuối hẻm là căn nhà bị bỏ trống, trước cửa có tấm biển tên phố cũ. Lam chụp lại biển hiệu và gửi cho bà Hạnh, người từng phụ trách lưu trữ bản đồ của thành phố."),
        E("Thành phố không ngủ", 3, "Quảng trường ký ức", "Bà Hạnh mang tới quảng trường một bản đồ vẽ tay, trên đó dòng sông cũ vẫn chảy qua khu phố đã bị san bằng. Lam và Phúc đối chiếu từng ngã rẽ với những câu chuyện của người bán hàng đêm. Mỗi lần ai đó gọi đúng tên một con phố, chiếc đồng hồ lại nhích thêm một giây.\n\nHọ chưa thể làm thành phố trở lại như trước, nhưng tìm được trạm chuông nằm dưới lớp gạch mới. Bên trong là cuốn sổ ghi tên những người từng sống quanh quảng trường. Lam nhận ra một cái tên bị gạch đi nhiều lần, như thể ai đó đã cố xóa nó khỏi mọi bản đồ." )
    ];

    public static async Task SeedAsync(ApplicationDbContext context, CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        foreach (var seed in Episodes)
        {
            var episode = await context.Chapters
                .Include(item => item.Story)
                .Include(item => item.StoryChapter)
                .SingleOrDefaultAsync(item => item.Story.Title == seed.StoryTitle
                    && item.StoryChapter.Number == seed.StoryChapterNumber
                    && item.EpisodeNumber == 1, cancellationToken);
            if (episode is null || !string.IsNullOrWhiteSpace(episode.Content)) continue;

            episode.Content = seed.Content;
            if (string.IsNullOrWhiteSpace(episode.Title)) episode.Title = seed.EpisodeTitle;
            episode.Story.UpdatedAt = now;
        }

        await context.SaveChangesAsync(cancellationToken);
    }

    private static EpisodeSeed E(string story, int chapter, string title, string content) => new(story, chapter, title, content);
}
