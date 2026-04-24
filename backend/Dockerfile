# ---------- build ----------
    FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
    WORKDIR /src
    
    # Copy solution + project files (for caching)
    COPY ["VidPort.sln", "./"]
    COPY ["src/VidPort.API/VidPort.API.csproj", "src/VidPort.API/"]
    COPY ["src/VidPort.Core/VidPort.Core.csproj", "src/VidPort.Core/"]
    COPY ["src/VidPort.Infrastructure/VidPort.Infrastructure.csproj", "src/VidPort.Infrastructure/"]
    COPY ["src/VidPort.Modules.Auth/VidPort.Modules.Auth.csproj", "src/VidPort.Modules.Auth/"]
    COPY ["src/VidPort.Modules.Profiles/VidPort.Modules.Profiles.csproj", "src/VidPort.Modules.Profiles/"]
    COPY ["src/VidPort.Modules.Uploads/VidPort.Modules.Uploads.csproj", "src/VidPort.Modules.Uploads/"]
    COPY ["src/VidPort.Modules.Communications/VidPort.Modules.Communications.csproj", "src/VidPort.Modules.Communications/"]
    COPY ["src/VidPort.Modules.JobIntelligence/VidPort.Modules.JobIntelligence.csproj", "src/VidPort.Modules.JobIntelligence/"]
    COPY ["src/VidPort.Shared/VidPort.Shared.csproj", "src/VidPort.Shared/"]
    
    RUN dotnet restore
    
    # Copy full source
    COPY . .
    
    # Publish only API project
    WORKDIR /src/src/VidPort.API
    RUN dotnet publish "VidPort.API.csproj" -c Release -o /app/publish /p:UseAppHost=false
    
    # ---------- runtime ----------
    FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
    WORKDIR /app
    
    ENV ASPNETCORE_URLS=http://+:5000
    EXPOSE 5000
    
    COPY --from=build /app/publish .
    
    ENTRYPOINT ["dotnet", "VidPort.API.dll"]