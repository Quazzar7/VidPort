using VidPort.Core.Exceptions;

namespace VidPort.Core.Entities;

public class Subscription
{
    public Guid SubscriberId { get; set; }
    public Profile Subscriber { get; set; } = null!;
    public Guid CreatorId { get; set; }
    public Profile Creator { get; set; } = null!;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public static Subscription Create(Guid subscriberId, Guid creatorId)
    {
        if (subscriberId == creatorId)
            throw new DomainException("Cannot subscribe to yourself");

        return new Subscription
        {
            SubscriberId = subscriberId,
            CreatorId = creatorId,
            CreatedAt = DateTime.UtcNow
        };
    }
}
