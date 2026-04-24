using MediatR;
using Microsoft.AspNetCore.Mvc;
using VidPort.Modules.JobIntelligence.Queries;

namespace VidPort.API.Controllers;

[ApiController]
[Route("api/jobs")]
public class JobIntelligenceController : ControllerBase
{
    private readonly IMediator _mediator;

    public JobIntelligenceController(IMediator mediator) => _mediator = mediator;

    [HttpGet("insights")]
    public async Task<IActionResult> GetInsights(CancellationToken ct)
        => Ok(await _mediator.Send(new GetJobInsightsQuery(), ct));

    [HttpGet("trends")]
    public async Task<IActionResult> GetTrends(CancellationToken ct)
        => Ok(await _mediator.Send(new GetJobTrendsQuery(), ct));

    [HttpGet("recommendations")]
    public async Task<IActionResult> GetRecommendations(CancellationToken ct)
        => Ok(await _mediator.Send(new GetJobRecommendationsQuery(), ct));
}
