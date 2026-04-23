using MediatR;
using VidPort.Core.Enums;

namespace VidPort.Modules.Uploads.Queries;

public record VideoDto(
    Guid Id,
    VideoType Type,
    VideoStatus Status,
    string S3Key,
    string VideoUrl,
    string? ThumbnailUrl,
    int? DurationSeconds,
    DateTime CreatedAt
);

public record GetMyVideosQuery(Guid UserId) : IRequest<List<VideoDto>>;
