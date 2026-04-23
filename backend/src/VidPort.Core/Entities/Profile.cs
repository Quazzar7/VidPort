using VidPort.Core.Enums;
using VidPort.Core.Exceptions;

namespace VidPort.Core.Entities;

public class Profile
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public string Slug { get; set; } = string.Empty;
    public string? Headline { get; set; }
    public string? Bio { get; set; }
    public string? Location { get; set; }
    public AvailabilityStatus AvailabilityStatus { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public Guid? FeaturedVideoId { get; set; }
    public string? PhoneNumber { get; set; }
    public ICollection<ProfileSkill> ProfileSkills { get; set; } = new List<ProfileSkill>();

    public void SetFeaturedVideo(Video video)
    {
        if (video.ProfileId != Id)
            throw new DomainException("Video does not belong to this profile");

        if (!video.CanBeSetAsResume())
            throw new DomainException(
                video.Type != VideoType.Portfolio
                    ? "Only Portfolio videos can be set as the resume video"
                    : "Resume video must be 60 seconds or under");

        FeaturedVideoId = video.Id;
        UpdatedAt = DateTime.UtcNow;
    }

    public void ClearFeaturedVideo()
    {
        FeaturedVideoId = null;
        UpdatedAt = DateTime.UtcNow;
    }

    public void ClearFeaturedVideoIfWas(Guid videoId)
    {
        if (FeaturedVideoId == videoId)
            ClearFeaturedVideo();
    }
}
