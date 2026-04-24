using MediatR;
using Microsoft.EntityFrameworkCore;
using VidPort.Core.Exceptions;
using VidPort.Infrastructure.Data;
using VidPort.Modules.Communications.Dtos;

namespace VidPort.Modules.Communications.Commands;

public class UpdateMessageCommandHandler : IRequestHandler<UpdateMessageCommand, CommunicationMessageDto>
{
    private readonly ApplicationDbContext _context;

    public UpdateMessageCommandHandler(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<CommunicationMessageDto> Handle(UpdateMessageCommand request, CancellationToken ct)
    {
        var message = await _context.CommunicationMessages
            .Include(m => m.Thread)
            .Include(m => m.SenderProfile)
            .FirstOrDefaultAsync(m => m.Id == request.MessageId, ct)
            ?? throw new DomainException("Message not found");

        // Verify the user is part of the thread
        if (message.Thread.InitiatorProfileId != request.ProfileId && message.Thread.RecipientProfileId != request.ProfileId)
        {
            throw new DomainException("You do not have permission to edit this interaction");
        }

        // Only allow editing non-chat items (meetings, calls, outreach logs)
        if (message.Type == VidPort.Core.Enums.CommunicationType.Chat)
        {
            throw new DomainException("Direct chat messages cannot be edited after sending");
        }

        message.Content = request.Content;
        message.ScheduledAt = request.ScheduledAt;
        message.DurationMinutes = request.DurationMinutes;
        message.MeetingLink = request.MeetingLink;
        
        message.Thread.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(ct);

        return new CommunicationMessageDto(
            message.Id,
            message.ThreadId,
            message.SenderProfileId,
            message.SenderProfile.Headline ?? message.SenderProfile.Slug,
            message.Type,
            message.Content,
            message.ScheduledAt,
            message.DurationMinutes,
            message.MeetingLink,
            message.CreatedAt,
            message.IsRead
        );
    }
}
