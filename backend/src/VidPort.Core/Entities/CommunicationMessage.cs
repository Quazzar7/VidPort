using VidPort.Core.Enums;

namespace VidPort.Core.Entities;

public class CommunicationMessage
{
    public Guid Id { get; set; }
    public Guid ThreadId { get; set; }
    public CommunicationThread Thread { get; set; } = null!;
    public Guid SenderProfileId { get; set; }
    public Profile SenderProfile { get; set; } = null!;
    public CommunicationType Type { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTime? ScheduledAt { get; set; }
    public int? DurationMinutes { get; set; }
    public string? MeetingLink { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool IsRead { get; set; }
}
