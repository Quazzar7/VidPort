using MediatR;
using VidPort.Modules.JobIntelligence.Dtos;

namespace VidPort.Modules.JobIntelligence.Queries;

public record GetJobMatchesQuery(UserExpertiseProfile Profile) : IRequest<List<JobMatchDto>>;
