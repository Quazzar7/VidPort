using MediatR;
using VidPort.Modules.Communications.Dtos;

namespace VidPort.Modules.Communications.Queries;

public record GetMyThreadsQuery(Guid ProfileId) : IRequest<List<CommunicationThreadDto>>;
