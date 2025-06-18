#!/bin/bash
set -e

echo "Starting Cloudflare Pages build..."

# Remove node_modules if it exists (from npm install)
if [ -d "node_modules" ]; then
  echo "Removing node_modules from npm..."
  rm -rf node_modules
fi

# Install bun
echo "Installing bun..."
curl -fsSL https://bun.sh/install | bash
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"

# Verify bun installation
echo "Bun version:"
bun --version

# Install dependencies with bun
echo "Installing dependencies with bun..."
bun install --frozen-lockfile

# Build the project
echo "Building project..."
bun run build

echo "Build completed successfully!"