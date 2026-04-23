using VidPort.Core.Enums;

namespace VidPort.Modules.Profiles.Dtos;

public record ProfileDto(
    Guid Id,
    string Slug,
    string? Headline,
    string? Bio,
    string? Location,
    AvailabilityStatus AvailabilityStatus,
    List<string> Skills
);
