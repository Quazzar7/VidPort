using MediatR;
using Microsoft.EntityFrameworkCore;
using VidPort.Infrastructure.Data;

namespace VidPort.Modules.Profiles.Commands;

public class SetFeaturedVideoCommandHandler : IRequestHandler<SetFeaturedVideoCommand, Unit>
{
    private readonly ApplicationDbContext _context;

    public SetFeaturedVideoCommandHandler(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Unit> Handle(SetFeaturedVideoCommand request, CancellationToken cancellationToken)
    {
        var profile = await _context.Profiles
            .FirstOrDefaultAsync(p => p.UserId == request.UserId, cancellationToken)
            ?? throw new Exception("Profile not found");

        if (request.VideoId.HasValue)
        {
            var video = await _context.Videos
                .FirstOrDefaultAsync(v => v.Id == request.VideoId.Value && v.DeletedAt == null, cancellationToken)
                ?? throw new Exception("Video not found");

            profile.SetFeaturedVideo(video);
        }
        else
        {
            profile.ClearFeaturedVideo();
        }

        await _context.SaveChangesAsync(cancellationToken);
        return Unit.Value;
    }
}
