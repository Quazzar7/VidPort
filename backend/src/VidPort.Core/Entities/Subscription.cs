namespace VidPort.Core.Entities;

public class Subscription
{
    public Guid SubscriberId { get; set; }
    public Profile Subscriber { get; set; } = null!;
    public Guid CreatorId { get; set; }
    public Profile Creator { get; set; } = null!;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
