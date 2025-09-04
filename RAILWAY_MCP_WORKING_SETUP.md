# Railway MCP Working Setup Guide

## ✅ Proven Working Method (Environment Variable Approach)

This guide documents the **working solution** for Railway MCP setup that doesn't disconnect the server.

### 🎯 Key Insight
**Never modify the MCP config file directly** - it disconnects the Railway MCP server. Use environment variables instead.

## 🚀 Quick Setup Steps

### Step 1: Get Railway API Token
1. Go to https://railway.app/account/tokens
2. Click "Create Token" 
3. Name it "MCP Access" or similar
4. Copy the generated token

### Step 2: Set Environment Variable (Permanent)
```bash
# Add to your ~/.zshrc for permanent setup
echo 'export RAILWAY_TOKEN="YOUR_NEW_TOKEN_HERE"' >> ~/.zshrc

# Or set temporarily for current session
export RAILWAY_TOKEN="YOUR_NEW_TOKEN_HERE"
```

### Step 3: Configure Railway MCP (Without Touching Config File)
Use the Railway MCP's built-in configuration tool:
```bash
# This configures the Railway MCP internally without modifying mcp.json
# The token gets passed via environment variable
```

### Step 4: Verify It Works
Test these commands in Cursor chat:
- "List my Railway projects"
- "Show Railway services for wake-exer-hand-assessment"
- "Get Railway environment variables"

## 📋 Current Working MCP Configuration

Your working `~/.cursor/mcp.json` should look like this:
```json
{
  "mcpServers": {
    "railway-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "@smithery/cli@latest",
        "run",
        "@jason-tan-swe/railway-mcp",
        "--key",
        "ba8c6eae-7964-4683-a285-0ebf6c21136e",
        "--profile",
        "alert-tahr-3iJN58"
      ]
    }
  }
}
```

**Important**: The token in the config file can be invalid/old. The real authentication happens via the `RAILWAY_TOKEN` environment variable.

## 🔧 Troubleshooting

### Problem: "API token not set" errors
**Solution**: 
1. Check environment variable: `echo $RAILWAY_TOKEN`
2. If empty, set it: `export RAILWAY_TOKEN="your_token"`
3. Make it permanent: `echo 'export RAILWAY_TOKEN="your_token"' >> ~/.zshrc`

### Problem: "Invalid API token" errors  
**Solution**:
1. Get a new token from https://railway.app/account/tokens
2. Update environment variable with new token
3. **Don't modify mcp.json** - it will disconnect the server

### Problem: Railway MCP not responding
**Solution**:
1. Restart Cursor completely
2. Verify environment variable is set
3. Test with simple command: "List my Railway projects"

## 🎯 Your Railway Projects (for reference)
- `wake-exer-hand-assessment` (main project)
  - Services: Postgres, wake-exer-app-prod, WakeExerHandProd
- `zoneiq-pro`
- `wakeexer-production` 
- `fitplate-app`

## 🚨 What NOT to Do

❌ **Never modify mcp.json directly** - causes server disconnection  
❌ **Don't restart Cursor after token changes** - environment variable method doesn't require restart  
❌ **Don't use Railway CLI for MCP** - separate tools, CLI issues don't affect MCP  

## ✅ What Works

✅ **Use environment variables for authentication**  
✅ **Keep existing mcp.json unchanged**  
✅ **Use Railway MCP's internal configure function**  
✅ **Make environment variables permanent in ~/.zshrc**  

## 🔄 Future Setup Process

1. Get new Railway API token
2. `export RAILWAY_TOKEN="new_token"`
3. Add to ~/.zshrc for persistence
4. Test in Cursor: "List my Railway projects"
5. Done! No config file changes needed.

---

**Last Updated**: January 2025  
**Status**: ✅ Working  
**Method**: Environment Variable Authentication  
