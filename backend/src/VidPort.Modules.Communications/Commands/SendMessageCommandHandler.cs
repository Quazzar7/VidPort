using MediatR;
using Microsoft.EntityFrameworkCore;
using VidPort.Core.Entities;
using VidPort.Core.Enums;
using VidPort.Core.Exceptions;
using VidPort.Infrastructure.Data;
using VidPort.Modules.Communications.Dtos;

namespace VidPort.Modules.Communications.Commands;

public class SendMessageCommandHandler : IRequestHandler<SendMessageCommand, CommunicationMessageDto>
{
    private readonly ApplicationDbContext _context;

    public SendMessageCommandHandler(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<CommunicationMessageDto> Handle(SendMessageCommand request, CancellationToken ct)
    {
        var thread = await _context.CommunicationThreads
            .FirstOrDefaultAsync(t => t.Id == request.ThreadId, ct)
            ?? throw new DomainException("Thread not found");

        if (thread.InitiatorProfileId != request.SenderProfileId && thread.RecipientProfileId != request.SenderProfileId)
        {
            throw new DomainException("You are not part of this communication thread");
        }

        var sender = await _context.Profiles
            .FirstOrDefaultAsync(p => p.Id == request.SenderProfileId, ct)
            ?? throw new DomainException("Sender profile not found");

        var message = new CommunicationMessage
        {
            Id = Guid.NewGuid(),
            ThreadId = thread.Id,
            SenderProfileId = request.SenderProfileId,
            Type = request.Type,
            Content = request.Content,
            ScheduledAt = request.ScheduledAt,
            DurationMinutes = request.DurationMinutes,
            MeetingLink = request.MeetingLink,
            IsRead = false
        };

        thread.UpdatedAt = DateTime.UtcNow;
        _context.CommunicationMessages.Add(message);

        await _context.SaveChangesAsync(ct);

        return new CommunicationMessageDto(
            message.Id,
            thread.Id,
            message.SenderProfileId,
            sender.Headline ?? sender.Slug,
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
