using MediatR;

namespace VidPort.Modules.Uploads.Commands;

public record DeleteVideoCommand(Guid VideoId, Guid UserId) : IRequest<Unit>;
