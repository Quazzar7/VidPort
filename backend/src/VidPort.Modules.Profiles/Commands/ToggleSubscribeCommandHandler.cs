using MediatR;
using Microsoft.EntityFrameworkCore;
using VidPort.Core.Entities;
using VidPort.Infrastructure.Data;

namespace VidPort.Modules.Profiles.Commands;

public class ToggleSubscribeCommandHandler : IRequestHandler<ToggleSubscribeCommand, bool>
{
    private readonly ApplicationDbContext _context;

    public ToggleSubscribeCommandHandler(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(ToggleSubscribeCommand request, CancellationToken cancellationToken)
    {
        var existing = await _context.Subscriptions
            .FirstOrDefaultAsync(s => s.SubscriberId == request.SubscriberProfileId && s.CreatorId == request.CreatorProfileId, cancellationToken);

        if (existing != null)
        {
            _context.Subscriptions.Remove(existing);
            await _context.SaveChangesAsync(cancellationToken);
            return false;
        }

        _context.Subscriptions.Add(Subscription.Create(request.SubscriberProfileId, request.CreatorProfileId));
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
