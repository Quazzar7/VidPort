using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VidPort.Core.Enums;
using VidPort.Infrastructure.Data;
using VidPort.Modules.Profiles.Queries;

namespace VidPort.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SearchController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ApplicationDbContext _context;

    public SearchController(IMediator mediator, ApplicationDbContext context)
    {
        _mediator = mediator;
        _context = context;
    }

    [HttpGet("creators")]
    public async Task<IActionResult> SearchCreators(
        [FromQuery] string? q,
        [FromQuery] AvailabilityStatus? availability,
        [FromQuery] string? location,
        [FromQuery] string? skill)
    {
        var viewerProfileId = await TryGetViewerProfileId();
        var query = new SearchCreatorsQuery(q ?? string.Empty, viewerProfileId, availability, location, skill);
        var results = await _mediator.Send(query);
        return Ok(results);
    }

    private async Task<Guid?> TryGetViewerProfileId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        if (string.IsNullOrEmpty(userIdClaim)) return null;

        var userId = Guid.Parse(userIdClaim);
        var profile = await _context.Profiles.FirstOrDefaultAsync(p => p.UserId == userId);
        return profile?.Id;
    }
}
