using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using VidPort.Infrastructure.Data;
using VidPort.Modules.Uploads.Configuration;

namespace VidPort.Modules.Profiles.Queries;

public class GetMyBookmarksQueryHandler : IRequestHandler<GetMyBookmarksQuery, List<BookmarkDto>>
{
    private readonly ApplicationDbContext _context;
    private readonly S3Options _s3Options;

    public GetMyBookmarksQueryHandler(ApplicationDbContext context, IOptions<S3Options> s3Options)
    {
        _context = context;
        _s3Options = s3Options.Value;
    }

    public async Task<List<BookmarkDto>> Handle(GetMyBookmarksQuery request, CancellationToken cancellationToken)
    {
        var baseUrl = _s3Options.ServiceUrl.TrimEnd('/');
        var bucket = _s3Options.RawBucketName;

        var profile = await _context.Profiles
            .FirstOrDefaultAsync(p => p.UserId == request.UserId, cancellationToken);

        if (profile is null) return [];

        var bookmarks = await _context.Bookmarks
            .Include(b => b.Video)
            .Include(b => b.BookmarkedProfile)
            .Where(b => b.ProfileId == profile.Id)
            .OrderByDescending(b => b.CreatedAt)
            .ToListAsync(cancellationToken);

        return bookmarks.Select(b => new BookmarkDto(
            b.Id,
            b.VideoId.HasValue ? "video" : "profile",
            b.VideoId,
            b.Video != null ? $"{baseUrl}/{bucket}/{b.Video.S3Key}" : null,
            b.Video?.Type.ToString(),
            b.BookmarkedProfileId,
            b.BookmarkedProfile?.Slug,
            b.BookmarkedProfile?.Headline,
            b.CreatedAt
        )).ToList();
    }
}
