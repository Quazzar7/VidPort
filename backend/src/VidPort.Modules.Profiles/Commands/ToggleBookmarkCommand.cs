using MediatR;

namespace VidPort.Modules.Profiles.Commands;

public record ToggleVideoBookmarkCommand(Guid ProfileId, Guid VideoId) : IRequest<bool>;
public record ToggleProfileBookmarkCommand(Guid ProfileId, Guid TargetProfileId) : IRequest<bool>;
