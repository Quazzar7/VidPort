using MediatR;

namespace VidPort.Modules.Profiles.Commands;

public record SetFeaturedVideoCommand(Guid UserId, Guid? VideoId) : IRequest<Unit>;
