using MediatR;
using Microsoft.EntityFrameworkCore;
using VidPort.Core.Entities;
using VidPort.Infrastructure.Data;

namespace VidPort.Modules.Profiles.Commands;

public class UpdateProfileCommandHandler : IRequestHandler<UpdateProfileCommand, Unit>
{
    private readonly ApplicationDbContext _context;

    public UpdateProfileCommandHandler(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Unit> Handle(UpdateProfileCommand request, CancellationToken cancellationToken)
    {
        var profile = await _context.Profiles
            .Include(p => p.ProfileSkills)
            .ThenInclude(ps => ps.Skill)
            .FirstOrDefaultAsync(p => p.UserId == request.UserId, cancellationToken)
            ?? throw new Exception("Profile not found");

        profile.Headline = request.Headline;
        profile.Bio = request.Bio;
        profile.Location = request.Location;
        profile.AvailabilityStatus = request.AvailabilityStatus;
        profile.UpdatedAt = DateTime.UtcNow;

        // Update Skills
        await UpdateSkillsAsync(profile, request.Skills, cancellationToken);

        await _context.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }

    private async Task UpdateSkillsAsync(Profile profile, List<string> skillNames, CancellationToken cancellationToken)
    {
        // 1. Fetch current skills from DB to ensure everything is tracked and loaded
        var currentProfileSkills = await _context.ProfileSkills
            .Include(ps => ps.Skill)
            .Where(ps => ps.ProfileId == profile.Id)
            .ToListAsync(cancellationToken);

        // 2. Remove skills no longer in the request
        var skillsToRemove = currentProfileSkills
            .Where(ps => !skillNames.Contains(ps.Skill.Name, StringComparer.OrdinalIgnoreCase))
            .ToList();

        foreach (var ps in skillsToRemove)
        {
            _context.ProfileSkills.Remove(ps);
        }

        // 3. Add new skills
        foreach (var skillName in skillNames)
        {
            var isAlreadyAssociated = currentProfileSkills
                .Any(ps => ps.Skill.Name.Equals(skillName, StringComparison.OrdinalIgnoreCase));

            if (!isAlreadyAssociated)
            {
                var skill = await _context.Skills
                    .FirstOrDefaultAsync(s => s.Name.ToLower() == skillName.ToLower(), cancellationToken);

                if (skill == null)
                {
                    skill = new Skill { Id = Guid.NewGuid(), Name = skillName };
                    _context.Skills.Add(skill);
                }

                _context.ProfileSkills.Add(new ProfileSkill
                {
                    ProfileId = profile.Id,
                    SkillId = skill.Id
                });
            }
        }
    }
}
