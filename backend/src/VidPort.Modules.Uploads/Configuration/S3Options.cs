namespace VidPort.Modules.Uploads.Configuration;

public class S3Options
{
    public string ServiceUrl { get; set; } = string.Empty;
    public string AccessKey { get; set; } = string.Empty;
    public string SecretKey { get; set; } = string.Empty;
    public string RawBucketName { get; set; } = string.Empty;
    public bool ForcePathStyle { get; set; } = true;
}
