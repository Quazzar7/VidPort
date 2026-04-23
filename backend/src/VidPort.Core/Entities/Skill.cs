namespace VidPort.Core.Entities;

public class Skill
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Category { get; set; }
    public ICollection<ProfileSkill> ProfileSkills { get; set; } = new List<ProfileSkill>();
}
