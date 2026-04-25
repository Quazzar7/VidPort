using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Text;
using System.Text.Json;

namespace VidPort.API.Controllers;

[ApiController]
[Route("api/ai")]
[Authorize]
public class AiController : ControllerBase
{
    private readonly IHttpClientFactory _http;
    private readonly string _aiServiceUrl;

    public AiController(IHttpClientFactory http, IConfiguration config)
    {
        _http = http;
        _aiServiceUrl = config["AiService:BaseUrl"] ?? "http://ai-service.apps.svc.cluster.local:8000";
    }

    [HttpPost("analyze-job")]
    public async Task<IActionResult> AnalyzeJob([FromBody] JsonElement body, CancellationToken ct)
        => await Proxy("/ai/analyze-job", body, ct);

    [HttpPost("cover-letter")]
    public async Task<IActionResult> CoverLetter([FromBody] JsonElement body, CancellationToken ct)
        => await Proxy("/ai/cover-letter", body, ct);

    [HttpPost("interview-prep")]
    public async Task<IActionResult> InterviewPrep([FromBody] JsonElement body, CancellationToken ct)
        => await Proxy("/ai/interview-prep", body, ct);

    private async Task<IActionResult> Proxy(string path, JsonElement body, CancellationToken ct)
    {
        try
        {
            var client = _http.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(180); // llama3 on CPU is slow
            var content = new StringContent(body.GetRawText(), Encoding.UTF8, "application/json");
            var resp = await client.PostAsync($"{_aiServiceUrl}{path}", content, ct);
            var json = await resp.Content.ReadAsStringAsync(ct);
            return Content(json, "application/json");
        }
        catch (Exception ex)
        {
            return StatusCode(502, new { error = "AI service unavailable", detail = ex.Message });
        }
    }
}
