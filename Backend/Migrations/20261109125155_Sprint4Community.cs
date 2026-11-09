using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CustomerManagement.API.Migrations
{
    /// <inheritdoc />
    public partial class Sprint4Community : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ChapterComments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    StoryChapterId = table.Column<int>(type: "int", nullable: false),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    ParentCommentId = table.Column<int>(type: "int", nullable: true),
                    Content = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    IsHidden = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EditedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DeletedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChapterComments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ChapterComments_ChapterComments_ParentCommentId",
                        column: x => x.ParentCommentId,
                        principalTable: "ChapterComments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ChapterComments_StoryChapters_StoryChapterId",
                        column: x => x.StoryChapterId,
                        principalTable: "StoryChapters",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ChapterComments_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "FollowedStories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    StoryId = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FollowedStories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FollowedStories_Stories_StoryId",
                        column: x => x.StoryId,
                        principalTable: "Stories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_FollowedStories_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ReaderNotifications",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    StoryId = table.Column<int>(type: "int", nullable: false),
                    ChapterId = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ReadAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReaderNotifications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ReaderNotifications_Chapters_ChapterId",
                        column: x => x.ChapterId,
                        principalTable: "Chapters",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ReaderNotifications_Stories_StoryId",
                        column: x => x.StoryId,
                        principalTable: "Stories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ReaderNotifications_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CommentReports",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CommentId = table.Column<int>(type: "int", nullable: false),
                    ReporterId = table.Column<int>(type: "int", nullable: false),
                    Reason = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ResolvedByUserId = table.Column<int>(type: "int", nullable: true),
                    ResolvedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    AdminNote = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CommentReports", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CommentReports_ChapterComments_CommentId",
                        column: x => x.CommentId,
                        principalTable: "ChapterComments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CommentReports_Users_ReporterId",
                        column: x => x.ReporterId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CommentReports_Users_ResolvedByUserId",
                        column: x => x.ResolvedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ChapterComments_ParentCommentId",
                table: "ChapterComments",
                column: "ParentCommentId");

            migrationBuilder.CreateIndex(
                name: "IX_ChapterComments_StoryChapterId_ParentCommentId_CreatedAt",
                table: "ChapterComments",
                columns: new[] { "StoryChapterId", "ParentCommentId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_ChapterComments_UserId",
                table: "ChapterComments",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_CommentReports_CommentId_ReporterId_Status",
                table: "CommentReports",
                columns: new[] { "CommentId", "ReporterId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_CommentReports_ReporterId",
                table: "CommentReports",
                column: "ReporterId");

            migrationBuilder.CreateIndex(
                name: "IX_CommentReports_ResolvedByUserId",
                table: "CommentReports",
                column: "ResolvedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_CommentReports_Status_CreatedAt",
                table: "CommentReports",
                columns: new[] { "Status", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_FollowedStories_StoryId",
                table: "FollowedStories",
                column: "StoryId");

            migrationBuilder.CreateIndex(
                name: "IX_FollowedStories_UserId_CreatedAt",
                table: "FollowedStories",
                columns: new[] { "UserId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_FollowedStories_UserId_StoryId",
                table: "FollowedStories",
                columns: new[] { "UserId", "StoryId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ReaderNotifications_ChapterId",
                table: "ReaderNotifications",
                column: "ChapterId");

            migrationBuilder.CreateIndex(
                name: "IX_ReaderNotifications_StoryId",
                table: "ReaderNotifications",
                column: "StoryId");

            migrationBuilder.CreateIndex(
                name: "IX_ReaderNotifications_UserId_ChapterId",
                table: "ReaderNotifications",
                columns: new[] { "UserId", "ChapterId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ReaderNotifications_UserId_ReadAt_CreatedAt",
                table: "ReaderNotifications",
                columns: new[] { "UserId", "ReadAt", "CreatedAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CommentReports");

            migrationBuilder.DropTable(
                name: "FollowedStories");

            migrationBuilder.DropTable(
                name: "ReaderNotifications");

            migrationBuilder.DropTable(
                name: "ChapterComments");
        }
    }
}
