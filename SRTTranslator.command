#!/bin/bash
# SRT Translator Launcher Script

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Change to script directory
cd "$SCRIPT_DIR"

# Find Python (Anaconda öncelikli)
PYTHON_CMD=""
if [ -f "/opt/anaconda3/bin/python" ]; then
    PYTHON_CMD="/opt/anaconda3/bin/python"
elif command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
else
    PYTHON_CMD="python"
fi

# Run the application
echo "🎬 SRT Translator başlatılıyor..."
exec "$PYTHON_CMD" srt_translator_gui.py