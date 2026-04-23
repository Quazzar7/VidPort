using VidPort.Core.Enums;

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
}
