using MediatR;
using VidPort.Modules.Profiles.Dtos;

namespace VidPort.Modules.Profiles.Queries;

public record GetProfileBySlugQuery(string Slug) : IRequest<ProfileDto>;
