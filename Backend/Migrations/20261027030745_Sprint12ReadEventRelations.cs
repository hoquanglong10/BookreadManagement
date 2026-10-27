using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CustomerManagement.API.Migrations
{
    /// <inheritdoc />
    public partial class Sprint12ReadEventRelations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_ReadEvents_ChapterId",
                table: "ReadEvents",
                column: "ChapterId");

            migrationBuilder.AddForeignKey(
                name: "FK_ReadEvents_Chapters_ChapterId",
                table: "ReadEvents",
                column: "ChapterId",
                principalTable: "Chapters",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_ReadEvents_Stories_StoryId",
                table: "ReadEvents",
                column: "StoryId",
                principalTable: "Stories",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ReadEvents_Chapters_ChapterId",
                table: "ReadEvents");

            migrationBuilder.DropForeignKey(
                name: "FK_ReadEvents_Stories_StoryId",
                table: "ReadEvents");

            migrationBuilder.DropIndex(
                name: "IX_ReadEvents_ChapterId",
                table: "ReadEvents");
        }
    }
}
