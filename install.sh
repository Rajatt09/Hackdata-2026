#!/bin/bash

# Exit on error
set -e

echo "Installing Nudge CLI..."

INSTALL_DIR="$HOME/.nudge-cli"
REPO="https://github.com/Rajatt09/Hackdata-2026.git"

# Check if directory already exists
if [ -d "$INSTALL_DIR" ]; then
  echo "Updating existing installation in $INSTALL_DIR..."
  cd "$INSTALL_DIR"
  git pull origin main
else
  echo "Cloning repository to $INSTALL_DIR..."
  git clone "$REPO" "$INSTALL_DIR"
  cd "$INSTALL_DIR"
fi

echo "Installing dependencies..."
# Install main nudge package dependencies first
cd "$INSTALL_DIR/nudge"
npm install

# Install cli dependencies and link
cd "$INSTALL_DIR/cli"
npm install
npm link

echo "==================================="
echo "Nudge CLI installed successfully!"
echo "Run: nudge init"
echo "==================================="