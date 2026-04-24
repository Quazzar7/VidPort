using VidPort.Core.Exceptions;

namespace VidPort.Core.Entities;

public class Project
{
    public Guid Id { get; set; }
    public Guid ProfileId { get; set; }
    public Profile Profile { get; set; } = null!;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Url { get; set; }
    public List<string> TechStack { get; set; } = [];
    public int CompletionPercentage { get; set; }
    public string? StatusDescription { get; set; }
    public Guid? VideoId { get; set; }
    public Video? Video { get; set; }
    public int SortOrder { get; set; }

    public void SetCompletion(int percentage)
    {
        if (percentage < 0 || percentage > 100)
            throw new DomainException("Completion percentage must be between 0 and 100");
        CompletionPercentage = percentage;
    }
}
