using MediatR;

namespace VidPort.Modules.Uploads.Commands;

public record ToggleLikeCommand(Guid VideoId, Guid ProfileId) : IRequest<bool>;
