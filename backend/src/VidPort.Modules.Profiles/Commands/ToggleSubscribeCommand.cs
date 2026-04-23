using MediatR;

namespace VidPort.Modules.Profiles.Commands;

public record ToggleSubscribeCommand(Guid SubscriberProfileId, Guid CreatorProfileId) : IRequest<bool>;
