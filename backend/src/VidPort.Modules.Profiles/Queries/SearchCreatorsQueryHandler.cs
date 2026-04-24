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

        var query = _context.Profiles
            .Include(p => p.User)
            .Include(p => p.ProfileSkills).ThenInclude(ps => ps.Skill)
            .Include(p => p.WorkExperiences)
            .Include(p => p.Educations)
            .Include(p => p.Projects)
            .Where(p => p.User.Role == UserRole.Creator);

        // Apply hard filters first
        if (request.AvailabilityFilter.HasValue)
            query = query.Where(p => p.AvailabilityStatus == request.AvailabilityFilter.Value);

        if (!string.IsNullOrWhiteSpace(request.LocationFilter))
        {
            var loc = request.LocationFilter.ToLower();
            query = query.Where(p => p.Location != null && p.Location.ToLower().Contains(loc));
        }

        if (!string.IsNullOrWhiteSpace(request.SkillFilter))
        {
            var skill = request.SkillFilter.ToLower();
            query = query.Where(p => p.ProfileSkills.Any(ps => ps.Skill.Name.ToLower().Contains(skill)));
        }

        // Load filtered candidates; text search applied in-memory for multi-field matching
        var candidates = await query.ToListAsync(cancellationToken);

        List<ProfileMatchResult> matched;

        if (string.IsNullOrWhiteSpace(term))
        {
            matched = candidates.Select(p => new ProfileMatchResult(p, 0)).ToList();
        }
        else
        {
            // Score each profile across all searchable fields
            matched = candidates
                .Select(p => new ProfileMatchResult(p, ScoreProfile(p, term)))
                .Where(r => r.Score > 0)
                .OrderByDescending(r => r.Score)
                .ToList();
        }

        var profiles = matched.Take(20).Select(r => r.Profile).ToList();
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

        return profiles.Select(p =>
        {
            var currentJob = p.WorkExperiences
                .Where(w => w.IsCurrent)
                .OrderByDescending(w => w.StartDate)
                .FirstOrDefault();

            var topSkills = p.ProfileSkills
                .OrderByDescending(ps => ps.Stars ?? 0)
                .Take(5)
                .Select(ps => new SkillDto(ps.Skill.Name, ps.Stars))
                .ToList();

            return new CreatorSearchResultDto(
                p.Id,
                p.Slug,
                p.User.Email,
                p.Headline,
                p.Location,
                p.AvailabilityStatus,
                topSkills,
                currentJob != null ? $"{currentJob.Role} at {currentJob.Company}" : null,
                countMap.GetValueOrDefault(p.Id, 0),
                subscribedCreators.Contains(p.Id)
            );
        }).ToList();
    }

    private static int ScoreProfile(VidPort.Core.Entities.Profile p, string term)
    {
        int score = 0;

        // High-weight fields
        if (p.Headline != null && p.Headline.ToLower().Contains(term)) score += 10;
        if (p.Bio != null && p.Bio.ToLower().Contains(term)) score += 5;
        if (p.Location != null && p.Location.ToLower().Contains(term)) score += 4;

        // Skills
        if (p.ProfileSkills.Any(ps => ps.Skill.Name.ToLower().Contains(term))) score += 8;

        // Work experience
        foreach (var w in p.WorkExperiences)
        {
            if (w.Company.ToLower().Contains(term)) score += 6;
            if (w.Role.ToLower().Contains(term)) score += 6;
            if (w.Description != null && w.Description.ToLower().Contains(term)) score += 2;
        }

        // Education
        foreach (var e in p.Educations)
        {
            if (e.Institution.ToLower().Contains(term)) score += 4;
            if (e.FieldOfStudy != null && e.FieldOfStudy.ToLower().Contains(term)) score += 3;
            if (e.Degree != null && e.Degree.ToLower().Contains(term)) score += 3;
        }

        // Projects
        foreach (var proj in p.Projects)
        {
            if (proj.Name.ToLower().Contains(term)) score += 5;
            if (proj.Description != null && proj.Description.ToLower().Contains(term)) score += 2;
            if (proj.TechStack.Any(t => t.ToLower().Contains(term))) score += 4;
        }

        return score;
    }

    private record ProfileMatchResult(VidPort.Core.Entities.Profile Profile, int Score);
}
