using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using VidPort.Core.Enums;
using VidPort.Infrastructure.Data;
using VidPort.Modules.Uploads.Configuration;

namespace VidPort.Modules.Uploads.Queries;

public class GetFeedQueryHandler : IRequestHandler<GetFeedQuery, List<FeedVideoDto>>
{
    private readonly ApplicationDbContext _context;
    private readonly S3Options _s3Options;

    public GetFeedQueryHandler(ApplicationDbContext context, IOptions<S3Options> s3Options)
    {
        _context = context;
        _s3Options = s3Options.Value;
    }

    public async Task<List<FeedVideoDto>> Handle(GetFeedQuery request, CancellationToken cancellationToken)
    {
        var baseUrl = _s3Options.ServiceUrl.TrimEnd('/');
        var bucket = _s3Options.RawBucketName;

        var videos = await _context.Videos
            .Include(v => v.Profile)
            .Where(v => v.DeletedAt == null && v.Status == VideoStatus.Complete)
            .OrderByDescending(v => v.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(cancellationToken);

        return await BuildFeedDtos(videos, request.ViewerProfileId, baseUrl, bucket, cancellationToken);
    }

    internal async Task<List<FeedVideoDto>> BuildFeedDtos(
        List<Core.Entities.Video> videos,
        Guid? viewerProfileId,
        string baseUrl,
        string bucket,
        CancellationToken cancellationToken)
    {
        var videoIds = videos.Select(v => v.Id).ToList();

        var likeCounts = await _context.VideoLikes
            .Where(l => videoIds.Contains(l.VideoId))
            .GroupBy(l => l.VideoId)
            .Select(g => new { VideoId = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        var likeCountMap = likeCounts.ToDictionary(x => x.VideoId, x => x.Count);

        HashSet<Guid> likedByMe = [];
        HashSet<Guid> bookmarkedByMe = [];
        HashSet<Guid> subscribedCreators = [];

        if (viewerProfileId.HasValue)
        {
            var likes = await _context.VideoLikes
                .Where(l => l.ProfileId == viewerProfileId.Value && videoIds.Contains(l.VideoId))
                .Select(l => l.VideoId)
                .ToListAsync(cancellationToken);
            likedByMe = [.. likes];

            var bookmarks = await _context.Bookmarks
                .Where(b => b.ProfileId == viewerProfileId.Value && b.VideoId != null && videoIds.Contains(b.VideoId!.Value))
                .Select(b => b.VideoId!.Value)
                .ToListAsync(cancellationToken);
            bookmarkedByMe = [.. bookmarks];

            var creatorIds = videos.Select(v => v.ProfileId).Distinct().ToList();
            var subs = await _context.Subscriptions
                .Where(s => s.SubscriberId == viewerProfileId.Value && creatorIds.Contains(s.CreatorId))
                .Select(s => s.CreatorId)
                .ToListAsync(cancellationToken);
            subscribedCreators = [.. subs];
        }

        return videos.Select(v => new FeedVideoDto(
            v.Id,
            v.Type,
            $"{baseUrl}/{bucket}/{v.S3Key}",
            v.DurationSeconds,
            v.CreatedAt,
            likeCountMap.GetValueOrDefault(v.Id, 0),
            likedByMe.Contains(v.Id),
            bookmarkedByMe.Contains(v.Id),
            v.ProfileId,
            v.Profile.Slug,
            v.Profile.Headline,
            subscribedCreators.Contains(v.ProfileId)
        )).ToList();
    }
}

public class GetShortsFeedQueryHandler : IRequestHandler<GetShortsFeedQuery, List<FeedVideoDto>>
{
    private readonly ApplicationDbContext _context;
    private readonly S3Options _s3Options;
    private readonly GetFeedQueryHandler _helper;

    public GetShortsFeedQueryHandler(ApplicationDbContext context, IOptions<S3Options> s3Options)
    {
        _context = context;
        _s3Options = s3Options.Value;
        _helper = new GetFeedQueryHandler(context, s3Options);
    }

    public async Task<List<FeedVideoDto>> Handle(GetShortsFeedQuery request, CancellationToken cancellationToken)
    {
        var baseUrl = _s3Options.ServiceUrl.TrimEnd('/');
        var bucket = _s3Options.RawBucketName;

        var videos = await _context.Videos
            .Include(v => v.Profile)
            .Where(v => v.DeletedAt == null && v.Status == VideoStatus.Complete &&
                        v.Type == VideoType.Portfolio && v.DurationSeconds != null && v.DurationSeconds <= 60)
            .OrderByDescending(v => v.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(cancellationToken);

        return await _helper.BuildFeedDtos(videos, request.ViewerProfileId, baseUrl, bucket, cancellationToken);
    }
}
