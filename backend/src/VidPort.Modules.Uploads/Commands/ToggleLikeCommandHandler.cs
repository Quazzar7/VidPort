using MediatR;
using Microsoft.EntityFrameworkCore;
using VidPort.Core.Entities;
using VidPort.Infrastructure.Data;

namespace VidPort.Modules.Uploads.Commands;

public class ToggleLikeCommandHandler : IRequestHandler<ToggleLikeCommand, bool>
{
    private readonly ApplicationDbContext _context;

    public ToggleLikeCommandHandler(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(ToggleLikeCommand request, CancellationToken cancellationToken)
    {
        var existing = await _context.VideoLikes
            .FirstOrDefaultAsync(l => l.VideoId == request.VideoId && l.ProfileId == request.ProfileId, cancellationToken);

        if (existing != null)
        {
            _context.VideoLikes.Remove(existing);
            await _context.SaveChangesAsync(cancellationToken);
            return false;
        }

        _context.VideoLikes.Add(new VideoLike
        {
            Id = Guid.NewGuid(),
            VideoId = request.VideoId,
            ProfileId = request.ProfileId,
            CreatedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
