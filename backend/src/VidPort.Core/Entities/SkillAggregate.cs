namespace VidPort.Core.Entities;

public class SkillAggregate
{
    public Guid Id { get; set; }
    public string SkillName { get; set; } = null!;
    public int JobCount { get; set; }
    public int WeekOverWeekChange { get; set; }
    public DateTime PeriodStart { get; set; }
    public DateTime PeriodEnd { get; set; }
    public DateTime ComputedAt { get; set; }
}
