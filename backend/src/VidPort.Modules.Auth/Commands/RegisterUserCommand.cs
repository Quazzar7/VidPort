using MediatR;
using VidPort.Core.Enums;

namespace VidPort.Modules.Auth.Commands;

public record RegisterUserCommand(string Email, string Password, UserRole Role) : IRequest<Guid>;
