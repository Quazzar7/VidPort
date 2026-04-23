using MediatR;
using VidPort.Core.Enums;

namespace VidPort.Modules.Uploads.Queries;

public record UploadUrlResponse(Guid VideoId, string UploadUrl, string Key);

public record GetUploadUrlQuery(Guid UserId, VideoType Type, string ContentType) : IRequest<UploadUrlResponse>;
