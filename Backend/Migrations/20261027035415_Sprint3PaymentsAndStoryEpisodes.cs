using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CustomerManagement.API.Migrations
{
    /// <inheritdoc />
    public partial class Sprint3PaymentsAndStoryEpisodes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "EpisodeNumber",
                table: "Chapters",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "StoryChapterId",
                table: "Chapters",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "PaymentTransactions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Reference = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    IdempotencyKey = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    Type = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    PlanId = table.Column<int>(type: "int", nullable: true),
                    StoryId = table.Column<int>(type: "int", nullable: true),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ProcessedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    FailureReason = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    EntitlementGranted = table.Column<bool>(type: "bit", nullable: false),
                    ReconciledAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ReconciledByUserId = table.Column<int>(type: "int", nullable: true),
                    ReconciliationNote = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PaymentTransactions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PaymentTransactions_Stories_StoryId",
                        column: x => x.StoryId,
                        principalTable: "Stories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PaymentTransactions_SubscriptionPlans_PlanId",
                        column: x => x.PlanId,
                        principalTable: "SubscriptionPlans",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PaymentTransactions_Users_ReconciledByUserId",
                        column: x => x.ReconciledByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PaymentTransactions_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "StoryChapters",
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
                    table.PrimaryKey("PK_StoryChapters", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StoryChapters_Stories_StoryId",
                        column: x => x.StoryId,
                        principalTable: "Stories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.Sql(@"
                INSERT INTO [StoryChapters] ([StoryId], [Number], [Title])
                SELECT [StoryId], [Number], [Title] FROM [Chapters];

                UPDATE [episode]
                SET [episode].[StoryChapterId] = [storyChapter].[Id], [episode].[EpisodeNumber] = 1
                FROM [Chapters] AS [episode]
                INNER JOIN [StoryChapters] AS [storyChapter]
                    ON [storyChapter].[StoryId] = [episode].[StoryId]
                    AND [storyChapter].[Number] = [episode].[Number];
            ");

            migrationBuilder.AlterColumn<int>(
                name: "EpisodeNumber",
                table: "Chapters",
                type: "int",
                nullable: false,
                defaultValue: 1,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "StoryChapterId",
                table: "Chapters",
                type: "int",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Chapters_StoryChapterId_EpisodeNumber",
                table: "Chapters",
                columns: new[] { "StoryChapterId", "EpisodeNumber" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PaymentTransactions_PlanId",
                table: "PaymentTransactions",
                column: "PlanId");

            migrationBuilder.CreateIndex(
                name: "IX_PaymentTransactions_ReconciledByUserId",
                table: "PaymentTransactions",
                column: "ReconciledByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_PaymentTransactions_Reference",
                table: "PaymentTransactions",
                column: "Reference",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PaymentTransactions_Status_CreatedAt",
                table: "PaymentTransactions",
                columns: new[] { "Status", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_PaymentTransactions_StoryId",
                table: "PaymentTransactions",
                column: "StoryId");

            migrationBuilder.CreateIndex(
                name: "IX_PaymentTransactions_UserId_IdempotencyKey",
                table: "PaymentTransactions",
                columns: new[] { "UserId", "IdempotencyKey" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_StoryChapters_StoryId_Number",
                table: "StoryChapters",
                columns: new[] { "StoryId", "Number" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Chapters_StoryChapters_StoryChapterId",
                table: "Chapters",
                column: "StoryChapterId",
                principalTable: "StoryChapters",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Chapters_StoryChapters_StoryChapterId",
                table: "Chapters");

            migrationBuilder.DropTable(
                name: "PaymentTransactions");

            migrationBuilder.DropTable(
                name: "StoryChapters");

            migrationBuilder.DropIndex(
                name: "IX_Chapters_StoryChapterId_EpisodeNumber",
                table: "Chapters");

            migrationBuilder.DropColumn(
                name: "EpisodeNumber",
                table: "Chapters");

            migrationBuilder.DropColumn(
                name: "StoryChapterId",
                table: "Chapters");
        }
    }
}
