using Amazon.S3;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using VidPort.Modules.Uploads.Configuration;
using VidPort.Modules.Uploads.Jobs;
using VidPort.Modules.Uploads.Services;

namespace VidPort.Modules.Uploads;

public static class DependencyInjection
{
    public static IServiceCollection AddUploadsModule(this IServiceCollection services, IConfiguration configuration)
    {
        var s3Options = configuration.GetSection("S3Options").Get<S3Options>() 
                        ?? throw new Exception("S3Options not found in configuration");
        
        services.Configure<S3Options>(configuration.GetSection("S3Options"));

        var s3Config = new AmazonS3Config
        {
            ServiceURL = s3Options.ServiceUrl,
            ForcePathStyle = s3Options.ForcePathStyle
        };

        services.AddSingleton<IAmazonS3>(new AmazonS3Client(s3Options.AccessKey, s3Options.SecretKey, s3Config));
        
        services.AddScoped<IS3Service, S3Service>();
        services.AddScoped<IProcessVideoJob, ProcessVideoJob>();

        services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(DependencyInjection).Assembly));

        return services;
    }
}
