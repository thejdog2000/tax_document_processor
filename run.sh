#!/bin/bash
# run.sh — Launch Tax Document Processor directly with Python (no build needed)
# Use this for testing. Use build.sh to create a distributable .app

echo "================================================"
echo " Tax Document Processor — Quick Launch"
echo "================================================"
echo ""

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "ERROR: python3 not found."
    echo "Install from https://python.org or run: brew install python3"
    exit 1
fi

# Install dependencies if needed
echo "Checking dependencies..."
pip3 install -r requirements.txt --quiet

echo "Launching app..."
python3 app.py
