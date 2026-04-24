using MediatR;
using VidPort.Core.Enums;

namespace VidPort.Modules.Profiles.Commands;

public record SkillInput(string Name, int? Stars);

public record UpdateProfileCommand(
    Guid UserId,
    string? Headline,
    string? Bio,
    string? Location,
    string? PhoneNumber,
    AvailabilityStatus AvailabilityStatus,
    List<SkillInput> Skills
) : IRequest<Unit>;
