using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VidPort.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddMeetingLinkToCommunications : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "MeetingLink",
                table: "CommunicationMessages",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MeetingLink",
                table: "CommunicationMessages");
        }
    }
}
