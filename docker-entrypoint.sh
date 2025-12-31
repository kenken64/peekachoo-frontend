#!/bin/sh
set -e

# Runtime environment variable injection
# This script runs when the container starts and injects Railway env vars

echo "Injecting runtime environment variables..."

# Create env-config.js with runtime environment variables
cat > /usr/share/nginx/html/env-config.js <<EOF
window._env_ = {
  API_URL: "${VITE_API_URL:-http://localhost:3000/api}"
};
EOF

echo "Environment variables injected successfully!"
echo "API_URL: ${VITE_API_URL:-http://localhost:3000/api}"

# Start nginx
exec nginx -g 'daemon off;'
