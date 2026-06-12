#!/bin/bash
# Build on Mac and upload to EC2. Usage:
#   ./deploy/upload-frontend.sh ~/Downloads/dsa-key.pem ubuntu@35.77.118.221
set -euo pipefail

KEY="${1:?Usage: $0 <pem-file> <user@host>}"
HOST="${2:?Usage: $0 <pem-file> <user@host>}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

cd "$ROOT/web"
PUBLIC_API_URL=/api npm run build

scp -i "$KEY" -r dist/* "$HOST:/tmp/dsa-dist/"

ssh -i "$KEY" "$HOST" 'sudo mkdir -p /var/www/dsa && sudo rm -rf /var/www/dsa/* && sudo cp -r /tmp/dsa-dist/* /var/www/dsa/ && sudo chown -R www-data:www-data /var/www/dsa && rm -rf /tmp/dsa-dist'

echo "Done. Open http://YOUR_EC2_IP"
