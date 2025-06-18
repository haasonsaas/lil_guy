#!/bin/bash
set -e

echo "Starting Cloudflare Pages build..."

# Install bun
echo "Installing bun..."
curl -fsSL https://bun.sh/install | bash
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"

# Verify bun installation
echo "Bun version:"
bun --version

# Install dependencies
echo "Installing dependencies..."
bun install --frozen-lockfile

# Build the project
echo "Building project..."
bun run build

echo "Build completed successfully!"