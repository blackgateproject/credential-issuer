#!/bin/sh
set -e

# Copy .env.example to .env if .env doesn't exist
if [ ! -f .env ]; then
  echo "Creating .env file from .env.example..."
  cp .env.example .env
fi

# Generate a new Veramo secret key with improved parsing
echo "Generating new VERAMO_SECRET_KEY..."
KEY_OUTPUT=$(npx @veramo/cli config create-secret-key)
echo "Raw output from key generation:"
echo "$KEY_OUTPUT"

# Extract the key using a more precise pattern
SECRET_KEY=$(echo "$KEY_OUTPUT" | grep -o '[0-9a-f]\{64\}')
echo "Extracted key: $SECRET_KEY"

if [ -n "$SECRET_KEY" ]; then
  # Export it for the current process
  export VERAMO_SECRET_KEY=$SECRET_KEY
  
  # Update the .env file
  sed -i "s|VERAMO_SECRET_KEY=.*|VERAMO_SECRET_KEY=$SECRET_KEY|" .env
  
  echo "VERAMO_SECRET_KEY has been set to: $SECRET_KEY"
else
  echo "Failed to extract VERAMO_SECRET_KEY, generating fallback key..."
  # Generate fallback key using OpenSSL
  SECRET_KEY=$(openssl rand -hex 32)
  export VERAMO_SECRET_KEY=$SECRET_KEY
  sed -i "s|VERAMO_SECRET_KEY=.*|VERAMO_SECRET_KEY=$SECRET_KEY|" .env
  echo "Fallback VERAMO_SECRET_KEY has been set to: $SECRET_KEY"
fi

# Execute the CMD
exec "$@"
