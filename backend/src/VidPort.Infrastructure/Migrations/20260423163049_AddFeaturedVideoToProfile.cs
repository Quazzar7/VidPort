using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VidPort.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddFeaturedVideoToProfile : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "FeaturedVideoId",
                table: "Profiles",
                type: "uuid",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FeaturedVideoId",
                table: "Profiles");
        }
    }
}
