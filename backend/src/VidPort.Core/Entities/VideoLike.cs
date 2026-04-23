namespace VidPort.Core.Entities;

public class VideoLike
{
    public Guid Id { get; set; }
    public Guid VideoId { get; set; }
    public Video Video { get; set; } = null!;
    public Guid ProfileId { get; set; }
    public Profile Profile { get; set; } = null!;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
