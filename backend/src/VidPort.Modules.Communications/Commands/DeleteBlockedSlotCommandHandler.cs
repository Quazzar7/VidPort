using MediatR;
using Microsoft.EntityFrameworkCore;
using VidPort.Core.Exceptions;
using VidPort.Infrastructure.Data;

namespace VidPort.Modules.Communications.Commands;

public class DeleteBlockedSlotCommandHandler : IRequestHandler<DeleteBlockedSlotCommand>
{
    private readonly ApplicationDbContext _context;

    public DeleteBlockedSlotCommandHandler(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task Handle(DeleteBlockedSlotCommand request, CancellationToken ct)
    {
        var slot = await _context.BlockedSlots
            .FirstOrDefaultAsync(s => s.Id == request.Id, ct)
            ?? throw new DomainException("Blocked slot not found");

        if (slot.ProfileId != request.ProfileId)
            throw new DomainException("Permission denied");

        _context.BlockedSlots.Remove(slot);
        await _context.SaveChangesAsync(ct);
    }
}
