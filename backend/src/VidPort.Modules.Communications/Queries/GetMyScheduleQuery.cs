using MediatR;
using VidPort.Modules.Communications.Dtos;

namespace VidPort.Modules.Communications.Queries;

public record GetMyScheduleQuery(Guid ProfileId) : IRequest<List<CommunicationMessageDto>>;
