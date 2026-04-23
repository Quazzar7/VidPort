using MediatR;
using Microsoft.EntityFrameworkCore;
using VidPort.Core.Entities;
using VidPort.Core.Enums;
using VidPort.Infrastructure.Data;
using VidPort.Modules.Profiles.Dtos;

namespace VidPort.Modules.Profiles.Queries;

public class GetMyProfileQueryHandler : IRequestHandler<GetMyProfileQuery, ProfileDto>
{
    private readonly ApplicationDbContext _context;

    public GetMyProfileQueryHandler(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ProfileDto> Handle(GetMyProfileQuery request, CancellationToken cancellationToken)
    {
        var profile = await _context.Profiles
            .Include(p => p.User)
            .Include(p => p.ProfileSkills)
            .ThenInclude(ps => ps.Skill)
            .FirstOrDefaultAsync(p => p.UserId == request.UserId, cancellationToken);

        if (profile == null)
        {
            var user = await _context.Users.FindAsync(new object[] { request.UserId }, cancellationToken)
                ?? throw new Exception("User not found");

            profile = new Profile
            {
                Id = Guid.NewGuid(),
                UserId = request.UserId,
                Slug = GenerateInitialSlug(user.Email),
                AvailabilityStatus = AvailabilityStatus.OpenToWork,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Profiles.Add(profile);
            await _context.SaveChangesAsync(cancellationToken);
        }

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

    private string GenerateInitialSlug(string email)
    {
        var namePart = email.Split('@')[0];
        return $"{namePart.ToLower()}-{Guid.NewGuid().ToString()[..4]}";
    }
}
