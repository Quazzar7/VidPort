using MediatR;
using Microsoft.AspNetCore.Mvc;
using VidPort.Core.Enums;
using VidPort.Modules.Auth.Commands;

namespace VidPort.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IMediator _mediator;

    public AuthController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        var command = new RegisterUserCommand(request.Email, request.Password, request.Role);
        var userId = await _mediator.Send(command);
        return Ok(new { UserId = userId });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var command = new LoginCommand(request.Email, request.Password);
        var response = await _mediator.Send(command);

        SetRefreshTokenCookie(response.RefreshToken);

        return Ok(new { AccessToken = response.AccessToken });
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh()
    {
        var refreshToken = Request.Cookies["refreshToken"];

        if (string.IsNullOrEmpty(refreshToken))
        {
            return Unauthorized();
        }

        var command = new RefreshTokenCommand(refreshToken);
        var response = await _mediator.Send(command);

        SetRefreshTokenCookie(response.RefreshToken);

        return Ok(new { AccessToken = response.AccessToken });
    }

    [HttpPost("logout")]
    public IActionResult Logout()
    {
        Response.Cookies.Delete("refreshToken");
        return NoContent();
    }

    private void SetRefreshTokenCookie(string refreshToken)
    {
        var isDev = HttpContext.RequestServices
            .GetRequiredService<IWebHostEnvironment>()
            .IsDevelopment();

        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Expires = DateTime.UtcNow.AddDays(7),
            SameSite = isDev ? SameSiteMode.Lax : SameSiteMode.Strict,
            Secure = !isDev
        };
        Response.Cookies.Append("refreshToken", refreshToken, cookieOptions);
    }
}

public record RegisterRequest(string Email, string Password, UserRole Role);
public record LoginRequest(string Email, string Password);
