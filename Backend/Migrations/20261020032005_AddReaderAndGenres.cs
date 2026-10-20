using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CustomerManagement.API.Migrations
{
    /// <inheritdoc />
    public partial class AddReaderAndGenres : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "Stories",
                type: "datetime2",
                nullable: false,
                defaultValueSql: "GETUTCDATE()");

            migrationBuilder.AddColumn<string>(
                name: "Content",
                table: "Chapters",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "IsFree",
                table: "Chapters",
                type: "bit",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "PublishAt",
                table: "Chapters",
                type: "datetime2",
                nullable: false,
                defaultValueSql: "GETUTCDATE()");

            migrationBuilder.AddColumn<int>(
                name: "ViewCount",
                table: "Chapters",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "Genres",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Genres", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Genres_Name",
                table: "Genres",
                column: "Name",
                unique: true);

            migrationBuilder.Sql("""
                INSERT INTO [Genres] ([Name])
                SELECT DISTINCT LTRIM(RTRIM([Genre]))
                FROM [Stories]
                WHERE NULLIF(LTRIM(RTRIM([Genre])), N'') IS NOT NULL
                  AND NOT EXISTS (
                      SELECT 1 FROM [Genres] AS [g]
                      WHERE [g].[Name] = LTRIM(RTRIM([Stories].[Genre]))
                  );
                """);

            migrationBuilder.Sql("""
                UPDATE [Chapters]
                SET [Content] = CASE [StoryId]
                    WHEN 1 THEN N'Mưa đầu mùa rơi xuống con hẻm nhỏ khi Mai vừa kéo tấm cửa gỗ của tiệm sách. Trên bậc thềm có một cuốn sách cũ bị bỏ quên, bìa không ghi tên người viết.' + NCHAR(10) + NCHAR(10) + N'Khi Mai mở trang đầu, một mảnh giấy rơi ra. Nét chữ trên đó giống hệt nét chữ của người mẹ đã mất nhiều năm. Ngoài hiên, tiếng mưa bỗng nhỏ lại, như thể con hẻm đang chờ cô đọc tiếp.'
                    WHEN 2 THEN N'Mai tìm thấy tấm bản đồ trong chiếc rương trên gác mái. Những đường mực chỉ hiện ra khi ánh trăng chạm vào giấy, kéo dài qua khu rừng phía bắc đến một vùng đất chưa có trên bất kỳ tấm bản đồ nào.' + NCHAR(10) + NCHAR(10) + N'Ở góc dưới cùng là hình một ngôi sao bị khuyết mất một cánh. Mai nhận ra biểu tượng ấy từ cuốn nhật ký của cha, cùng lời nhắn: chỉ đi khi đã sẵn sàng quay về.'
                    WHEN 3 THEN N'Chuyến tàu cuối ngày dừng lâu hơn thường lệ ở ga nhỏ ven sông. An đứng dưới mái hiên, ôm chiếc ô xanh đã sờn cán và nhìn những giọt mưa chạy dọc ô cửa kính.' + NCHAR(10) + NCHAR(10) + N'Người ngồi đối diện đặt xuống một tờ giấy gấp đôi. Trên đó là địa chỉ của một nơi cả hai từng hứa sẽ cùng đến, nhưng chưa ai đủ can đảm nhắc lại.'
                    WHEN 4 THEN N'Ngọn hải đăng tắt suốt bảy năm bất ngờ sáng lên giữa một đêm biển động. Người giữ đèn mới, Phong, chạy lên cầu thang xoắn và thấy cánh cửa phòng máy mở sẵn.' + NCHAR(10) + NCHAR(10) + N'Trên bàn có một cuốn sổ khô ráo dù mái nhà dột khắp nơi. Trang cuối ghi tên một con tàu chưa từng xuất hiện trong sổ cảng, kèm thời điểm nó sẽ cập bến vào sáng hôm sau.'
                    WHEN 5 THEN N'Lá thư đầu tiên nằm trong chậu đất sau cơn mưa. Vy nhận ra nét chữ của mình, dù phong thư ghi ngày gửi từ mười năm sau. Người viết chỉ dặn cô giữ lại chiếc hộp thiếc dưới gốc cây và đừng vội bỏ đi khỏi căn nhà cũ.' + NCHAR(10) + NCHAR(10) + N'Vy đọc lại dòng chữ ấy bên cửa sổ. Trong vườn, chiếc cây tưởng đã chết bắt đầu nhú một chiếc lá non.'
                    WHEN 6 THEN N'Đúng nửa đêm, đồng hồ trên quảng trường dừng lại. Thành phố im bặt, nhưng những ô cửa sổ vẫn sáng và dòng xe vẫn đứng yên giữa ngã tư.' + NCHAR(10) + NCHAR(10) + N'Nam nghe thấy tiếng chuông vọng lên từ con phố đã bị xóa khỏi bản đồ. Cậu mang theo chiếc đèn pin, bước qua vạch kẻ đường và thấy dưới mặt đường hiện ra một dòng chữ: hãy tìm câu chuyện mà mọi người đã quên.'
                    ELSE [Content]
                END
                FROM [Chapters]
                WHERE [Number] = 1 AND NULLIF(LTRIM(RTRIM([Content])), N'') IS NULL;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Genres");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "Stories");

            migrationBuilder.DropColumn(
                name: "Content",
                table: "Chapters");

            migrationBuilder.DropColumn(
                name: "IsFree",
                table: "Chapters");

            migrationBuilder.DropColumn(
                name: "PublishAt",
                table: "Chapters");

            migrationBuilder.DropColumn(
                name: "ViewCount",
                table: "Chapters");
        }
    }
}

