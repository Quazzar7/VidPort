using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using VidPort.Core.Entities;
using VidPort.Core.Enums;
using VidPort.Infrastructure.Data;
using VidPort.Modules.Profiles.Dtos;
using VidPort.Modules.Uploads.Configuration;

namespace VidPort.Modules.Profiles.Queries;

public class GetMyProfileQueryHandler : IRequestHandler<GetMyProfileQuery, ProfileDto>
{
    private readonly ApplicationDbContext _context;
    private readonly S3Options _s3Options;

    public GetMyProfileQueryHandler(ApplicationDbContext context, IOptions<S3Options> s3Options)
    {
        _context = context;
        _s3Options = s3Options.Value;
    }

    public async Task<ProfileDto> Handle(GetMyProfileQuery request, CancellationToken cancellationToken)
    {
        var profile = await ProfileMapper
            .WithFullIncludes(_context.Profiles)
            .FirstOrDefaultAsync(p => p.UserId == request.UserId, cancellationToken);

        if (profile == null)
        {
            var user = await _context.Users.FindAsync(new object[] { request.UserId }, cancellationToken)
                ?? throw new Exception("User not found");

            profile = new Profile
            {
                Id = Guid.NewGuid(),
                UserId = request.UserId,
                Slug = GenerateInitialSlug(user.Email),
                AvailabilityStatus = AvailabilityStatus.OpenToWork,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Profiles.Add(profile);
            await _context.SaveChangesAsync(cancellationToken);
        }

        return await ProfileMapper.ToDto(profile, _context, _s3Options, null, cancellationToken);
    }

    private static string GenerateInitialSlug(string email)
    {
        var namePart = email.Split('@')[0];
        return $"{namePart.ToLower()}-{Guid.NewGuid().ToString()[..4]}";
    }
}
