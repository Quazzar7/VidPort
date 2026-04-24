namespace VidPort.Core.Entities;

public class RawJob
{
    public Guid Id { get; set; }
    public string ExternalId { get; set; } = null!;
    public string Source { get; set; } = null!;
    public string Title { get; set; } = null!;
    public string Company { get; set; } = null!;
    public string? Location { get; set; }
    public string? Description { get; set; }
    public string[]? Skills { get; set; }
    public decimal? SalaryMin { get; set; }
    public decimal? SalaryMax { get; set; }
    public DateTime PostedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public bool IsProcessed { get; set; }
}
