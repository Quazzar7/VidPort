using MediatR;
using Microsoft.EntityFrameworkCore;
using VidPort.Infrastructure.Data;
using VidPort.Modules.JobIntelligence.Dtos;

namespace VidPort.Modules.JobIntelligence.Queries;

public record GetJobInsightsQuery : IRequest<List<JobInsightDto>>;

public class GetJobInsightsQueryHandler : IRequestHandler<GetJobInsightsQuery, List<JobInsightDto>>
{
    private readonly ApplicationDbContext _db;

    public GetJobInsightsQueryHandler(ApplicationDbContext db) => _db = db;

    public async Task<List<JobInsightDto>> Handle(GetJobInsightsQuery request, CancellationToken ct)
        => await _db.JobInsights
            .Where(i => i.IsActive)
            .OrderByDescending(i => i.GeneratedAt)
            .Take(10)
            .Select(i => new JobInsightDto(i.Id, i.Type, i.Title, i.Body, i.GeneratedAt))
            .ToListAsync(ct);
}
