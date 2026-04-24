namespace VidPort.Core.Entities;

public class ProfileSkill
{
    public Guid ProfileId { get; set; }
    public Profile Profile { get; set; } = null!;
    public Guid SkillId { get; set; }
    public Skill Skill { get; set; } = null!;
    public int? Stars { get; set; } // 1-5, null = unrated
}
