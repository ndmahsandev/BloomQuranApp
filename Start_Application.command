#!/bin/bash
cd "$(dirname "$0")"
echo "===================================================="
echo "Bloom Quran Application (Mac/Linux Installer)"
echo "===================================================="
echo "Installing necessary modules (this may take a minute or two on first run)..."
npm install
echo ""
echo "Starting the application..."
echo "Please wait for the browser link to appear (usually http://localhost:3000)"
npm run dev
