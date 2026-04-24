using MediatR;
using VidPort.Core.Enums;
using VidPort.Modules.Communications.Dtos;

namespace VidPort.Modules.Communications.Commands;

public record UpdateMessageCommand(
    Guid MessageId,
    Guid ProfileId,
    string Content,
    DateTime? ScheduledAt,
    int? DurationMinutes,
    string? MeetingLink
) : IRequest<CommunicationMessageDto>;
