#!/bin/bash

echo "🧪 Railway MCP Test Script"
echo "=========================="
echo ""

# Check if RAILWAY_TOKEN is set
if [ -z "$RAILWAY_TOKEN" ]; then
    echo "❌ RAILWAY_TOKEN environment variable is not set"
    echo "💡 Run: export RAILWAY_TOKEN=\"your_token_here\""
    exit 1
else
    echo "✅ RAILWAY_TOKEN is set"
fi

echo ""
echo "Testing Railway MCP via Smithery CLI..."
echo "----------------------------------------"

# Test the MCP directly
npx @smithery/cli@latest run @jason-tan-swe/railway-mcp --help

echo ""
echo "🔍 If you see Railway MCP help above, the MCP is working!"
echo "📝 Next step: Restart Cursor from terminal to use the MCP"
echo ""
echo "Commands to test in Cursor chat:"
echo "- 'List my Railway projects'"
echo "- 'Show Railway service status'" 
echo "- 'Get my Railway database URL'"
