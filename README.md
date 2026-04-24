# VidPort

## Docker Setup

### Local Development
To start the entire stack locally:
```bash
docker compose up --build
```

### GitHub Container Registry (GHCR)
The project is configured to automatically build and push Docker images to GHCR on every push to `main`.

**Login to GHCR:**
```bash
echo $GITHUB_TOKEN | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

**Pull and Run Production Images:**
```bash
docker compose pull
docker compose up -d
```
