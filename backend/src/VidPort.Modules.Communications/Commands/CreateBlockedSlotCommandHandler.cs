using MediatR;
using VidPort.Core.Entities;
using VidPort.Infrastructure.Data;
using VidPort.Modules.Communications.Dtos;

namespace VidPort.Modules.Communications.Commands;

public class CreateBlockedSlotCommandHandler : IRequestHandler<CreateBlockedSlotCommand, BlockedSlotDto>
{
    private readonly ApplicationDbContext _context;

    public CreateBlockedSlotCommandHandler(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<BlockedSlotDto> Handle(CreateBlockedSlotCommand request, CancellationToken ct)
    {
        var slot = new BlockedSlot
        {
            Id = Guid.NewGuid(),
            ProfileId = request.ProfileId,
            StartTime = request.StartTime,
            EndTime = request.EndTime,
            Reason = request.Reason
        };

        _context.BlockedSlots.Add(slot);
        await _context.SaveChangesAsync(ct);

        return new BlockedSlotDto(slot.Id, slot.StartTime, slot.EndTime, slot.Reason);
    }
}
