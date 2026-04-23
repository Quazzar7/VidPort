using MediatR;
using Microsoft.EntityFrameworkCore;
using VidPort.Core.Entities;
using VidPort.Infrastructure.Data;
using VidPort.Modules.Uploads.Services;

namespace VidPort.Modules.Uploads.Queries;

public class GetUploadUrlQueryHandler : IRequestHandler<GetUploadUrlQuery, UploadUrlResponse>
{
    private readonly ApplicationDbContext _context;
    private readonly IS3Service _s3Service;

    public GetUploadUrlQueryHandler(ApplicationDbContext context, IS3Service s3Service)
    {
        _context = context;
        _s3Service = s3Service;
    }

    public async Task<UploadUrlResponse> Handle(GetUploadUrlQuery request, CancellationToken cancellationToken)
    {
        var profile = await _context.Profiles
            .FirstOrDefaultAsync(p => p.UserId == request.UserId, cancellationToken)
            ?? throw new Exception("Profile not found. Please create a profile first.");

        var videoId = Guid.NewGuid();
        var key = $"raw/{profile.Id}/{videoId}{GetExtension(request.ContentType)}";
        var uploadUrl = _s3Service.GeneratePreSignedUploadUrl(key, request.ContentType);

        var video = new Video
        {
            Id = videoId,
            ProfileId = profile.Id,
            S3Key = key,
            Type = request.Type,
            Status = Core.Enums.VideoStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        _context.Videos.Add(video);
        await _context.SaveChangesAsync(cancellationToken);

        return new UploadUrlResponse(videoId, uploadUrl, key);
    }

    private string GetExtension(string contentType)
    {
        return contentType switch
        {
            "video/mp4" => ".mp4",
            "video/quicktime" => ".mov",
            "video/webm" => ".webm",
            _ => ".mp4" // Default
        };
    }
}
