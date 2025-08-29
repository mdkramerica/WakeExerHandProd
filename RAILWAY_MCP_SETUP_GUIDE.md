# Railway MCP Setup Guide

## 🚨 Current Status
- ✅ Railway MCP configuration exists in Cursor
- ✅ Smithery CLI is working and can connect to Railway MCP
- ❌ Railway CLI authentication is corrupted
- 🔧 **Need to set up API token authentication**

## 🔑 Next Steps to Get Railway MCP Working

### Step 1: Get Your Railway API Token
1. Go to https://railway.app/account/tokens
2. Click "Create Token"
3. Give it a name like "MCP Access"
4. Copy the generated token

### Step 2: Update MCP Configuration
Replace the current key in `/Users/mattkramer/.cursor/mcp.json` with your actual Railway API token:

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
        "YOUR_ACTUAL_RAILWAY_API_TOKEN_HERE"
      ]
    }
  }
}
```

### Step 3: Alternative - Environment Variable Approach (Recommended)
Instead of putting the token directly in the config file, you can use environment variables:

1. **Set the environment variable:**
   ```bash
   export RAILWAY_TOKEN="your_actual_railway_api_token_here"
   ```

2. **Update MCP config to use environment variable:**
   ```json
   {
     "mcpServers": {
       "railway-mcp": {
         "command": "bash",
         "args": [
           "-c",
           "RAILWAY_TOKEN=$RAILWAY_TOKEN npx @smithery/cli@latest run @jason-tan-swe/railway-mcp"
         ]
       }
     }
   }
   ```

### Step 4: Restart Cursor
After updating the configuration:
1. Close Cursor completely
2. If using environment variable approach, start Cursor from terminal: `cursor .`
3. If using direct API key, just restart Cursor normally

### Step 5: Test Railway MCP
Try these commands in Cursor chat:
- "List my Railway projects"
- "Show Railway service status"
- "Get Railway environment variables for my project"

## 🧪 Manual Testing
You can test the Railway MCP directly before using it in Cursor:

```bash
# Test with your actual API token
npx @smithery/cli@latest run @jason-tan-swe/railway-mcp --key "YOUR_TOKEN_HERE"
```

## 🎯 Current Configuration Status
- ✅ MCP configuration file exists
- ✅ Railway MCP entry is present
- ✅ Smithery CLI is accessible
- ✅ Railway MCP package is available
- ❌ **Need actual Railway API token** (currently using placeholder)

## 🔧 Troubleshooting Railway CLI (Optional)
If you want to fix the Railway CLI as well:

```bash
# Try reinstalling Railway CLI
brew uninstall railway
brew install railway

# Or try the npm version
npm install -g @railway/cli
```

But for MCP purposes, you only need the API token - the CLI doesn't need to work.

## ✅ Success Indicators
Railway MCP is working when:
- No authentication errors in Cursor
- Railway commands respond with actual project data
- Can list Railway projects/services
- Can access Railway environment variables

The key is getting your actual Railway API token from https://railway.app/account/tokens and updating the MCP configuration with it.

