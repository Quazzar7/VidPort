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
        profile.PhoneNumber = request.PhoneNumber;
        profile.AvailabilityStatus = request.AvailabilityStatus;
        profile.UpdatedAt = DateTime.UtcNow;

        await UpdateSkillsAsync(profile, request.Skills, cancellationToken);

        await _context.SaveChangesAsync(cancellationToken);
        return Unit.Value;
    }

    private async Task UpdateSkillsAsync(Profile profile, List<SkillInput> inputs, CancellationToken ct)
    {
        var current = await _context.ProfileSkills
            .Include(ps => ps.Skill)
            .Where(ps => ps.ProfileId == profile.Id)
            .ToListAsync(ct);

        var inputNames = inputs.Select(i => i.Name.Trim()).ToHashSet(StringComparer.OrdinalIgnoreCase);

        // Remove skills no longer present
        foreach (var ps in current.Where(ps => !inputNames.Contains(ps.Skill.Name)))
            _context.ProfileSkills.Remove(ps);

        // Add or update remaining
        foreach (var input in inputs)
        {
            var existing = current.FirstOrDefault(ps => ps.Skill.Name.Equals(input.Name, StringComparison.OrdinalIgnoreCase));

            if (existing != null)
            {
                existing.Stars = input.Stars;
            }
            else
            {
                var skill = await _context.Skills.FirstOrDefaultAsync(s => s.Name.ToLower() == input.Name.ToLower(), ct)
                    ?? new Skill { Id = Guid.NewGuid(), Name = input.Name.Trim() };

                if (skill.Id == Guid.Empty || !await _context.Skills.AnyAsync(s => s.Id == skill.Id, ct))
                    _context.Skills.Add(skill);

                _context.ProfileSkills.Add(new ProfileSkill
                {
                    ProfileId = profile.Id,
                    SkillId = skill.Id,
                    Stars = input.Stars
                });
            }
        }
    }
}
