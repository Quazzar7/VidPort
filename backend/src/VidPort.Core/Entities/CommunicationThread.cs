namespace VidPort.Core.Entities;

public class CommunicationThread
{
    public Guid Id { get; set; }
    public Guid InitiatorProfileId { get; set; }
    public Profile InitiatorProfile { get; set; } = null!;
    public Guid RecipientProfileId { get; set; }
    public Profile RecipientProfile { get; set; } = null!;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<CommunicationMessage> Messages { get; set; } = [];
}
