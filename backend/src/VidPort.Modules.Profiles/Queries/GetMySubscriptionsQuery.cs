using MediatR;
using Microsoft.EntityFrameworkCore;
using VidPort.Infrastructure.Data;

namespace VidPort.Modules.Profiles.Queries;

public record SubscribedCreatorDto(
    Guid ProfileId,
    string Slug,
    string? Headline,
    string? Location,
    int SubscriberCount,
    DateTime SubscribedAt
);

public record GetMySubscriptionsQuery(Guid UserId) : IRequest<List<SubscribedCreatorDto>>;

public class GetMySubscriptionsQueryHandler : IRequestHandler<GetMySubscriptionsQuery, List<SubscribedCreatorDto>>
{
    private readonly ApplicationDbContext _context;

    public GetMySubscriptionsQueryHandler(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<SubscribedCreatorDto>> Handle(GetMySubscriptionsQuery request, CancellationToken cancellationToken)
    {
        var profile = await _context.Profiles
            .FirstOrDefaultAsync(p => p.UserId == request.UserId, cancellationToken);

        if (profile is null) return [];

        var subs = await _context.Subscriptions
            .Where(s => s.SubscriberId == profile.Id)
            .Include(s => s.Creator)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync(cancellationToken);

        var creatorIds = subs.Select(s => s.CreatorId).ToList();
        var subscriberCounts = await _context.Subscriptions
            .Where(s => creatorIds.Contains(s.CreatorId))
            .GroupBy(s => s.CreatorId)
            .Select(g => new { CreatorId = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        var countMap = subscriberCounts.ToDictionary(x => x.CreatorId, x => x.Count);

        return subs.Select(s => new SubscribedCreatorDto(
            s.CreatorId,
            s.Creator.Slug,
            s.Creator.Headline,
            s.Creator.Location,
            countMap.GetValueOrDefault(s.CreatorId, 0),
            s.CreatedAt
        )).ToList();
    }
}
