using MediatR;
using Microsoft.EntityFrameworkCore;
using VidPort.Infrastructure.Data;

namespace VidPort.Modules.Uploads.Commands;

public class DeleteVideoCommandHandler : IRequestHandler<DeleteVideoCommand, Unit>
{
    private readonly ApplicationDbContext _context;

    public DeleteVideoCommandHandler(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Unit> Handle(DeleteVideoCommand request, CancellationToken cancellationToken)
    {
        var video = await _context.Videos
            .Include(v => v.Profile)
            .FirstOrDefaultAsync(v => v.Id == request.VideoId && v.DeletedAt == null, cancellationToken)
            ?? throw new Exception("Video not found");

        if (video.Profile.UserId != request.UserId)
            throw new Exception("Access denied");

        video.DeletedAt = DateTime.UtcNow;

        // If this was the featured video, clear the reference
        var profile = video.Profile;
        if (profile.FeaturedVideoId == video.Id)
        {
            profile.FeaturedVideoId = null;
            profile.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync(cancellationToken);
        return Unit.Value;
    }
}
