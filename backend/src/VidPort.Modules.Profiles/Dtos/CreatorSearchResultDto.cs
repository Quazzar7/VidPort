using VidPort.Core.Enums;

namespace VidPort.Modules.Profiles.Dtos;

public record CreatorSearchResultDto(
    Guid ProfileId,
    string Slug,
    string Email,
    string? Headline,
    string? Location,
    AvailabilityStatus AvailabilityStatus,
    List<SkillDto> TopSkills,
    string? CurrentRole,
    int SubscriberCount,
    bool IsSubscribed
);
