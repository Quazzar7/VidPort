using MediatR;

namespace VidPort.Modules.Uploads.Commands;

public record UpdateVideoDurationCommand(Guid VideoId, Guid UserId, int DurationSeconds) : IRequest<Unit>;
