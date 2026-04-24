using VidPort.Core.Enums;

namespace VidPort.Modules.Communications.Dtos;

public record CommunicationMessageDto(
    Guid Id,
    Guid ThreadId,
    Guid SenderProfileId,
    string SenderHeadline,
    CommunicationType Type,
    string Content,
    DateTime? ScheduledAt,
    int? DurationMinutes,
    string? MeetingLink,
    DateTime CreatedAt,
    bool IsRead
);

public record BlockedSlotDto(
    Guid Id,
    DateTime StartTime,
    DateTime EndTime,
    string? Reason
);

public record CommunicationThreadDto(
    Guid Id,
    Guid OtherProfileId,
    string OtherHeadline,
    string OtherSlug,
    DateTime UpdatedAt,
    CommunicationMessageDto? LastMessage
);
