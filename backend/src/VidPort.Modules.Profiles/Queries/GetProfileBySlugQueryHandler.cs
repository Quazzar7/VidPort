using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using VidPort.Infrastructure.Data;
using VidPort.Modules.Profiles.Dtos;
using VidPort.Modules.Uploads.Configuration;

namespace VidPort.Modules.Profiles.Queries;

public class GetProfileBySlugQueryHandler : IRequestHandler<GetProfileBySlugQuery, ProfileDto>
{
    private readonly ApplicationDbContext _context;
    private readonly S3Options _s3Options;

    public GetProfileBySlugQueryHandler(ApplicationDbContext context, IOptions<S3Options> s3Options)
    {
        _context = context;
        _s3Options = s3Options.Value;
    }

    public async Task<ProfileDto> Handle(GetProfileBySlugQuery request, CancellationToken cancellationToken)
    {
        var profile = await ProfileMapper
            .WithFullIncludes(_context.Profiles)
            .FirstOrDefaultAsync(p => p.Slug == request.Slug, cancellationToken)
            ?? throw new Exception("Profile not found");

        return await ProfileMapper.ToDto(profile, _context, _s3Options, request.ViewerProfileId, cancellationToken);
    }
}
