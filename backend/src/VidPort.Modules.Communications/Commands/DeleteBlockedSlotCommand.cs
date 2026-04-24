using MediatR;

namespace VidPort.Modules.Communications.Commands;

public record DeleteBlockedSlotCommand(Guid Id, Guid ProfileId) : IRequest;
