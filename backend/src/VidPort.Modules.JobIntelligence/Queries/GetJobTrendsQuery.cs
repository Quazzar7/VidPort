using MediatR;
using Microsoft.EntityFrameworkCore;
using VidPort.Infrastructure.Data;
using VidPort.Modules.JobIntelligence.Dtos;

namespace VidPort.Modules.JobIntelligence.Queries;

public record GetJobTrendsQuery : IRequest<List<JobTrendDto>>;

public class GetJobTrendsQueryHandler : IRequestHandler<GetJobTrendsQuery, List<JobTrendDto>>
{
    private readonly ApplicationDbContext _db;

    public GetJobTrendsQueryHandler(ApplicationDbContext db) => _db = db;

    public async Task<List<JobTrendDto>> Handle(GetJobTrendsQuery request, CancellationToken ct)
    {
        var cutoff = DateTime.UtcNow.AddDays(-7);

        return await _db.SkillAggregates
            .Where(s => s.PeriodStart >= cutoff)
            .GroupBy(s => s.SkillName)
            .Select(g => new JobTrendDto(
                g.Key,
                g.Sum(s => s.JobCount),
                g.Max(s => s.WeekOverWeekChange)))
            .OrderByDescending(t => t.JobCount)
            .Take(20)
            .ToListAsync(ct);
    }
}
