using MediatR;
using Microsoft.EntityFrameworkCore;
using VidPort.Infrastructure.Data;
using VidPort.Modules.JobIntelligence.Dtos;

namespace VidPort.Modules.JobIntelligence.Queries;

public class GetJobMatchesQueryHandler : IRequestHandler<GetJobMatchesQuery, List<JobMatchDto>>
{
    private readonly ApplicationDbContext _context;

    public GetJobMatchesQueryHandler(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<JobMatchDto>> Handle(GetJobMatchesQuery request, CancellationToken ct)
    {
        var profile = request.Profile;
        
        // Fetch recent processed jobs
        var jobs = await _context.RawJobs
            .Where(j => j.IsProcessed)
            .OrderByDescending(j => j.PostedAt)
            .Take(100)
            .ToListAsync(ct);

        var matches = new List<JobMatchDto>();

        foreach (var job in jobs)
        {
            // Filter by salary: Allow jobs that pay at least 90% of the target CTC
            if (profile.MinSalary.HasValue && job.SalaryMax.HasValue)
            {
                var threshold = profile.MinSalary.Value * 0.9m;
                if (job.SalaryMax < threshold)
                    continue;
            }

            int score = 0;

            // 1. Role match (High weight)
            if (job.Title.Contains(profile.Role, StringComparison.OrdinalIgnoreCase))
                score += 20;

            // 2. Skill matches
            foreach (var skill in profile.Skills)
            {
                // Check in Title
                if (job.Title.Contains(skill, StringComparison.OrdinalIgnoreCase))
                    score += 10;
                
                // Check in Skills array
                if (job.Skills != null && job.Skills.Any(s => s.Contains(skill, StringComparison.OrdinalIgnoreCase)))
                    score += 15;

                // Check in Description
                if (job.Description != null && job.Description.Contains(skill, StringComparison.OrdinalIgnoreCase))
                    score += 5;
            }

            // 3. Experience Level match
            if (job.Description != null && job.Description.Contains(profile.ExperienceLevel, StringComparison.OrdinalIgnoreCase))
                score += 10;

            if (score > 0)
            {
                var salaryStr = (job.SalaryMin.HasValue || job.SalaryMax.HasValue)
                    ? $"₹{job.SalaryMin:N0} - ₹{job.SalaryMax:N0}"
                    : "Not specified";

                matches.Add(new JobMatchDto(
                    job.Id,
                    job.Title,
                    job.Company,
                    job.Location ?? "India",
                    job.Description?.Length > 200 ? job.Description[..200] + "..." : job.Description,
                    salaryStr,
                    score,
                    job.Source == "adzuna_in" ? $"https://www.adzuna.in/jobs/details/{job.ExternalId}" : $"https://www.adzuna.co.uk/jobs/details/{job.ExternalId}"
                ));
            }
        }

        return matches.OrderByDescending(m => m.Score).Take(20).ToList();
    }
}
