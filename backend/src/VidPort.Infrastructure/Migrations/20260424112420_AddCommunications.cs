using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VidPort.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCommunications : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CommunicationThreads",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    InitiatorProfileId = table.Column<Guid>(type: "uuid", nullable: false),
                    RecipientProfileId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CommunicationThreads", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CommunicationThreads_Profiles_InitiatorProfileId",
                        column: x => x.InitiatorProfileId,
                        principalTable: "Profiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CommunicationThreads_Profiles_RecipientProfileId",
                        column: x => x.RecipientProfileId,
                        principalTable: "Profiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "CommunicationMessages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ThreadId = table.Column<Guid>(type: "uuid", nullable: false),
                    SenderProfileId = table.Column<Guid>(type: "uuid", nullable: false),
                    Type = table.Column<string>(type: "text", nullable: false),
                    Content = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsRead = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CommunicationMessages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CommunicationMessages_CommunicationThreads_ThreadId",
                        column: x => x.ThreadId,
                        principalTable: "CommunicationThreads",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CommunicationMessages_Profiles_SenderProfileId",
                        column: x => x.SenderProfileId,
                        principalTable: "Profiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Profiles_FeaturedVideoId",
                table: "Profiles",
                column: "FeaturedVideoId");

            migrationBuilder.CreateIndex(
                name: "IX_CommunicationMessages_SenderProfileId",
                table: "CommunicationMessages",
                column: "SenderProfileId");

            migrationBuilder.CreateIndex(
                name: "IX_CommunicationMessages_ThreadId",
                table: "CommunicationMessages",
                column: "ThreadId");

            migrationBuilder.CreateIndex(
                name: "IX_CommunicationThreads_InitiatorProfileId",
                table: "CommunicationThreads",
                column: "InitiatorProfileId");

            migrationBuilder.CreateIndex(
                name: "IX_CommunicationThreads_RecipientProfileId",
                table: "CommunicationThreads",
                column: "RecipientProfileId");

            migrationBuilder.AddForeignKey(
                name: "FK_Profiles_Videos_FeaturedVideoId",
                table: "Profiles",
                column: "FeaturedVideoId",
                principalTable: "Videos",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Profiles_Videos_FeaturedVideoId",
                table: "Profiles");

            migrationBuilder.DropTable(
                name: "CommunicationMessages");

            migrationBuilder.DropTable(
                name: "CommunicationThreads");

            migrationBuilder.DropIndex(
                name: "IX_Profiles_FeaturedVideoId",
                table: "Profiles");
        }
    }
}
