using MediatR;
using VidPort.Core.Enums;

namespace VidPort.Modules.Profiles.Commands;

public record UpdateProfileCommand(
    Guid UserId,
    string? Headline,
    string? Bio,
    string? Location,
    string? PhoneNumber,
    AvailabilityStatus AvailabilityStatus,
    List<string> Skills
) : IRequest<Unit>;
