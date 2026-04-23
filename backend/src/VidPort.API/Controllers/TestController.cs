using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace VidPort.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TestController : ControllerBase
{
    [Authorize]
    [HttpGet("protected")]
    public IActionResult GetProtected()
    {
        return Ok(new { Message = "You are authorized!", UserId = User.Identity?.Name });
    }
}
