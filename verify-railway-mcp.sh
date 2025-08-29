#!/bin/bash

echo "🧪 Railway MCP Verification Script"
echo "=================================="
echo ""

# Check if MCP configuration exists
if [ -f "/Users/mattkramer/.cursor/mcp.json" ]; then
    echo "✅ MCP configuration file exists"
else
    echo "❌ MCP configuration file missing"
    exit 1
fi

# Check if configuration has Railway MCP
if grep -q "railway-mcp" "/Users/mattkramer/.cursor/mcp.json"; then
    echo "✅ Railway MCP found in configuration"
else
    echo "❌ Railway MCP not found in configuration"
    exit 1
fi

# Check if token is present
if grep -q "d46f257b-e26a-4c19-ae13-f754582d1a3d" "/Users/mattkramer/.cursor/mcp.json"; then
    echo "✅ Correct API token found in configuration"
else
    echo "❌ API token not found or incorrect"
    exit 1
fi

echo ""
echo "🔧 Testing Railway MCP connectivity..."

# Test Smithery CLI accessibility
if command -v npx >/dev/null 2>&1; then
    echo "✅ npx is available"
else
    echo "❌ npx is not available"
    exit 1
fi

# Test Railway MCP package accessibility
echo "🔍 Testing Smithery CLI access to Railway MCP..."
npx @smithery/cli@latest run @jason-tan-swe/railway-mcp --help > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Railway MCP package is accessible via Smithery CLI"
else
    echo "❌ Cannot access Railway MCP package"
    exit 1
fi

echo ""
echo "📋 MCP Configuration Summary:"
echo "=============================="
echo "• Configuration file: ✅ Present"
echo "• Railway MCP entry: ✅ Found"
echo "• API token: ✅ Correct (d46f257b-e26a-4c19-ae13-f754582d1a3d)"
echo "• Smithery CLI: ✅ Accessible"
echo "• Railway MCP package: ✅ Available"

echo ""
echo "🎯 Next Steps to Complete Setup:"
echo "================================"
echo "1. 🔄 Restart Cursor completely"
echo "2. 🧪 Test Railway commands in Cursor chat"
echo "3. ✅ Verify Railway MCP tools are available"

echo ""
echo "🔬 Test Commands to Try:"
echo "========================"
echo "• 'List my Railway projects'"
echo "• 'Show Railway service status'"
echo "• 'Get Railway environment variables'"

echo ""
echo "🎉 Railway MCP configuration is ready!"
echo "Just restart Cursor to activate it."





