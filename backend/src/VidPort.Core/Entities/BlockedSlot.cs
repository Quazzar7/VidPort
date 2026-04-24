namespace VidPort.Core.Entities;

public class BlockedSlot
{
    public Guid Id { get; set; }
    public Guid ProfileId { get; set; }
    public Profile Profile { get; set; } = null!;
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public string? Reason { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
