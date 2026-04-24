using MediatR;
using VidPort.Modules.Communications.Dtos;

namespace VidPort.Modules.Communications.Queries;

public record GetThreadMessagesQuery(Guid ThreadId, Guid ProfileId) : IRequest<List<CommunicationMessageDto>>;
