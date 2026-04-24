using MediatR;
using Microsoft.EntityFrameworkCore;
using VidPort.Infrastructure.Data;
using VidPort.Modules.Communications.Dtos;

namespace VidPort.Modules.Communications.Queries;

public class GetMyThreadsQueryHandler : IRequestHandler<GetMyThreadsQuery, List<CommunicationThreadDto>>
{
    private readonly ApplicationDbContext _context;

    public GetMyThreadsQueryHandler(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<CommunicationThreadDto>> Handle(GetMyThreadsQuery request, CancellationToken ct)
    {
        var threads = await _context.CommunicationThreads
            .Include(t => t.InitiatorProfile)
            .Include(t => t.RecipientProfile)
            .Include(t => t.Messages.OrderByDescending(m => m.CreatedAt).Take(1))
            .Where(t => t.InitiatorProfileId == request.ProfileId || t.RecipientProfileId == request.ProfileId)
            .OrderByDescending(t => t.UpdatedAt)
            .ToListAsync(ct);

        return threads.Select(t =>
        {
            var otherProfile = t.InitiatorProfileId == request.ProfileId ? t.RecipientProfile : t.InitiatorProfile;
            var lastMessage = t.Messages.FirstOrDefault();

            return new CommunicationThreadDto(
                t.Id,
                otherProfile.Id,
                otherProfile.Headline ?? otherProfile.Slug,
                otherProfile.Slug,
                t.UpdatedAt,
                lastMessage == null ? null : new CommunicationMessageDto(
                    lastMessage.Id,
                    t.Id,
                    lastMessage.SenderProfileId,
                    "", // We'll skip headline in summary to save context/perf
                    lastMessage.Type,
                    lastMessage.Content,
                    lastMessage.ScheduledAt,
                    lastMessage.DurationMinutes,
                    lastMessage.MeetingLink,
                    lastMessage.CreatedAt,
                    lastMessage.IsRead
                )
            );
        }).ToList();
    }
}
