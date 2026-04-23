using MediatR;
using VidPort.Modules.Profiles.Dtos;

namespace VidPort.Modules.Profiles.Queries;

public record SearchCreatorsQuery(string Term, Guid? ViewerProfileId) : IRequest<List<CreatorSearchResultDto>>;
