#!/usr/bin/env bash
set -euo pipefail

echo "==> Deploying application layer..."
kubectl apply -f k8s/apps/backend.yaml
kubectl apply -f k8s/apps/frontend.yaml
kubectl apply -f k8s/apps/scraper.yaml
kubectl apply -f k8s/apps/processor.yaml
kubectl apply -f k8s/apps/insight-generator.yaml

echo "==> Applying Ingress..."
kubectl apply -f k8s/ingress/ingress.yaml

echo "==> Waiting for backend to be ready..."
kubectl rollout status deployment/backend -n apps --timeout=180s

echo "==> Waiting for frontend to be ready..."
kubectl rollout status deployment/frontend -n apps --timeout=180s

echo ""
echo "All done! Open http://vidport.local in your browser."
echo ""
echo "Useful commands:"
echo "  kubectl get pods -n apps"
echo "  kubectl get pods -n platform"
echo "  kubectl logs -n apps deploy/backend -f"
