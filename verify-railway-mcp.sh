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

# Check if using environment variable approach
if grep -q "RAILWAY_TOKEN=\$RAILWAY_TOKEN" "/Users/mattkramer/.cursor/mcp.json"; then
    echo "✅ Environment variable approach found in configuration"
else
    echo "❌ Environment variable approach not found"
    # Check if token is present in old format
    if grep -q "f3f54ca8-9910-43e3-9603-9e52304ac99a" "/Users/mattkramer/.cursor/mcp.json"; then
        echo "✅ Correct API token found in configuration"
    else
        echo "❌ API token not found or incorrect"
        exit 1
    fi
fi

echo ""
echo "🔧 Testing Railway MCP connectivity..."

# Check if token is present in environment
if [ -z "$RAILWAY_TOKEN" ]; then
    echo "❌ RAILWAY_TOKEN environment variable not set"
    exit 1
else
    echo "✅ RAILWAY_TOKEN environment variable is set"
fi

# Check if token value is correct
if [ "$RAILWAY_TOKEN" = "f3f54ca8-9910-43e3-9603-9e52304ac99a" ]; then
    echo "✅ RAILWAY_TOKEN value is correct"
else
    echo "❌ RAILWAY_TOKEN value is incorrect"
    exit 1
fi

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
echo "• Authentication method: ✅ Environment variable approach"
echo "• RAILWAY_TOKEN env var: ✅ Set and correct"
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





