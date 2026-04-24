using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using VidPort.Core.Enums;
using VidPort.Infrastructure.Data;
using VidPort.Modules.Uploads.Configuration;

namespace VidPort.Modules.Uploads.Queries;

public record GetMyLikedVideosQuery(Guid UserId) : IRequest<List<FeedVideoDto>>;

public class GetMyLikedVideosQueryHandler : IRequestHandler<GetMyLikedVideosQuery, List<FeedVideoDto>>
{
    private readonly ApplicationDbContext _context;
    private readonly S3Options _s3Options;
    private readonly GetFeedQueryHandler _helper;

    public GetMyLikedVideosQueryHandler(ApplicationDbContext context, IOptions<S3Options> s3Options)
    {
        _context = context;
        _s3Options = s3Options.Value;
        _helper = new GetFeedQueryHandler(context, s3Options);
    }

    public async Task<List<FeedVideoDto>> Handle(GetMyLikedVideosQuery request, CancellationToken cancellationToken)
    {
        var baseUrl = _s3Options.ServiceUrl.TrimEnd('/');
        var bucket = _s3Options.RawBucketName;

        var profile = await _context.Profiles
            .FirstOrDefaultAsync(p => p.UserId == request.UserId, cancellationToken);

        if (profile is null) return [];

        var videos = await _context.VideoLikes
            .Where(l => l.ProfileId == profile.Id)
            .OrderByDescending(l => l.CreatedAt)
            .Include(l => l.Video).ThenInclude(v => v.Profile)
            .Where(l => l.Video.DeletedAt == null && l.Video.Status == VideoStatus.Complete)
            .Select(l => l.Video)
            .ToListAsync(cancellationToken);

        return await _helper.BuildFeedDtos(videos, profile.Id, baseUrl, bucket, cancellationToken);
    }
}
