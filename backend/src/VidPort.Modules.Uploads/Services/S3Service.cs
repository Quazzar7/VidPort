using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.Extensions.Options;
using VidPort.Modules.Uploads.Configuration;

namespace VidPort.Modules.Uploads.Services;

public interface IS3Service
{
    string GeneratePreSignedUploadUrl(string key, string contentType);
}

public class S3Service : IS3Service
{
    private readonly IAmazonS3 _s3Client;
    private readonly S3Options _options;

    public S3Service(IAmazonS3 s3Client, IOptions<S3Options> options)
    {
        _s3Client = s3Client;
        _options = options.Value;
    }

    public string GeneratePreSignedUploadUrl(string key, string contentType)
    {
        var request = new GetPreSignedUrlRequest
        {
            BucketName = _options.RawBucketName,
            Key = key,
            Verb = HttpVerb.PUT,
            Expires = DateTime.UtcNow.AddMinutes(15),
            ContentType = contentType
        };

        return _s3Client.GetPreSignedURL(request);
    }
}
