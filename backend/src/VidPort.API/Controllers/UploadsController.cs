using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VidPort.Core.Enums;
using VidPort.Modules.Uploads.Commands;
using VidPort.Modules.Uploads.Queries;

namespace VidPort.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UploadsController : ControllerBase
{
    private readonly IMediator _mediator;

    public UploadsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [Authorize]
    [HttpGet("my-videos")]
    public async Task<IActionResult> GetMyVideos()
    {
        var userId = GetUserId();
        var query = new GetMyVideosQuery(userId);
        var videos = await _mediator.Send(query);
        return Ok(videos);
    }

    [Authorize]
    [HttpPost("video-url")]
    public async Task<IActionResult> GetUploadUrl([FromBody] GetUploadUrlRequest request)
    {
        var userId = GetUserId();
        var query = new GetUploadUrlQuery(userId, request.Type, request.ContentType);
        var response = await _mediator.Send(query);
        return Ok(response);
    }

    [Authorize]
    [HttpPost("complete/{videoId}")]
    public async Task<IActionResult> CompleteUpload(Guid videoId)
    {
        var command = new CompleteUploadCommand(videoId);
        await _mediator.Send(command);
        return NoContent();
    }

    [Authorize]
    [HttpPatch("{videoId}/duration")]
    public async Task<IActionResult> UpdateDuration(Guid videoId, [FromBody] UpdateDurationRequest request)
    {
        var userId = GetUserId();
        var command = new UpdateVideoDurationCommand(videoId, userId, request.DurationSeconds);
        await _mediator.Send(command);
        return NoContent();
    }

    [Authorize]
    [HttpDelete("{videoId}")]
    public async Task<IActionResult> DeleteVideo(Guid videoId)
    {
        var userId = GetUserId();
        var command = new DeleteVideoCommand(videoId, userId);
        await _mediator.Send(command);
        return NoContent();
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

public record GetUploadUrlRequest(VideoType Type, string ContentType);
public record UpdateDurationRequest(int DurationSeconds);
