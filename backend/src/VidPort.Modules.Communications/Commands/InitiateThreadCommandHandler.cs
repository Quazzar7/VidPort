using MediatR;
using Microsoft.EntityFrameworkCore;
using VidPort.Core.Entities;
using VidPort.Core.Enums;
using VidPort.Core.Exceptions;
using VidPort.Infrastructure.Data;
using VidPort.Modules.Communications.Dtos;

namespace VidPort.Modules.Communications.Commands;

public class InitiateThreadCommandHandler : IRequestHandler<InitiateThreadCommand, CommunicationThreadDto>
{
    private readonly ApplicationDbContext _context;

    public InitiateThreadCommandHandler(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<CommunicationThreadDto> Handle(InitiateThreadCommand request, CancellationToken ct)
    {
        var initiator = await _context.Profiles
            .Include(p => p.User)
            .FirstOrDefaultAsync(p => p.Id == request.InitiatorProfileId, ct)
            ?? throw new DomainException("Initiator profile not found");

        var recipient = await _context.Profiles
            .Include(p => p.User)
            .FirstOrDefaultAsync(p => p.Id == request.RecipientProfileId, ct)
            ?? throw new DomainException("Recipient profile not found");

        // Validate Permissions
        ValidatePermissions(initiator.User.Role, recipient.User.Role, request.Type);

        // Check if thread already exists
        var thread = await _context.CommunicationThreads
            .FirstOrDefaultAsync(t => 
                (t.InitiatorProfileId == request.InitiatorProfileId && t.RecipientProfileId == request.RecipientProfileId) ||
                (t.InitiatorProfileId == request.RecipientProfileId && t.RecipientProfileId == request.InitiatorProfileId), ct);

        if (thread == null)
        {
            thread = new CommunicationThread
            {
                Id = Guid.NewGuid(),
                InitiatorProfileId = request.InitiatorProfileId,
                RecipientProfileId = request.RecipientProfileId
            };
            _context.CommunicationThreads.Add(thread);
        }

        var message = new CommunicationMessage
        {
            Id = Guid.NewGuid(),
            ThreadId = thread.Id,
            SenderProfileId = request.InitiatorProfileId,
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

        return new CommunicationThreadDto(
            thread.Id,
            recipient.Id,
            recipient.Headline ?? recipient.Slug,
            recipient.Slug,
            thread.UpdatedAt,
            new CommunicationMessageDto(
                message.Id,
                thread.Id,
                message.SenderProfileId,
                initiator.Headline ?? initiator.Slug,
                message.Type,
                message.Content,
                message.ScheduledAt,
                message.DurationMinutes,
                message.MeetingLink,
                message.CreatedAt,
                message.IsRead
            )
        );
    }

    private void ValidatePermissions(UserRole initiatorRole, UserRole recipientRole, CommunicationType type)
    {
        if (initiatorRole == UserRole.Recruiter)
        {
            // Recruiters can initiate anything to Creators
            if (recipientRole != UserRole.Creator)
                throw new DomainException("Recruiters can only initiate communication with Creators");
            
            return;
        }

        if (initiatorRole == UserRole.Creator)
        {
            if (recipientRole == UserRole.Recruiter)
            {
                throw new DomainException("Creators cannot initiate new communication threads with Recruiters. Wait for them to reach out first.");
            }

            if (recipientRole == UserRole.Creator)
            {
                // Creators can Chat, Schedule Meeting or Call with other Creators
                if (type != CommunicationType.Chat && type != CommunicationType.Meeting && type != CommunicationType.Call)
                {
                    throw new DomainException("Creators can only use Chat, Meetings or Calls with other Creators");
                }
                return;
            }
        }
        
        throw new DomainException("Invalid communication attempt");
    }
}
