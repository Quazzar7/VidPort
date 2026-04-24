using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VidPort.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddBlockedSlotsAndDuration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "DurationMinutes",
                table: "CommunicationMessages",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "BlockedSlots",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ProfileId = table.Column<Guid>(type: "uuid", nullable: false),
                    StartTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EndTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Reason = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BlockedSlots", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BlockedSlots_Profiles_ProfileId",
                        column: x => x.ProfileId,
                        principalTable: "Profiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BlockedSlots_ProfileId",
                table: "BlockedSlots",
                column: "ProfileId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BlockedSlots");

            migrationBuilder.DropColumn(
                name: "DurationMinutes",
                table: "CommunicationMessages");
        }
    }
}
