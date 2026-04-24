namespace VidPort.Core.Entities;

public class JobInsight
{
    public Guid Id { get; set; }
    public string Type { get; set; } = null!;
    public string Title { get; set; } = null!;
    public string Body { get; set; } = null!;
    public DateTime GeneratedAt { get; set; }
    public bool IsActive { get; set; }
}
