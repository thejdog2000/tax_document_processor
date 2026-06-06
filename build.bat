@echo off
REM build.bat — One-click builder for Tax Document Processor
REM Run this ONCE from the tax_processor folder to install deps and build the EXE.
REM Requires Python 3.10+ installed and on PATH.

echo ================================================
echo  Tax Document Processor — Build Script
echo ================================================
echo.

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found. Install from https://python.org
    pause
    exit /b 1
)

echo Step 1: Installing dependencies...
pip install -r requirements.txt
pip install pyinstaller
if errorlevel 1 (
    echo ERROR: pip install failed. Check your internet connection.
    pause
    exit /b 1
)

echo.
echo Step 2: Building executable...
pyinstaller build.spec --clean
if errorlevel 1 (
    echo ERROR: PyInstaller build failed. See above for details.
    pause
    exit /b 1
)

echo.
echo ================================================
echo  BUILD COMPLETE!
echo.
echo  Your app is in:  dist\TaxProcessor\
echo  The EXE is:      dist\TaxProcessor\TaxProcessor.exe
echo.
echo  To deploy to staff machines, copy the entire
echo  dist\TaxProcessor\ folder (not just the .exe).
echo ================================================
pause
