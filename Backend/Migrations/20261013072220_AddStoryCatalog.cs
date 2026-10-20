using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CustomerManagement.API.Migrations
{
    /// <inheritdoc />
    public partial class AddStoryCatalog : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Stories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Author = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                    Genre = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(3000)", maxLength: 3000, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    CoverTheme = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    PublishedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Stories", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Chapters",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    StoryId = table.Column<int>(type: "int", nullable: false),
                    Number = table.Column<int>(type: "int", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Chapters", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Chapters_Stories_StoryId",
                        column: x => x.StoryId,
                        principalTable: "Stories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Chapters_StoryId_Number",
                table: "Chapters",
                columns: new[] { "StoryId", "Number" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Stories_Title",
                table: "Stories",
                column: "Title");

            migrationBuilder.InsertData(
                table: "Stories",
                columns: new[] { "Id", "Title", "Author", "Genre", "Description", "Status", "CoverTheme", "PublishedAt" },
                values: new object[,]
                {
                    { 1, "Tiệm sách ở cuối con hẻm", "Lan Chi", "Đời thường", "Giữa một con hẻm cũ, tiệm sách chỉ mở cửa khi trời đổ mưa. Mỗi người khách đến đây đều tìm thấy một câu chuyện đã đánh rơi và một lý do để bắt đầu lại.", "Đang cập nhật", "teal", new DateTime(2026, 10, 12) },
                    { 2, "Bản đồ những vì sao", "Khải An", "Kỳ ảo", "Một tấm bản đồ chỉ hiện nét vẽ dưới ánh trăng đưa cô bé Mai đi qua những miền đất chưa có tên. Ở cuối hành trình là bí mật về ngôi sao đã biến mất.", "Hoàn thành", "indigo", new DateTime(2026, 10, 10) },
                    { 3, "Mùa mưa trên mái ngói", "Minh Hà", "Lãng mạn", "Hai người xa lạ trú mưa dưới mái hiên của một ga tàu. Những cuộc gặp ngắn dần trở thành những lá thư dài, và mùa mưa năm ấy không còn giống bất kỳ mùa nào khác.", "Đang cập nhật", "rose", new DateTime(2026, 10, 8) },
                    { 4, "Kẻ giữ ngọn hải đăng", "Nhật Phong", "Bí ẩn", "Trên hòn đảo chỉ có mười ba cư dân, ngọn hải đăng bỗng sáng sau nhiều năm bỏ hoang. Người giữ đèn mới phải giải mã những tín hiệu gửi về từ biển đêm.", "Hoàn thành", "amber", new DateTime(2026, 10, 6) },
                    { 5, "Vườn thư gửi mai sau", "An Nhiên", "Chữa lành", "Trong khu vườn sau nhà, Vy tìm thấy những phong thư viết cho chính mình ở tương lai. Mỗi lá thư là một lời nhắc dịu dàng về những điều đáng giữ lại.", "Đang cập nhật", "sage", new DateTime(2026, 10, 4) },
                    { 6, "Thành phố không ngủ", "Hà Lam", "Phiêu lưu", "Khi đồng hồ thành phố dừng ở nửa đêm, một nhóm bạn phát hiện mọi con đường đều dẫn đến cùng một quảng trường. Để trở về, họ phải tìm được câu chuyện bị lãng quên của nơi này.", "Hoàn thành", "slate", new DateTime(2026, 10, 2) }
                });

            migrationBuilder.InsertData(
                table: "Chapters",
                columns: new[] { "Id", "StoryId", "Number", "Title" },
                values: new object[,]
                {
                    { 1, 1, 1, "Cơn mưa đầu mùa" }, { 2, 1, 2, "Cuốn sách không có tên" }, { 3, 1, 3, "Người khách lúc năm giờ" },
                    { 4, 2, 1, "Tấm bản đồ trên gác mái" }, { 5, 2, 2, "Lối đi qua rừng bạc" }, { 6, 2, 3, "Ngôi sao thứ bảy" },
                    { 7, 3, 1, "Chuyến tàu trễ giờ" }, { 8, 3, 2, "Một chiếc ô màu xanh" }, { 9, 3, 3, "Lá thư chưa gửi" },
                    { 10, 4, 1, "Ánh đèn trở lại" }, { 11, 4, 2, "Tín hiệu từ biển" }, { 12, 4, 3, "Đêm không trăng" },
                    { 13, 5, 1, "Lá thư trong chậu đất" }, { 14, 5, 2, "Ngày nắng lên" }, { 15, 5, 3, "Lời nhắn cho ngày mai" },
                    { 16, 6, 1, "Nửa đêm không tiếng chuông" }, { 17, 6, 2, "Những con đường lặp lại" }, { 18, 6, 3, "Quảng trường ký ức" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Chapters");

            migrationBuilder.DropTable(
                name: "Stories");
        }
    }
}
