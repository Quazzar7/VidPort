using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VidPort.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RenameVideoTypeResumeToPortfolio : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("UPDATE \"Videos\" SET \"Type\" = 'Portfolio' WHERE \"Type\" = 'Resume';");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("UPDATE \"Videos\" SET \"Type\" = 'Resume' WHERE \"Type\" = 'Portfolio';");
        }
    }
}
