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
    public DbSet<WorkExperience> WorkExperiences => Set<WorkExperience>();
    public DbSet<Education> Educations => Set<Education>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<CommunicationThread> CommunicationThreads => Set<CommunicationThread>();
    public DbSet<CommunicationMessage> CommunicationMessages => Set<CommunicationMessage>();
    public DbSet<BlockedSlot> BlockedSlots => Set<BlockedSlot>();
    public DbSet<RawJob> RawJobs => Set<RawJob>();
    public DbSet<SkillAggregate> SkillAggregates => Set<SkillAggregate>();
    public DbSet<JobInsight> JobInsights => Set<JobInsight>();

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

            entity.HasMany(p => p.WorkExperiences)
                  .WithOne(w => w.Profile)
                  .HasForeignKey(w => w.ProfileId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(p => p.Educations)
                  .WithOne(e => e.Profile)
                  .HasForeignKey(e => e.ProfileId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(p => p.Projects)
                  .WithOne(p => p.Profile)
                  .HasForeignKey(p => p.ProfileId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(p => p.FeaturedVideo)
                  .WithMany()
                  .HasForeignKey(p => p.FeaturedVideoId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<CommunicationThread>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.HasOne(e => e.InitiatorProfile)
                  .WithMany()
                  .HasForeignKey(e => e.InitiatorProfileId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.RecipientProfile)
                  .WithMany()
                  .HasForeignKey(e => e.RecipientProfileId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<CommunicationMessage>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Type).HasConversion<string>();

            entity.HasOne(e => e.Thread)
                  .WithMany(t => t.Messages)
                  .HasForeignKey(e => e.ThreadId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.SenderProfile)
                  .WithMany()
                  .HasForeignKey(e => e.SenderProfileId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<BlockedSlot>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Profile)
                  .WithMany()
                  .HasForeignKey(e => e.ProfileId)
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

        modelBuilder.Entity<WorkExperience>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Company).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Role).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Location).HasMaxLength(200);
        });

        modelBuilder.Entity<Education>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Institution).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Degree).HasMaxLength(200);
            entity.Property(e => e.FieldOfStudy).HasMaxLength(200);
        });

        modelBuilder.Entity<Project>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.TechStack).HasColumnType("text[]");

            entity.HasOne(p => p.Video)
                  .WithMany()
                  .HasForeignKey(p => p.VideoId)
                  .OnDelete(DeleteBehavior.SetNull)
                  .IsRequired(false);
        });

        modelBuilder.Entity<RawJob>(entity =>
        {
            entity.ToTable("raw_jobs");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.ExternalId).HasColumnName("external_id").IsRequired().HasMaxLength(500);
            entity.Property(e => e.Source).HasColumnName("source").IsRequired().HasMaxLength(100);
            entity.Property(e => e.Title).HasColumnName("title").IsRequired().HasMaxLength(500);
            entity.Property(e => e.Company).HasColumnName("company").IsRequired().HasMaxLength(300);
            entity.Property(e => e.Location).HasColumnName("location");
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.Skills).HasColumnName("skills").HasColumnType("text[]");
            entity.Property(e => e.SalaryMin).HasColumnName("salary_min");
            entity.Property(e => e.SalaryMax).HasColumnName("salary_max");
            entity.Property(e => e.PostedAt).HasColumnName("posted_at");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.IsProcessed).HasColumnName("is_processed");
            entity.HasIndex(e => new { e.ExternalId, e.Source }).IsUnique();
        });

        modelBuilder.Entity<SkillAggregate>(entity =>
        {
            entity.ToTable("skill_aggregates");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.SkillName).HasColumnName("skill_name").IsRequired().HasMaxLength(100);
            entity.Property(e => e.JobCount).HasColumnName("job_count");
            entity.Property(e => e.WeekOverWeekChange).HasColumnName("week_over_week_change");
            entity.Property(e => e.PeriodStart).HasColumnName("period_start");
            entity.Property(e => e.PeriodEnd).HasColumnName("period_end");
            entity.Property(e => e.ComputedAt).HasColumnName("computed_at");
            entity.HasIndex(e => new { e.SkillName, e.PeriodStart }).IsUnique();
        });

        modelBuilder.Entity<JobInsight>(entity =>
        {
            entity.ToTable("job_insights");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Type).HasColumnName("type").IsRequired().HasMaxLength(50);
            entity.Property(e => e.Title).HasColumnName("title").IsRequired().HasMaxLength(300);
            entity.Property(e => e.Body).HasColumnName("body").IsRequired();
            entity.Property(e => e.GeneratedAt).HasColumnName("generated_at");
            entity.Property(e => e.IsActive).HasColumnName("is_active");
        });
    }
}
