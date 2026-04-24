using MediatR;
using VidPort.Core.Enums;
using VidPort.Modules.Communications.Dtos;

namespace VidPort.Modules.Communications.Commands;

public record InitiateThreadCommand(
    Guid InitiatorProfileId,
    Guid RecipientProfileId,
    CommunicationType Type,
    string Content,
    DateTime? ScheduledAt = null,
    int? DurationMinutes = null,
    string? MeetingLink = null
) : IRequest<CommunicationThreadDto>;
