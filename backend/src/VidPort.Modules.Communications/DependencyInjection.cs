using Microsoft.Extensions.DependencyInjection;

namespace VidPort.Modules.Communications;

public static class DependencyInjection
{
    public static IServiceCollection AddCommunicationsModule(this IServiceCollection services)
    {
        services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(DependencyInjection).Assembly));

        return services;
    }
}
