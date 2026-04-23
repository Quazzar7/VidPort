using MediatR;
using Microsoft.EntityFrameworkCore;
using VidPort.Infrastructure.Data;

namespace VidPort.Modules.Uploads.Commands;

public class UpdateVideoDurationCommandHandler : IRequestHandler<UpdateVideoDurationCommand, Unit>
{
    private readonly ApplicationDbContext _context;

    public UpdateVideoDurationCommandHandler(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Unit> Handle(UpdateVideoDurationCommand request, CancellationToken cancellationToken)
    {
        var video = await _context.Videos
            .Include(v => v.Profile)
            .FirstOrDefaultAsync(v => v.Id == request.VideoId && v.DeletedAt == null, cancellationToken)
            ?? throw new Exception("Video not found");

        if (!video.OwnedBy(request.UserId))
            throw new Exception("Access denied");

        video.UpdateDuration(request.DurationSeconds);
        await _context.SaveChangesAsync(cancellationToken);
        return Unit.Value;
    }
}
