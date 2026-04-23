namespace VidPort.Modules.Uploads.Jobs;

public interface IProcessVideoJob
{
    Task ExecuteAsync(Guid videoId, CancellationToken cancellationToken);
}
