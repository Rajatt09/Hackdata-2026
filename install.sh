#!/bin/bash

echo "Installing Nudge CLI..."

REPO="https://github.com/Rajatt09/Hackdata-2026"

git clone $REPO nudge-temp

cd nudge-temp/cli

npm install

npm link

cd ../..

rm -rf nudge-temp

echo "Nudge CLI installed!"
echo "Run: nudge start"