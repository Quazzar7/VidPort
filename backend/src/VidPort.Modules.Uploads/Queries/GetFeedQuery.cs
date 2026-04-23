using MediatR;
using VidPort.Core.Enums;

namespace VidPort.Modules.Uploads.Queries;

public record FeedVideoDto(
    Guid Id,
    VideoType Type,
    string VideoUrl,
    int? DurationSeconds,
    DateTime CreatedAt,
    int LikeCount,
    bool IsLikedByMe,
    bool IsBookmarkedByMe,
    Guid CreatorProfileId,
    string CreatorSlug,
    string? CreatorHeadline,
    bool IsSubscribedToCreator
);

public record GetFeedQuery(Guid? ViewerProfileId, int Page = 1, int PageSize = 20) : IRequest<List<FeedVideoDto>>;
public record GetShortsFeedQuery(Guid? ViewerProfileId, int Page = 1, int PageSize = 10) : IRequest<List<FeedVideoDto>>;
