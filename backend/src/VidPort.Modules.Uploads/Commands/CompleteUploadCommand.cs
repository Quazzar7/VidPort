using MediatR;

namespace VidPort.Modules.Uploads.Commands;

public record CompleteUploadCommand(Guid VideoId) : IRequest;
