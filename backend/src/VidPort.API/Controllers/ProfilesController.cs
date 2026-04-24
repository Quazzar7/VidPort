using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VidPort.Core.Enums;
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
        var profile = await _mediator.Send(new GetMyProfileQuery(userId));
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
            request.PhoneNumber,
            request.AvailabilityStatus,
            request.Skills
        );
        await _mediator.Send(command);
        return NoContent();
    }

    [Authorize]
    [HttpPatch("me/featured-video")]
    public async Task<IActionResult> SetFeaturedVideo([FromBody] SetFeaturedVideoRequest request)
    {
        var userId = GetUserId();
        await _mediator.Send(new SetFeaturedVideoCommand(userId, request.VideoId));
        return NoContent();
    }

    [HttpGet("{slug}")]
    public async Task<IActionResult> GetBySlug(string slug)
    {
        var profile = await _mediator.Send(new GetProfileBySlugQuery(slug));
        return Ok(profile);
    }

    [Authorize]
    [HttpGet("me/bookmarks")]
    public async Task<IActionResult> GetMyBookmarks()
    {
        var userId = GetUserId();
        var bookmarks = await _mediator.Send(new GetMyBookmarksQuery(userId));
        return Ok(bookmarks);
    }

    // ── Work Experience ───────────────────────────────────────────────────────

    [Authorize]
    [HttpPost("me/work-experience")]
    public async Task<IActionResult> UpsertWorkExperience([FromBody] UpsertWorkExperienceRequest request)
    {
        var userId = GetUserId();
        var id = await _mediator.Send(new UpsertWorkExperienceCommand(
            userId, request.Id, request.Company, request.Role, request.Location,
            request.StartDate, request.EndDate, request.IsCurrent, request.Description));
        return Ok(new { id });
    }

    [Authorize]
    [HttpDelete("me/work-experience/{id:guid}")]
    public async Task<IActionResult> DeleteWorkExperience(Guid id)
    {
        var userId = GetUserId();
        await _mediator.Send(new DeleteWorkExperienceCommand(userId, id));
        return NoContent();
    }

    // ── Education ─────────────────────────────────────────────────────────────

    [Authorize]
    [HttpPost("me/education")]
    public async Task<IActionResult> UpsertEducation([FromBody] UpsertEducationRequest request)
    {
        var userId = GetUserId();
        var id = await _mediator.Send(new UpsertEducationCommand(
            userId, request.Id, request.Institution, request.Degree, request.FieldOfStudy,
            request.StartYear, request.GraduationYear, request.Grade, request.Description));
        return Ok(new { id });
    }

    [Authorize]
    [HttpDelete("me/education/{id:guid}")]
    public async Task<IActionResult> DeleteEducation(Guid id)
    {
        var userId = GetUserId();
        await _mediator.Send(new DeleteEducationCommand(userId, id));
        return NoContent();
    }

    // ── Projects ──────────────────────────────────────────────────────────────

    [Authorize]
    [HttpPost("me/projects")]
    public async Task<IActionResult> UpsertProject([FromBody] UpsertProjectRequest request)
    {
        var userId = GetUserId();
        var id = await _mediator.Send(new UpsertProjectCommand(
            userId, request.Id, request.Name, request.Description, request.Url,
            request.TechStack, request.CompletionPercentage, request.StatusDescription, request.VideoId));
        return Ok(new { id });
    }

    [Authorize]
    [HttpDelete("me/projects/{id:guid}")]
    public async Task<IActionResult> DeleteProject(Guid id)
    {
        var userId = GetUserId();
        await _mediator.Send(new DeleteProjectCommand(userId, id));
        return NoContent();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Guid GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                          ?? User.FindFirst("sub")?.Value;
        if (string.IsNullOrEmpty(userIdClaim))
            throw new Exception("User ID not found in claims");
        return Guid.Parse(userIdClaim);
    }
}

// ── Request Models ────────────────────────────────────────────────────────────

public record UpdateProfileRequest(
    string? Headline,
    string? Bio,
    string? Location,
    string? PhoneNumber,
    AvailabilityStatus AvailabilityStatus,
    List<SkillInput> Skills
);

public record SetFeaturedVideoRequest(Guid? VideoId);

public record UpsertWorkExperienceRequest(
    Guid? Id,
    string Company,
    string Role,
    string? Location,
    DateOnly StartDate,
    DateOnly? EndDate,
    bool IsCurrent,
    string? Description
);

public record UpsertEducationRequest(
    Guid? Id,
    string Institution,
    string? Degree,
    string? FieldOfStudy,
    int? StartYear,
    int? GraduationYear,
    string? Grade,
    string? Description
);

public record UpsertProjectRequest(
    Guid? Id,
    string Name,
    string? Description,
    string? Url,
    List<string> TechStack,
    int CompletionPercentage,
    string? StatusDescription,
    Guid? VideoId
);
