using VidPort.Core.Enums;
using VidPort.Core.Exceptions;

namespace VidPort.Core.Entities;

public class Video
{
    public Guid Id { get; set; }
    public Guid ProfileId { get; set; }
    public Profile Profile { get; set; } = null!;
    public string S3Key { get; set; } = string.Empty;
    public VideoType Type { get; set; }
    public VideoStatus Status { get; set; }
    public int? DurationSeconds { get; set; }
    public string? ThumbnailUrl { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? DeletedAt { get; set; }

    public bool CanBeSetAsResume() =>
        Type == VideoType.Portfolio && (DurationSeconds == null || DurationSeconds <= 60);

    public bool OwnedBy(Guid userId) => Profile.UserId == userId;

    public void SoftDelete() => DeletedAt = DateTime.UtcNow;

    public void UpdateDuration(int seconds) => DurationSeconds = seconds;

    public void MarkAsProcessing()
    {
        if (Status != VideoStatus.Pending)
            throw new DomainException("Video is already being processed or completed");

        Status = VideoStatus.Processing;
    }
}
