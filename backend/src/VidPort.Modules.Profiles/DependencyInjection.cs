using Microsoft.Extensions.DependencyInjection;

namespace VidPort.Modules.Profiles;

public static class DependencyInjection
{
    public static IServiceCollection AddProfilesModule(this IServiceCollection services)
    {
        services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(DependencyInjection).Assembly));

        return services;
    }
}
