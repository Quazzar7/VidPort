using MediatR;
using VidPort.Modules.Profiles.Dtos;

namespace VidPort.Modules.Profiles.Queries;

public record BookmarkDto(
    Guid Id,
    string Kind,
    Guid? VideoId,
    string? VideoUrl,
    string? VideoType,
    Guid? BookmarkedProfileId,
    string? BookmarkedProfileSlug,
    string? BookmarkedProfileHeadline,
    DateTime CreatedAt
);

public record GetMyBookmarksQuery(Guid UserId) : IRequest<List<BookmarkDto>>;
