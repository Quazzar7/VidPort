namespace VidPort.Core.Entities;

public class Bookmark
{
    public Guid Id { get; set; }
    public Guid ProfileId { get; set; }
    public Profile Profile { get; set; } = null!;
    public Guid? VideoId { get; set; }
    public Video? Video { get; set; }
    public Guid? BookmarkedProfileId { get; set; }
    public Profile? BookmarkedProfile { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
