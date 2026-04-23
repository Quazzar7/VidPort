using MediatR;
using VidPort.Modules.Profiles.Dtos;

namespace VidPort.Modules.Profiles.Queries;

public record GetProfileBySlugQuery(string Slug, Guid? ViewerProfileId = null) : IRequest<ProfileDto>;
