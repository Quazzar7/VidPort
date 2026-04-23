using MediatR;
using Microsoft.EntityFrameworkCore;
using VidPort.Infrastructure.Data;
using VidPort.Modules.Profiles.Dtos;

namespace VidPort.Modules.Profiles.Queries;

public class GetProfileBySlugQueryHandler : IRequestHandler<GetProfileBySlugQuery, ProfileDto>
{
    private readonly ApplicationDbContext _context;

    public GetProfileBySlugQueryHandler(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ProfileDto> Handle(GetProfileBySlugQuery request, CancellationToken cancellationToken)
    {
        var profile = await _context.Profiles
            .Include(p => p.ProfileSkills)
            .ThenInclude(ps => ps.Skill)
            .FirstOrDefaultAsync(p => p.Slug == request.Slug, cancellationToken)
            ?? throw new Exception("Profile not found");

        return new ProfileDto(
            profile.Id,
            profile.Slug,
            profile.Headline,
            profile.Bio,
            profile.Location,
            profile.AvailabilityStatus,
            profile.ProfileSkills.Select(ps => ps.Skill.Name).ToList()
        );
    }
}
