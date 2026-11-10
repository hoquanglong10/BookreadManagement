using CustomerManagement.API.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CustomerManagement.API.Migrations;

[DbContext(typeof(ApplicationDbContext))]
[Migration("20261109141000_Sprint5OfflineReadProgress")]
public partial class Sprint5OfflineReadProgress : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<Guid>(
            name: "ClientEventId",
            table: "ReadEvents",
            type: "uniqueidentifier",
            nullable: true);

        migrationBuilder.CreateIndex(
            name: "IX_ReadEvents_UserId_ClientEventId",
            table: "ReadEvents",
            columns: new[] { "UserId", "ClientEventId" },
            unique: true,
            filter: "[UserId] IS NOT NULL AND [ClientEventId] IS NOT NULL");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(
            name: "IX_ReadEvents_UserId_ClientEventId",
            table: "ReadEvents");

        migrationBuilder.DropColumn(
            name: "ClientEventId",
            table: "ReadEvents");
    }
}
