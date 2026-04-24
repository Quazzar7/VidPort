using MediatR;
using Microsoft.EntityFrameworkCore;
using VidPort.Core.Entities;
using VidPort.Infrastructure.Data;

namespace VidPort.Modules.Profiles.Commands;

// ── Commands ──────────────────────────────────────────────────────────────────

public record UpsertWorkExperienceCommand(
    Guid UserId,
    Guid? Id,
    string Company,
    string Role,
    string? Location,
    DateOnly StartDate,
    DateOnly? EndDate,
    bool IsCurrent,
    string? Description
) : IRequest<Guid>;

public record DeleteWorkExperienceCommand(Guid UserId, Guid Id) : IRequest<Unit>;

// ── Handlers ──────────────────────────────────────────────────────────────────

public class UpsertWorkExperienceCommandHandler : IRequestHandler<UpsertWorkExperienceCommand, Guid>
{
    private readonly ApplicationDbContext _context;

    public UpsertWorkExperienceCommandHandler(ApplicationDbContext context) => _context = context;

    public async Task<Guid> Handle(UpsertWorkExperienceCommand request, CancellationToken ct)
    {
        var profile = await _context.Profiles
            .FirstOrDefaultAsync(p => p.UserId == request.UserId, ct)
            ?? throw new Exception("Profile not found");

        WorkExperience entry;

        if (request.Id.HasValue)
        {
            entry = await _context.WorkExperiences
                .FirstOrDefaultAsync(w => w.Id == request.Id.Value && w.ProfileId == profile.Id, ct)
                ?? throw new Exception("Work experience not found");
        }
        else
        {
            entry = new WorkExperience { Id = Guid.NewGuid(), ProfileId = profile.Id };
            _context.WorkExperiences.Add(entry);
        }

        entry.Company = request.Company;
        entry.Role = request.Role;
        entry.Location = request.Location;
        entry.StartDate = request.StartDate;
        entry.EndDate = request.IsCurrent ? null : request.EndDate;
        entry.IsCurrent = request.IsCurrent;
        entry.Description = request.Description;

        await _context.SaveChangesAsync(ct);
        return entry.Id;
    }
}

public class DeleteWorkExperienceCommandHandler : IRequestHandler<DeleteWorkExperienceCommand, Unit>
{
    private readonly ApplicationDbContext _context;

    public DeleteWorkExperienceCommandHandler(ApplicationDbContext context) => _context = context;

    public async Task<Unit> Handle(DeleteWorkExperienceCommand request, CancellationToken ct)
    {
        var profile = await _context.Profiles.FirstOrDefaultAsync(p => p.UserId == request.UserId, ct)
            ?? throw new Exception("Profile not found");

        var entry = await _context.WorkExperiences
            .FirstOrDefaultAsync(w => w.Id == request.Id && w.ProfileId == profile.Id, ct)
            ?? throw new Exception("Work experience not found");

        _context.WorkExperiences.Remove(entry);
        await _context.SaveChangesAsync(ct);
        return Unit.Value;
    }
}
