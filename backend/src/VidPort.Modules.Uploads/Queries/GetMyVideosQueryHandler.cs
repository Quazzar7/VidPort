using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using VidPort.Infrastructure.Data;
using VidPort.Modules.Uploads.Configuration;

namespace VidPort.Modules.Uploads.Queries;

public class GetMyVideosQueryHandler : IRequestHandler<GetMyVideosQuery, List<VideoDto>>
{
    private readonly ApplicationDbContext _context;
    private readonly S3Options _s3Options;

    public GetMyVideosQueryHandler(ApplicationDbContext context, IOptions<S3Options> s3Options)
    {
        _context = context;
        _s3Options = s3Options.Value;
    }

    public async Task<List<VideoDto>> Handle(GetMyVideosQuery request, CancellationToken cancellationToken)
    {
        var profile = await _context.Profiles
            .FirstOrDefaultAsync(p => p.UserId == request.UserId, cancellationToken);

        if (profile is null)
            return [];

        var baseUrl = _s3Options.ServiceUrl.TrimEnd('/');
        var bucket = _s3Options.RawBucketName;

        var videos = await _context.Videos
            .Where(v => v.ProfileId == profile.Id && v.DeletedAt == null)
            .OrderByDescending(v => v.CreatedAt)
            .ToListAsync(cancellationToken);

        return videos.Select(v => new VideoDto(
            v.Id,
            v.Type,
            v.Status,
            v.S3Key,
            $"{baseUrl}/{bucket}/{v.S3Key}",
            v.ThumbnailUrl,
            v.DurationSeconds,
            v.CreatedAt
        )).ToList();
    }
}
