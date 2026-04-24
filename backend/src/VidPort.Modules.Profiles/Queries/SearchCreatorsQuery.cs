using MediatR;
using VidPort.Core.Enums;
using VidPort.Modules.Profiles.Dtos;

namespace VidPort.Modules.Profiles.Queries;

public record SearchCreatorsQuery(
    string Term,
    Guid? ViewerProfileId,
    AvailabilityStatus? AvailabilityFilter,
    string? LocationFilter,
    string? SkillFilter
) : IRequest<List<CreatorSearchResultDto>>;
