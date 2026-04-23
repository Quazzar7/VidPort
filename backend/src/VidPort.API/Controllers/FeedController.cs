using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VidPort.Infrastructure.Data;
using VidPort.Modules.Uploads.Queries;

namespace VidPort.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FeedController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ApplicationDbContext _context;

    public FeedController(IMediator mediator, ApplicationDbContext context)
    {
        _mediator = mediator;
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetFeed([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var viewerProfileId = await TryGetViewerProfileId();
        var query = new GetFeedQuery(viewerProfileId, page, pageSize);
        var feed = await _mediator.Send(query);
        return Ok(feed);
    }

    [HttpGet("shorts")]
    public async Task<IActionResult> GetShortsFeed([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        var viewerProfileId = await TryGetViewerProfileId();
        var query = new GetShortsFeedQuery(viewerProfileId, page, pageSize);
        var feed = await _mediator.Send(query);
        return Ok(feed);
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
