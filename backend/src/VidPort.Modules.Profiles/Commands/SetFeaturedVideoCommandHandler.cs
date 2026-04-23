using MediatR;
using Microsoft.EntityFrameworkCore;
using VidPort.Core.Enums;
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
                .FirstOrDefaultAsync(v => v.Id == request.VideoId.Value && v.ProfileId == profile.Id && v.DeletedAt == null, cancellationToken)
                ?? throw new Exception("Video not found or does not belong to this profile");

            if (video.Type != VideoType.Portfolio)
                throw new Exception("Only Portfolio videos can be set as the resume video");

            if (video.DurationSeconds.HasValue && video.DurationSeconds.Value > 60)
                throw new Exception("Resume video must be 60 seconds or under");
        }

        profile.FeaturedVideoId = request.VideoId;
        profile.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
