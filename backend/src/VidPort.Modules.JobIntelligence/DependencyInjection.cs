using Microsoft.Extensions.DependencyInjection;

namespace VidPort.Modules.JobIntelligence;

public static class DependencyInjection
{
    public static IServiceCollection AddJobIntelligenceModule(this IServiceCollection services)
    {
        services.AddMediatR(cfg =>
            cfg.RegisterServicesFromAssembly(typeof(DependencyInjection).Assembly));
        return services;
    }
}
