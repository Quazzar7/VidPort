namespace VidPort.Modules.JobIntelligence.Dtos;

public record UserExpertiseProfile(
    string Role,
    string ExperienceLevel,
    List<string> Skills,
    decimal? MinSalary
);

public record JobMatchDto(
    Guid Id,
    string Title,
    string Company,
    string? Location,
    string? Description,
    string? SalaryRange,
    int Score,
    string? Url
);

public record JobInsightDto(
    Guid Id,
    string Type,
    string Title,
    string Body,
    DateTime GeneratedAt
);

public record JobTrendDto(
    string Skill,
    int JobCount,
    double WeekOverWeekChange
);

public record JobRecommendationDto(
    Guid Id,
    string Title,
    string Company,
    string? Location,
    List<string>? Skills,
    string Source,
    DateTime PostedAt
);

