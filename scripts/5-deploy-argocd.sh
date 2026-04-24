#!/usr/bin/env bash
set -euo pipefail

echo "==> Creating argocd namespace..."
kubectl apply -f k8s/namespaces.yaml

echo "==> Installing ArgoCD..."
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml --server-side --force-conflicts

echo "==> Waiting for ArgoCD components to be ready..."
kubectl rollout status deployment/argocd-server -n argocd --timeout=300s

echo "==> Applying VidPort ArgoCD Applications..."
kubectl apply -f gitops/argocd/app-platform.yaml
kubectl apply -f gitops/argocd/app-vidport.yaml

echo ""
echo "ArgoCD is installed and VidPort applications are registered!"
echo ""
echo "To access the ArgoCD UI:"
echo "1. Run this command in a separate terminal:"
echo "   kubectl port-forward svc/argocd-server -n argocd 8080:443"
echo ""
echo "2. Open your browser and go to: https://localhost:8080"
echo "   (Note: You may need to click 'Advanced' and 'Proceed' because of the self-signed certificate)"
echo ""
echo "3. Login credentials:"
echo "   Username: admin"
echo "   Password: (Run the following command to get it)"
echo "   kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath=\"{.data.password}\" | base64 -d; echo"
echo ""
