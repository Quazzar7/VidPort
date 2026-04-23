using VidPort.Core.Entities;

namespace VidPort.Modules.Auth.Services;

public interface ITokenService
{
    string GenerateAccessToken(User user);
    string GenerateRefreshToken();
}
