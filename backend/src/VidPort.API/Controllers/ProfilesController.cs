using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VidPort.Modules.Profiles.Commands;
using VidPort.Modules.Profiles.Queries;

namespace VidPort.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProfilesController : ControllerBase
{
    private readonly IMediator _mediator;

    public ProfilesController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> GetMyProfile()
    {
        var userId = GetUserId();
        var query = new GetMyProfileQuery(userId);
        var profile = await _mediator.Send(query);
        return Ok(profile);
    }

    [Authorize]
    [HttpPut("me")]
    public async Task<IActionResult> UpdateMyProfile([FromBody] UpdateProfileRequest request)
    {
        var userId = GetUserId();
        var command = new UpdateProfileCommand(
            userId,
            request.Headline,
            request.Bio,
            request.Location,
            request.AvailabilityStatus,
            request.Skills
        );
        await _mediator.Send(command);
        return NoContent();
    }

    [HttpGet("{slug}")]
    public async Task<IActionResult> GetBySlug(string slug)
    {
        var query = new GetProfileBySlugQuery(slug);
        var profile = await _mediator.Send(query);
        return Ok(profile);
    }

    private Guid GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                          ?? User.FindFirst("sub")?.Value;
        
        if (string.IsNullOrEmpty(userIdClaim))
        {
            throw new Exception("User ID not found in claims");
        }

        return Guid.Parse(userIdClaim);
    }
}

public record UpdateProfileRequest(
    string? Headline,
    string? Bio,
    string? Location,
    VidPort.Core.Enums.AvailabilityStatus AvailabilityStatus,
    List<string> Skills
);
