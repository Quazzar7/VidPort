#!/usr/bin/env bash
set -euo pipefail

echo "==> Adding Helm repos (ingress-nginx only)..."
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx 2>/dev/null || true
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts 2>/dev/null || true
helm repo update

echo "==> Applying namespaces..."
kubectl apply -f k8s/namespaces.yaml

echo "==> Installing NGINX Ingress Controller..."
helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace \
  --set controller.service.type=LoadBalancer \
  --wait --timeout=120s

echo "==> Deploying PostgreSQL (pgvector)..."
kubectl apply -f k8s/platform/postgres.yaml
kubectl rollout status statefulset/postgres -n platform --timeout=120s

echo "==> Deploying Redis..."
kubectl apply -f k8s/platform/redis.yaml
kubectl rollout status deployment/redis -n platform --timeout=60s

echo "==> Deploying MinIO..."
kubectl apply -f k8s/platform/minio.yaml
kubectl rollout status deployment/minio -n platform --timeout=120s

echo "==> Deploying Kafka..."
kubectl apply -f k8s/platform/kafka.yaml
echo "    Waiting for Kafka (up to 3 min)..."
kubectl rollout status statefulset/kafka -n platform --timeout=180s

echo "==> Running MinIO bucket init job..."
kubectl delete job minio-create-bucket -n platform --ignore-not-found
kubectl apply -f k8s/platform/minio-init-job.yaml
kubectl wait --for=condition=complete job/minio-create-bucket -n platform --timeout=120s
echo "    MinIO bucket 'videos' created."

echo "==> Deploying Kafdrop..."
kubectl apply -f k8s/platform/kafdrop.yaml

echo ""
kubectl get pods -n platform
echo ""
echo "Platform layer ready. Run ./scripts/3-deploy-apps.sh next."
