using MediatR;
using VidPort.Modules.Communications.Dtos;

namespace VidPort.Modules.Communications.Queries;

public record GetBlockedSlotsQuery(Guid ProfileId) : IRequest<List<BlockedSlotDto>>;
