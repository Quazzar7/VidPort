#!/usr/bin/env bash
set -euo pipefail

REGISTRY="ghcr.io/quazzar7"
CLUSTER="vidport"

echo "==> Tagging worker images with ghcr.io prefix..."
docker tag vidport-scraper:latest          ${REGISTRY}/vidport-scraper:latest
docker tag vidport-processor:latest        ${REGISTRY}/vidport-processor:latest
docker tag vidport-insight-generator:latest ${REGISTRY}/vidport-insight-generator:latest
echo "    Done."

echo "==> Importing all images into k3d cluster '${CLUSTER}'..."
k3d image import \
  ${REGISTRY}/vidport-backend:latest \
  ${REGISTRY}/vidport-frontend:latest \
  ${REGISTRY}/vidport-scraper:latest \
  ${REGISTRY}/vidport-processor:latest \
  ${REGISTRY}/vidport-insight-generator:latest \
  pgvector/pgvector:pg16 \
  redis:alpine \
  minio/minio:latest \
  minio/mc:latest \
  --cluster ${CLUSTER}

echo ""
echo "All images imported. k3d will use local copies — no registry pull needed."
