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
    {
        var cutoff = DateTime.UtcNow.AddMonths(-2);
        return await _db.RawJobs
            .Where(j => j.PostedAt >= cutoff)
            .OrderByDescending(j => j.PostedAt)
            .Select(j => new JobRecommendationDto(
                j.Id,
                j.Title,
                j.Company,
                j.Location,
                j.Skills != null ? j.Skills.ToList() : null,
                j.Source,
                j.PostedAt))
            .ToListAsync(ct);
    }
}
