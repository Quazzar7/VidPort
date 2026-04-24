using MediatR;
using Microsoft.EntityFrameworkCore;
using VidPort.Core.Entities;
using VidPort.Infrastructure.Data;

namespace VidPort.Modules.Profiles.Commands;

// ── Commands ──────────────────────────────────────────────────────────────────

public record UpsertEducationCommand(
    Guid UserId,
    Guid? Id,
    string Institution,
    string? Degree,
    string? FieldOfStudy,
    int? StartYear,
    int? GraduationYear,
    string? Grade,
    string? Description
) : IRequest<Guid>;

public record DeleteEducationCommand(Guid UserId, Guid Id) : IRequest<Unit>;

// ── Handlers ──────────────────────────────────────────────────────────────────

public class UpsertEducationCommandHandler : IRequestHandler<UpsertEducationCommand, Guid>
{
    private readonly ApplicationDbContext _context;

    public UpsertEducationCommandHandler(ApplicationDbContext context) => _context = context;

    public async Task<Guid> Handle(UpsertEducationCommand request, CancellationToken ct)
    {
        var profile = await _context.Profiles
            .FirstOrDefaultAsync(p => p.UserId == request.UserId, ct)
            ?? throw new Exception("Profile not found");

        Education entry;

        if (request.Id.HasValue)
        {
            entry = await _context.Educations
                .FirstOrDefaultAsync(e => e.Id == request.Id.Value && e.ProfileId == profile.Id, ct)
                ?? throw new Exception("Education not found");
        }
        else
        {
            var maxSort = await _context.Educations
                .Where(e => e.ProfileId == profile.Id)
                .Select(e => (int?)e.SortOrder)
                .MaxAsync(ct) ?? -1;

            entry = new Education { Id = Guid.NewGuid(), ProfileId = profile.Id, SortOrder = maxSort + 1 };
            _context.Educations.Add(entry);
        }

        entry.Institution = request.Institution;
        entry.Degree = request.Degree;
        entry.FieldOfStudy = request.FieldOfStudy;
        entry.StartYear = request.StartYear;
        entry.GraduationYear = request.GraduationYear;
        entry.Grade = request.Grade;
        entry.Description = request.Description;

        await _context.SaveChangesAsync(ct);
        return entry.Id;
    }
}

public class DeleteEducationCommandHandler : IRequestHandler<DeleteEducationCommand, Unit>
{
    private readonly ApplicationDbContext _context;

    public DeleteEducationCommandHandler(ApplicationDbContext context) => _context = context;

    public async Task<Unit> Handle(DeleteEducationCommand request, CancellationToken ct)
    {
        var profile = await _context.Profiles
            .FirstOrDefaultAsync(p => p.UserId == request.UserId, ct)
            ?? throw new Exception("Profile not found");

        var entry = await _context.Educations
            .FirstOrDefaultAsync(e => e.Id == request.Id && e.ProfileId == profile.Id, ct)
            ?? throw new Exception("Education not found");

        _context.Educations.Remove(entry);
        await _context.SaveChangesAsync(ct);
        return Unit.Value;
    }
}
