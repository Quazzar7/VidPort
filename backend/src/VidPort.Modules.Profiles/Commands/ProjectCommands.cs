using MediatR;
using Microsoft.EntityFrameworkCore;
using VidPort.Core.Entities;
using VidPort.Infrastructure.Data;

namespace VidPort.Modules.Profiles.Commands;

// ── Commands ──────────────────────────────────────────────────────────────────

public record UpsertProjectCommand(
    Guid UserId,
    Guid? Id,
    string Name,
    string? Description,
    string? Url,
    List<string> TechStack,
    int CompletionPercentage,
    string? StatusDescription,
    Guid? VideoId
) : IRequest<Guid>;

public record DeleteProjectCommand(Guid UserId, Guid Id) : IRequest<Unit>;

// ── Handlers ──────────────────────────────────────────────────────────────────

public class UpsertProjectCommandHandler : IRequestHandler<UpsertProjectCommand, Guid>
{
    private readonly ApplicationDbContext _context;

    public UpsertProjectCommandHandler(ApplicationDbContext context) => _context = context;

    public async Task<Guid> Handle(UpsertProjectCommand request, CancellationToken ct)
    {
        var profile = await _context.Profiles
            .FirstOrDefaultAsync(p => p.UserId == request.UserId, ct)
            ?? throw new Exception("Profile not found");

        Project entry;

        if (request.Id.HasValue)
        {
            entry = await _context.Projects
                .FirstOrDefaultAsync(p => p.Id == request.Id.Value && p.ProfileId == profile.Id, ct)
                ?? throw new Exception("Project not found");
        }
        else
        {
            var maxSort = await _context.Projects
                .Where(p => p.ProfileId == profile.Id)
                .Select(p => (int?)p.SortOrder)
                .MaxAsync(ct) ?? -1;

            entry = new Project { Id = Guid.NewGuid(), ProfileId = profile.Id, SortOrder = maxSort + 1 };
            _context.Projects.Add(entry);
        }

        if (request.VideoId.HasValue)
        {
            var videoExists = await _context.Videos
                .AnyAsync(v => v.Id == request.VideoId.Value && v.Profile.UserId == request.UserId, ct);
            if (!videoExists)
                throw new Exception("Video not found or does not belong to this profile");
        }

        entry.Name = request.Name;
        entry.Description = request.Description;
        entry.Url = request.Url;
        entry.TechStack = request.TechStack;
        entry.SetCompletion(request.CompletionPercentage);
        entry.StatusDescription = request.StatusDescription;
        entry.VideoId = request.VideoId;

        await _context.SaveChangesAsync(ct);
        return entry.Id;
    }
}

public class DeleteProjectCommandHandler : IRequestHandler<DeleteProjectCommand, Unit>
{
    private readonly ApplicationDbContext _context;

    public DeleteProjectCommandHandler(ApplicationDbContext context) => _context = context;

    public async Task<Unit> Handle(DeleteProjectCommand request, CancellationToken ct)
    {
        var profile = await _context.Profiles
            .FirstOrDefaultAsync(p => p.UserId == request.UserId, ct)
            ?? throw new Exception("Profile not found");

        var entry = await _context.Projects
            .FirstOrDefaultAsync(p => p.Id == request.Id && p.ProfileId == profile.Id, ct)
            ?? throw new Exception("Project not found");

        _context.Projects.Remove(entry);
        await _context.SaveChangesAsync(ct);
        return Unit.Value;
    }
}
