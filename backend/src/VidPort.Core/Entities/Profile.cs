using VidPort.Core.Enums;

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
}
