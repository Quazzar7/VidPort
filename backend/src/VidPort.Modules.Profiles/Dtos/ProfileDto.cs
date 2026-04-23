using VidPort.Core.Enums;

namespace VidPort.Modules.Profiles.Dtos;

public record ProfileDto(
    Guid Id,
    string Slug,
    string? Headline,
    string? Bio,
    string? Location,
    string? PhoneNumber,
    AvailabilityStatus AvailabilityStatus,
    List<string> Skills,
    Guid? FeaturedVideoId,
    int SubscriberCount,
    bool IsSubscribed
);
