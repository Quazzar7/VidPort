#!/usr/bin/env bash
set -euo pipefail

echo "==> Creating k3d cluster 'vidport'..."
k3d cluster create vidport \
  --port "80:80@loadbalancer" \
  --port "443:443@loadbalancer" \
  --api-port 6443 \
  --agents 0 \
  --k3s-arg "--disable=traefik@server:0"

echo "==> Verifying node is ready..."
kubectl wait --for=condition=Ready node --all --timeout=60s

echo "==> Merging kubeconfig..."
k3d kubeconfig merge vidport --kubeconfig-merge-default
kubectl config use-context k3d-vidport

echo "==> Adding /etc/hosts entry (requires sudo)..."
if ! grep -q "vidport.local" /etc/hosts; then
  echo "127.0.0.1   vidport.local" | sudo tee -a /etc/hosts
  echo "    Added vidport.local to /etc/hosts"
else
  echo "    vidport.local already in /etc/hosts"
fi

echo ""
echo "Cluster ready."
echo "Run ./scripts/0-build-and-import.sh next to load local images."
