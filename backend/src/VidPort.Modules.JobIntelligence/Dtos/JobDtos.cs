namespace VidPort.Modules.JobIntelligence.Dtos;

public record JobInsightDto(
    Guid Id,
    string Type,
    string Title,
    string Body,
    DateTime GeneratedAt);

public record JobTrendDto(
    string Skill,
    int JobCount,
    int WeekOverWeekChange);

public record JobRecommendationDto(
    Guid Id,
    string Title,
    string Company,
    string? Location,
    string[]? Skills,
    string Source,
    DateTime PostedAt);
