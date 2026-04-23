using VidPort.Core.Exceptions;

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

    public static Bookmark ForVideo(Guid profileId, Guid videoId) =>
        new() { Id = Guid.NewGuid(), ProfileId = profileId, VideoId = videoId, CreatedAt = DateTime.UtcNow };

    public static Bookmark ForProfile(Guid profileId, Guid targetProfileId)
    {
        if (profileId == targetProfileId)
            throw new DomainException("Cannot bookmark your own profile");

        return new() { Id = Guid.NewGuid(), ProfileId = profileId, BookmarkedProfileId = targetProfileId, CreatedAt = DateTime.UtcNow };
    }
}
