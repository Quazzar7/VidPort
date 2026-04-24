using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VidPort.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddScheduledAtToCommunications : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "ScheduledAt",
                table: "CommunicationMessages",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ScheduledAt",
                table: "CommunicationMessages");
        }
    }
}
