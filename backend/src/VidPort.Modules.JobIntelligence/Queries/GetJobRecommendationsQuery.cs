using MediatR;
using Microsoft.EntityFrameworkCore;
using VidPort.Infrastructure.Data;
using VidPort.Modules.JobIntelligence.Dtos;

namespace VidPort.Modules.JobIntelligence.Queries;

public record GetJobRecommendationsQuery : IRequest<List<JobRecommendationDto>>;

public class GetJobRecommendationsQueryHandler : IRequestHandler<GetJobRecommendationsQuery, List<JobRecommendationDto>>
{
    private readonly ApplicationDbContext _db;

    public GetJobRecommendationsQueryHandler(ApplicationDbContext db) => _db = db;

    public async Task<List<JobRecommendationDto>> Handle(GetJobRecommendationsQuery request, CancellationToken ct)
        => await _db.RawJobs
            .OrderByDescending(j => j.Source == "adzuna_in")
            .ThenByDescending(j => j.PostedAt)
            .Take(20)
            .Select(j => new JobRecommendationDto(
                j.Id,
                j.Title,
                j.Company,
                j.Location,
                j.Skills,
                j.Source,
                j.PostedAt))
            .ToListAsync(ct);
}
