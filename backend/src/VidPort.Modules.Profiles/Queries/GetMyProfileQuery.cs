using MediatR;
using VidPort.Modules.Profiles.Dtos;

namespace VidPort.Modules.Profiles.Queries;

public record GetMyProfileQuery(Guid UserId) : IRequest<ProfileDto>;
