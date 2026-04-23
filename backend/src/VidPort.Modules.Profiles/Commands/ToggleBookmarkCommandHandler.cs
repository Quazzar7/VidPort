using MediatR;
using Microsoft.EntityFrameworkCore;
using VidPort.Core.Entities;
using VidPort.Infrastructure.Data;

namespace VidPort.Modules.Profiles.Commands;

public class ToggleVideoBookmarkCommandHandler : IRequestHandler<ToggleVideoBookmarkCommand, bool>
{
    private readonly ApplicationDbContext _context;

    public ToggleVideoBookmarkCommandHandler(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(ToggleVideoBookmarkCommand request, CancellationToken cancellationToken)
    {
        var existing = await _context.Bookmarks
            .FirstOrDefaultAsync(b => b.ProfileId == request.ProfileId && b.VideoId == request.VideoId, cancellationToken);

        if (existing != null)
        {
            _context.Bookmarks.Remove(existing);
            await _context.SaveChangesAsync(cancellationToken);
            return false;
        }

        _context.Bookmarks.Add(Bookmark.ForVideo(request.ProfileId, request.VideoId));
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}

public class ToggleProfileBookmarkCommandHandler : IRequestHandler<ToggleProfileBookmarkCommand, bool>
{
    private readonly ApplicationDbContext _context;

    public ToggleProfileBookmarkCommandHandler(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(ToggleProfileBookmarkCommand request, CancellationToken cancellationToken)
    {
        var existing = await _context.Bookmarks
            .FirstOrDefaultAsync(b => b.ProfileId == request.ProfileId && b.BookmarkedProfileId == request.TargetProfileId, cancellationToken);

        if (existing != null)
        {
            _context.Bookmarks.Remove(existing);
            await _context.SaveChangesAsync(cancellationToken);
            return false;
        }

        _context.Bookmarks.Add(Bookmark.ForProfile(request.ProfileId, request.TargetProfileId));
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
