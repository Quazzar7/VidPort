using Microsoft.EntityFrameworkCore;
using VidPort.Core.Enums;
using VidPort.Infrastructure.Data;

namespace VidPort.Modules.Uploads.Jobs;

public class ProcessVideoJob : IProcessVideoJob
{
    private readonly ApplicationDbContext _context;

    public ProcessVideoJob(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task ExecuteAsync(Guid videoId, CancellationToken cancellationToken)
    {
        var video = await _context.Videos.FindAsync(new object[] { videoId }, cancellationToken);
        if (video == null) return;

        try
        {
            // TODO: Integrate FFmpeg here for metadata extraction and thumbnail generation
            // For now, simulate processing time
            await Task.Delay(5000, cancellationToken);

            video.Status = VideoStatus.Complete;
            video.DurationSeconds = 60; // Mock duration
            video.ThumbnailUrl = "https://placehold.co/600x400?text=Video+Thumbnail";
        }
        catch (Exception)
        {
            video.Status = VideoStatus.Failed;
        }

        await _context.SaveChangesAsync(cancellationToken);
    }
}
