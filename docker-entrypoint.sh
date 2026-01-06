#!/bin/sh
set -e

# Runtime environment variable injection
# This script runs when the container starts and injects Railway env vars

echo "Injecting runtime environment variables..."

# Create env-config.js with runtime environment variables
cat > /usr/share/nginx/html/env-config.js <<EOF
window._env_ = {
  API_URL: "${VITE_API_URL:-http://localhost:3000/api}",
  RAZORPAY_KEY_ID: "${RAZORPAY_KEY_ID:-}"
};
EOF

echo "Environment variables injected successfully!"
echo "API_URL: ${VITE_API_URL:-http://localhost:3000/api}"
echo "RAZORPAY_KEY_ID: ${RAZORPAY_KEY_ID:-(not set)}"

# Start nginx
exec nginx -g 'daemon off;'
