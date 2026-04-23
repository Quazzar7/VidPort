using Hangfire;
using MediatR;
using Microsoft.EntityFrameworkCore;
using VidPort.Infrastructure.Data;
using VidPort.Modules.Uploads.Jobs;

namespace VidPort.Modules.Uploads.Commands;

public class CompleteUploadCommandHandler : IRequestHandler<CompleteUploadCommand>
{
    private readonly ApplicationDbContext _context;
    private readonly IBackgroundJobClient _backgroundJobClient;

    public CompleteUploadCommandHandler(ApplicationDbContext context, IBackgroundJobClient backgroundJobClient)
    {
        _context = context;
        _backgroundJobClient = backgroundJobClient;
    }

    public async Task Handle(CompleteUploadCommand request, CancellationToken cancellationToken)
    {
        var video = await _context.Videos.FindAsync(new object[] { request.VideoId }, cancellationToken)
            ?? throw new Exception("Video not found");

        video.MarkAsProcessing();
        await _context.SaveChangesAsync(cancellationToken);

        _backgroundJobClient.Enqueue<IProcessVideoJob>(job => job.ExecuteAsync(video.Id, CancellationToken.None));
    }
}
