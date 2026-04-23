using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VidPort.Infrastructure.Data;
using VidPort.Modules.Profiles.Commands;
using VidPort.Modules.Uploads.Commands;

namespace VidPort.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SocialController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ApplicationDbContext _context;

    public SocialController(IMediator mediator, ApplicationDbContext context)
    {
        _mediator = mediator;
        _context = context;
    }

    [HttpPost("videos/{videoId}/like")]
    public async Task<IActionResult> ToggleLike(Guid videoId)
    {
        var profileId = await GetProfileId();
        var liked = await _mediator.Send(new ToggleLikeCommand(videoId, profileId));
        return Ok(new { liked });
    }

    [HttpPost("profiles/{creatorProfileId}/subscribe")]
    public async Task<IActionResult> ToggleSubscribe(Guid creatorProfileId)
    {
        var profileId = await GetProfileId();
        var subscribed = await _mediator.Send(new ToggleSubscribeCommand(profileId, creatorProfileId));
        return Ok(new { subscribed });
    }

    [HttpPost("videos/{videoId}/bookmark")]
    public async Task<IActionResult> ToggleVideoBookmark(Guid videoId)
    {
        var profileId = await GetProfileId();
        var bookmarked = await _mediator.Send(new ToggleVideoBookmarkCommand(profileId, videoId));
        return Ok(new { bookmarked });
    }

    [HttpPost("profiles/{targetProfileId}/bookmark")]
    public async Task<IActionResult> ToggleProfileBookmark(Guid targetProfileId)
    {
        var profileId = await GetProfileId();
        var bookmarked = await _mediator.Send(new ToggleProfileBookmarkCommand(profileId, targetProfileId));
        return Ok(new { bookmarked });
    }

    private async Task<Guid> GetProfileId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        if (string.IsNullOrEmpty(userIdClaim))
            throw new Exception("User ID not found in claims");

        var userId = Guid.Parse(userIdClaim);
        var profile = await _context.Profiles.FirstOrDefaultAsync(p => p.UserId == userId)
            ?? throw new Exception("Profile not found");
        return profile.Id;
    }
}
