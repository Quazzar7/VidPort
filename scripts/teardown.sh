#!/usr/bin/env bash
set -euo pipefail

echo "==> Deleting k3d cluster 'vidport'..."
k3d cluster delete vidport

echo "==> Removing /etc/hosts entry..."
sudo sed -i '' '/vidport.local/d' /etc/hosts

echo "Done. Everything cleaned up."
