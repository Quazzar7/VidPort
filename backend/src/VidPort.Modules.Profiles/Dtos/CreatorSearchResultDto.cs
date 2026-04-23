namespace VidPort.Modules.Profiles.Dtos;

public record CreatorSearchResultDto(
    Guid ProfileId,
    string Slug,
    string Email,
    string? PhoneNumber,
    string? Headline,
    string? Location,
    List<string> Skills,
    int SubscriberCount,
    bool IsSubscribed
);
