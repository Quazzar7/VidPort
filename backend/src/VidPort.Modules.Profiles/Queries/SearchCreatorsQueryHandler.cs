using MediatR;
using Microsoft.EntityFrameworkCore;
using VidPort.Core.Enums;
using VidPort.Infrastructure.Data;
using VidPort.Modules.Profiles.Dtos;

namespace VidPort.Modules.Profiles.Queries;

public class SearchCreatorsQueryHandler : IRequestHandler<SearchCreatorsQuery, List<CreatorSearchResultDto>>
{
    private readonly ApplicationDbContext _context;

    public SearchCreatorsQueryHandler(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<CreatorSearchResultDto>> Handle(SearchCreatorsQuery request, CancellationToken cancellationToken)
    {
        var term = request.Term.Trim().ToLower();
        if (string.IsNullOrEmpty(term))
            return [];

        var profiles = await _context.Profiles
            .Include(p => p.User)
            .Include(p => p.ProfileSkills)
            .ThenInclude(ps => ps.Skill)
            .Where(p => p.User.Role == UserRole.Creator &&
                        (p.User.Email.ToLower().Contains(term) ||
                         (p.PhoneNumber != null && p.PhoneNumber.Contains(term))))
            .Take(20)
            .ToListAsync(cancellationToken);

        var profileIds = profiles.Select(p => p.Id).ToList();

        var subscriberCounts = await _context.Subscriptions
            .Where(s => profileIds.Contains(s.CreatorId))
            .GroupBy(s => s.CreatorId)
            .Select(g => new { CreatorId = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        var countMap = subscriberCounts.ToDictionary(x => x.CreatorId, x => x.Count);

        HashSet<Guid> subscribedCreators = [];
        if (request.ViewerProfileId.HasValue)
        {
            var subs = await _context.Subscriptions
                .Where(s => s.SubscriberId == request.ViewerProfileId.Value && profileIds.Contains(s.CreatorId))
                .Select(s => s.CreatorId)
                .ToListAsync(cancellationToken);
            subscribedCreators = [.. subs];
        }

        return profiles.Select(p => new CreatorSearchResultDto(
            p.Id,
            p.Slug,
            p.User.Email,
            p.PhoneNumber,
            p.Headline,
            p.Location,
            p.ProfileSkills.Select(ps => ps.Skill.Name).ToList(),
            countMap.GetValueOrDefault(p.Id, 0),
            subscribedCreators.Contains(p.Id)
        )).ToList();
    }
}
