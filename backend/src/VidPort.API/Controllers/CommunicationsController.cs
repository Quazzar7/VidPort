using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VidPort.Core.Enums;
using VidPort.Infrastructure.Data;
using VidPort.Modules.Communications.Commands;
using VidPort.Modules.Communications.Queries;

namespace VidPort.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CommunicationsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ApplicationDbContext _context;

    public CommunicationsController(IMediator mediator, ApplicationDbContext context)
    {
        _mediator = mediator;
        _context = context;
    }

    [HttpGet("threads")]
    public async Task<IActionResult> GetMyThreads()
    {
        var profileId = await GetProfileId();
        var threads = await _mediator.Send(new GetMyThreadsQuery(profileId));
        return Ok(threads);
    }

    [HttpGet("threads/{threadId:guid}/messages")]
    public async Task<IActionResult> GetThreadMessages(Guid threadId)
    {
        var profileId = await GetProfileId();
        var messages = await _mediator.Send(new GetThreadMessagesQuery(threadId, profileId));
        return Ok(messages);
    }

    [HttpGet("schedule")]
    public async Task<IActionResult> GetMySchedule()
    {
        var profileId = await GetProfileId();
        var schedule = await _mediator.Send(new GetMyScheduleQuery(profileId));
        return Ok(schedule);
    }

    [HttpGet("blocked-slots")]
    public async Task<IActionResult> GetMyBlockedSlots()
    {
        var profileId = await GetProfileId();
        var slots = await _mediator.Send(new GetBlockedSlotsQuery(profileId));
        return Ok(slots);
    }

    [HttpPost("blocked-slots")]
    public async Task<IActionResult> CreateBlockedSlot([FromBody] CreateBlockedSlotRequest request)
    {
        var profileId = await GetProfileId();
        var slot = await _mediator.Send(new CreateBlockedSlotCommand(
            profileId, request.StartTime, request.EndTime, request.Reason));
        return Ok(slot);
    }

    [HttpDelete("blocked-slots/{id:guid}")]
    public async Task<IActionResult> DeleteBlockedSlot(Guid id)
    {
        var profileId = await GetProfileId();
        await _mediator.Send(new DeleteBlockedSlotCommand(id, profileId));
        return NoContent();
    }

    [HttpPost("initiate")]
    public async Task<IActionResult> InitiateThread([FromBody] InitiateThreadRequest request)
    {
        var profileId = await GetProfileId();
        var thread = await _mediator.Send(new InitiateThreadCommand(
            profileId, request.RecipientProfileId, request.Type, request.Content, request.ScheduledAt, request.DurationMinutes, request.MeetingLink));
        return Ok(thread);
    }

    [HttpPost("threads/{threadId:guid}/messages")]
    public async Task<IActionResult> SendMessage(Guid threadId, [FromBody] SendMessageRequest request)
    {
        var profileId = await GetProfileId();
        var message = await _mediator.Send(new SendMessageCommand(
            threadId, profileId, request.Type, request.Content, request.ScheduledAt, request.DurationMinutes, request.MeetingLink));
        return Ok(message);
    }

    [HttpPut("messages/{messageId:guid}")]
    public async Task<IActionResult> UpdateMessage(Guid messageId, [FromBody] UpdateMessageRequest request)
    {
        var profileId = await GetProfileId();
        var message = await _mediator.Send(new UpdateMessageCommand(
            messageId, profileId, request.Content, request.ScheduledAt, request.DurationMinutes, request.MeetingLink));
        return Ok(message);
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

public record InitiateThreadRequest(Guid RecipientProfileId, CommunicationType Type, string Content, DateTime? ScheduledAt, int? DurationMinutes, string? MeetingLink);
public record SendMessageRequest(CommunicationType Type, string Content, DateTime? ScheduledAt, int? DurationMinutes, string? MeetingLink);
public record UpdateMessageRequest(string Content, DateTime? ScheduledAt, int? DurationMinutes, string? MeetingLink);
public record CreateBlockedSlotRequest(DateTime StartTime, DateTime EndTime, string? Reason);
