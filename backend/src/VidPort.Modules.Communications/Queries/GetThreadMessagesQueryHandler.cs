using MediatR;
using Microsoft.EntityFrameworkCore;
using VidPort.Core.Exceptions;
using VidPort.Infrastructure.Data;
using VidPort.Modules.Communications.Dtos;

namespace VidPort.Modules.Communications.Queries;

public class GetThreadMessagesQueryHandler : IRequestHandler<GetThreadMessagesQuery, List<CommunicationMessageDto>>
{
    private readonly ApplicationDbContext _context;

    public GetThreadMessagesQueryHandler(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<CommunicationMessageDto>> Handle(GetThreadMessagesQuery request, CancellationToken ct)
    {
        var thread = await _context.CommunicationThreads
            .FirstOrDefaultAsync(t => t.Id == request.ThreadId, ct)
            ?? throw new DomainException("Thread not found");

        if (thread.InitiatorProfileId != request.ProfileId && thread.RecipientProfileId != request.ProfileId)
        {
            throw new DomainException("You are not part of this communication thread");
        }

        var messages = await _context.CommunicationMessages
            .Include(m => m.SenderProfile)
            .Where(m => m.ThreadId == request.ThreadId)
            .OrderBy(m => m.CreatedAt)
            .ToListAsync(ct);

        // Mark messages as read
        var unread = messages.Where(m => m.SenderProfileId != request.ProfileId && !m.IsRead).ToList();
        if (unread.Any())
        {
            unread.ForEach(m => m.IsRead = true);
            await _context.SaveChangesAsync(ct);
        }

        return messages.Select(m => new CommunicationMessageDto(
            m.Id,
            m.ThreadId,
            m.SenderProfileId,
            m.SenderProfile.Headline ?? m.SenderProfile.Slug,
            m.Type,
            m.Content,
            m.ScheduledAt,
            m.DurationMinutes,
            m.MeetingLink,
            m.CreatedAt,
            m.IsRead
        )).ToList();
    }
}
