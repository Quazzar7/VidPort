using MediatR;
using VidPort.Core.Enums;
using VidPort.Modules.Communications.Dtos;

namespace VidPort.Modules.Communications.Commands;

public record SendMessageCommand(
    Guid ThreadId,
    Guid SenderProfileId,
    CommunicationType Type,
    string Content,
    DateTime? ScheduledAt = null,
    int? DurationMinutes = null,
    string? MeetingLink = null
) : IRequest<CommunicationMessageDto>;
