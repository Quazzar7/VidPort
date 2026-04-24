#!/usr/bin/env bash
set -euo pipefail

echo "==> Installing kube-prometheus-stack..."
helm upgrade --install kube-prometheus-stack prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  -f helm/values/kube-prometheus-values.yaml \
  --wait --timeout=300s

echo "==> Applying Prometheus scrape config..."
kubectl apply -f k8s/monitoring/prometheus-scrape-config.yaml

echo ""
echo "Monitoring ready."
echo ""
echo "Access Grafana:"
echo "  kubectl port-forward svc/kube-prometheus-stack-grafana 3001:80 -n monitoring"
echo "  Open http://localhost:3001  (admin / admin)"
echo ""
echo "Access Prometheus:"
echo "  kubectl port-forward svc/kube-prometheus-stack-prometheus 9090:9090 -n monitoring"
echo "  Open http://localhost:9090"
