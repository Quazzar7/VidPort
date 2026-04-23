using Microsoft.EntityFrameworkCore;
using VidPort.Core.Entities;

namespace VidPort.Infrastructure.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Profile> Profiles => Set<Profile>();
    public DbSet<Skill> Skills => Set<Skill>();
    public DbSet<ProfileSkill> ProfileSkills => Set<ProfileSkill>();
    public DbSet<Video> Videos => Set<Video>();
    public DbSet<VideoLike> VideoLikes => Set<VideoLike>();
    public DbSet<Subscription> Subscriptions => Set<Subscription>();
    public DbSet<Bookmark> Bookmarks => Set<Bookmark>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.HasPostgresExtension("vector");

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Email).IsUnique();
            entity.Property(e => e.Email).IsRequired().HasMaxLength(255);
            entity.Property(e => e.PasswordHash).IsRequired();
            entity.Property(e => e.Role).HasConversion<string>();
        });

        modelBuilder.Entity<Profile>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Slug).IsUnique();
            entity.Property(e => e.Slug).IsRequired().HasMaxLength(100);
            entity.Property(e => e.AvailabilityStatus).HasConversion<string>();
            entity.Property(e => e.PhoneNumber).HasMaxLength(30);

            entity.HasOne(p => p.User)
                  .WithOne()
                  .HasForeignKey<Profile>(p => p.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Skill>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Name).IsUnique();
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
        });

        modelBuilder.Entity<ProfileSkill>(entity =>
        {
            entity.HasKey(ps => new { ps.ProfileId, ps.SkillId });

            entity.HasOne(ps => ps.Profile)
                  .WithMany(p => p.ProfileSkills)
                  .HasForeignKey(ps => ps.ProfileId);

            entity.HasOne(ps => ps.Skill)
                  .WithMany(s => s.ProfileSkills)
                  .HasForeignKey(ps => ps.SkillId);
        });

        modelBuilder.Entity<Video>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.S3Key).IsRequired();
            entity.Property(e => e.Type).HasConversion<string>();
            entity.Property(e => e.Status).HasConversion<string>();

            entity.HasOne(v => v.Profile)
                  .WithMany()
                  .HasForeignKey(v => v.ProfileId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<VideoLike>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.VideoId, e.ProfileId }).IsUnique();

            entity.HasOne(l => l.Video)
                  .WithMany()
                  .HasForeignKey(l => l.VideoId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(l => l.Profile)
                  .WithMany()
                  .HasForeignKey(l => l.ProfileId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Subscription>(entity =>
        {
            entity.HasKey(s => new { s.SubscriberId, s.CreatorId });

            entity.HasOne(s => s.Subscriber)
                  .WithMany()
                  .HasForeignKey(s => s.SubscriberId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(s => s.Creator)
                  .WithMany()
                  .HasForeignKey(s => s.CreatorId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Bookmark>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.HasOne(b => b.Profile)
                  .WithMany()
                  .HasForeignKey(b => b.ProfileId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(b => b.Video)
                  .WithMany()
                  .HasForeignKey(b => b.VideoId)
                  .OnDelete(DeleteBehavior.Cascade)
                  .IsRequired(false);

            entity.HasOne(b => b.BookmarkedProfile)
                  .WithMany()
                  .HasForeignKey(b => b.BookmarkedProfileId)
                  .OnDelete(DeleteBehavior.Restrict)
                  .IsRequired(false);
        });
    }
}
