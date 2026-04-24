using MediatR;
using Microsoft.EntityFrameworkCore;
using VidPort.Infrastructure.Data;
using VidPort.Modules.Communications.Dtos;

namespace VidPort.Modules.Communications.Queries;

public class GetMyScheduleQueryHandler : IRequestHandler<GetMyScheduleQuery, List<CommunicationMessageDto>>
{
    private readonly ApplicationDbContext _context;

    public GetMyScheduleQueryHandler(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<CommunicationMessageDto>> Handle(GetMyScheduleQuery request, CancellationToken ct)
    {
        Console.WriteLine($"[DEBUG] Fetching schedule for ProfileId: {request.ProfileId}");
        
        var allMessages = await _context.CommunicationMessages
            .Include(m => m.Thread)
            .ToListAsync(ct);
        Console.WriteLine($"[DEBUG] Total messages in DB: {allMessages.Count}");

        var messages = await _context.CommunicationMessages
            .Include(m => m.Thread)
                .ThenInclude(t => t.InitiatorProfile)
            .Include(m => m.Thread)
                .ThenInclude(t => t.RecipientProfile)
            .Include(m => m.SenderProfile)
            .Where(m => (m.Thread.InitiatorProfileId == request.ProfileId || m.Thread.RecipientProfileId == request.ProfileId) &&
                        (m.ScheduledAt != null || m.Type != VidPort.Core.Enums.CommunicationType.Chat))
            .OrderByDescending(m => m.ScheduledAt ?? m.CreatedAt)
            .ToListAsync(ct);

        Console.WriteLine($"[DEBUG] Filtered schedule items for user: {messages.Count}");
        foreach(var msg in messages) {
            Console.WriteLine($"[DEBUG] Item: {msg.Type}, ScheduledAt: {msg.ScheduledAt}, Thread: {msg.ThreadId}");
        }

        return messages.Select(m => {
            // The person the current user is interacting with in this thread
            var otherProfile = m.Thread.InitiatorProfileId == request.ProfileId 
                ? m.Thread.RecipientProfile 
                : m.Thread.InitiatorProfile;

            return new CommunicationMessageDto(
                m.Id,
                m.ThreadId,
                m.SenderProfileId,
                otherProfile.Headline ?? otherProfile.Slug,
                m.Type,
                m.Content,
                m.ScheduledAt,
                m.DurationMinutes,
                m.MeetingLink,
                m.CreatedAt,
                m.IsRead
            );
        }).ToList();
    }
}
