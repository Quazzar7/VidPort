using MediatR;

namespace VidPort.Modules.Auth.Commands;

public record AuthResponse(string AccessToken, string RefreshToken);

public record LoginCommand(string Email, string Password) : IRequest<AuthResponse>;
