using MediatR;
using Microsoft.EntityFrameworkCore;
using VidPort.Infrastructure.Data;
using VidPort.Modules.Communications.Dtos;

namespace VidPort.Modules.Communications.Queries;

public class GetBlockedSlotsQueryHandler : IRequestHandler<GetBlockedSlotsQuery, List<BlockedSlotDto>>
{
    private readonly ApplicationDbContext _context;

    public GetBlockedSlotsQueryHandler(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<BlockedSlotDto>> Handle(GetBlockedSlotsQuery request, CancellationToken ct)
    {
        var slots = await _context.BlockedSlots
            .Where(s => s.ProfileId == request.ProfileId)
            .OrderBy(s => s.StartTime)
            .ToListAsync(ct);

        return slots.Select(s => new BlockedSlotDto(
            s.Id,
            s.StartTime,
            s.EndTime,
            s.Reason
        )).ToList();
    }
}
