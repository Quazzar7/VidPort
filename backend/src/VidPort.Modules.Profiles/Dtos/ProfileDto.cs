using VidPort.Core.Enums;

namespace VidPort.Modules.Profiles.Dtos;

public record SkillDto(string Name, int? Stars);

public record WorkExperienceDto(
    Guid Id,
    string Company,
    string Role,
    string? Location,
    DateOnly StartDate,
    DateOnly? EndDate,
    bool IsCurrent,
    string? Description,
    int SortOrder
);

public record EducationDto(
    Guid Id,
    string Institution,
    string? Degree,
    string? FieldOfStudy,
    int? StartYear,
    int? GraduationYear,
    string? Grade,
    string? Description,
    int SortOrder
);

public record ProjectDto(
    Guid Id,
    string Name,
    string? Description,
    string? Url,
    List<string> TechStack,
    int CompletionPercentage,
    string? StatusDescription,
    Guid? VideoId,
    string? VideoUrl,
    int SortOrder
);

public record ProfileDto(
    Guid Id,
    string Slug,
    string? Headline,
    string? Bio,
    string? Location,
    string? PhoneNumber,
    AvailabilityStatus AvailabilityStatus,
    List<SkillDto> Skills,
    Guid? FeaturedVideoId,
    int SubscriberCount,
    bool IsSubscribed,
    UserRole Role,
    List<WorkExperienceDto> WorkExperiences,
    List<EducationDto> Educations,
    List<ProjectDto> Projects
);
