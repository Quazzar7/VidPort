namespace VidPort.Core.Entities;

public class Education
{
    public Guid Id { get; set; }
    public Guid ProfileId { get; set; }
    public Profile Profile { get; set; } = null!;
    public string Institution { get; set; } = string.Empty;
    public string? Degree { get; set; }
    public string? FieldOfStudy { get; set; }
    public int? StartYear { get; set; }
    public int? GraduationYear { get; set; }
    public string? Grade { get; set; }
    public string? Description { get; set; }
    public int SortOrder { get; set; }
}
