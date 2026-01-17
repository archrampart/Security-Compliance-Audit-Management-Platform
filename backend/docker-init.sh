#!/bin/bash
# Don't use set -e here, we want to handle errors gracefully

echo "🔧 Backend initialization starting..."
echo ""

# Change to app directory (where we run from)
cd /app

# Run Python initialization script
if python scripts/docker_init.py; then
    echo ""
    echo "✅ Initialization complete! Starting server..."
    exit 0
else
    echo ""
    echo "❌ Initialization failed! Check logs above for details."
    echo "   The server will not start until initialization succeeds."
    exit 1
fi

