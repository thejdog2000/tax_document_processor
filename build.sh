#!/bin/bash
# build.sh — Builds Tax Document Processor as a Mac .app bundle
# Run once from the tax_processor/ folder.
# Requires Python 3.10+ installed (python.org or Homebrew).

echo "================================================"
echo " Tax Document Processor — Mac Build Script"
echo "================================================"
echo ""

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "ERROR: python3 not found."
    echo "Install from https://python.org or run: brew install python3"
    exit 1
fi

echo "Step 1: Installing dependencies..."
pip3 install -r requirements.txt
pip3 install pyinstaller
if [ $? -ne 0 ]; then
    echo "ERROR: pip install failed. Check your internet connection."
    exit 1
fi

echo ""
echo "Step 2: Building .app bundle..."
pyinstaller build_mac.spec --clean
if [ $? -ne 0 ]; then
    echo "ERROR: PyInstaller build failed. See above for details."
    exit 1
fi

echo ""
echo "================================================"
echo " BUILD COMPLETE!"
echo ""
echo " Your app is in:  dist/TaxProcessor.app"
echo ""
echo " To install: drag TaxProcessor.app to your"
echo " Applications folder."
echo ""
echo " To deploy to other Macs, zip the .app and"
echo " send it — no Python needed on their machine."
echo "================================================"
