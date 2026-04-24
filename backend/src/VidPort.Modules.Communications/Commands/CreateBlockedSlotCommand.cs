using MediatR;
using VidPort.Modules.Communications.Dtos;

namespace VidPort.Modules.Communications.Commands;

public record CreateBlockedSlotCommand(
    Guid ProfileId,
    DateTime StartTime,
    DateTime EndTime,
    string? Reason
) : IRequest<BlockedSlotDto>;
