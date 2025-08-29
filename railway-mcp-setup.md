# Railway MCP Authentication Setup Guide

## 🎯 Current Status
✅ **MCP Configuration Updated** - Now using CLI-based approach instead of HTTP
✅ **Smithery CLI Available** - Can access Railway MCP package

## 🔐 Authentication Options

### Option A: Try Without Explicit Auth (Recommended First)
The new CLI-based configuration may work without additional authentication:

1. **Restart Cursor** to reload the MCP configuration
2. **Test Railway commands** in Cursor chat (ask me to list Railway projects)
3. **Check for errors** in Cursor's developer console

### Option B: Environment Variable Authentication (Recommended)
This is the most secure and reliable method:

1. **Get Railway API Token:**
   - Go to https://railway.app/account/tokens
   - Click "Create Token"
   - Give it a name like "MCP Access"
   - Copy the token

2. **Set Environment Variable:**
   ```bash
   # Add to your shell profile (~/.zshrc, ~/.bashrc)
   export RAILWAY_TOKEN="your-token-here"
   
   # Or set temporarily
   export RAILWAY_TOKEN="your-token-here"
   ```

3. **Restart Cursor** from terminal to inherit the environment variable:
   ```bash
   # Close Cursor completely, then start from terminal
   cursor .
   ```

### Option C: MCP Config with API Key
Update your MCP configuration to include the API key directly:

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
        "your-railway-api-token-here"
      ]
    }
  }
}
```

### Option D: Profile-Based Authentication
If you have a Smithery profile setup:

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
        "--profile",
        "your-profile-name"
      ]
    }
  }
}
```

## 🧪 Testing Railway MCP

### 1. Test Basic Connectivity
After setting up authentication, test with simple commands:
- "List my Railway projects"
- "Show Railway service status"
- "Get Railway environment variables"

### 2. Test Database Operations
Try Railway database commands:
- "Connect to Railway database"
- "Show Railway database status"
- "Get Railway database URL"

### 3. Check for Errors
If commands don't work, check:
- Cursor's developer console for MCP errors
- Terminal output when running Smithery CLI manually
- Railway API token permissions

## 🔧 Manual Testing

Test the Smithery CLI directly to verify it works:

```bash
# Test without auth
npx @smithery/cli@latest run @jason-tan-swe/railway-mcp --help

# Test with API key
RAILWAY_TOKEN="your-token" npx @smithery/cli@latest run @jason-tan-swe/railway-mcp

# Test with specific key parameter
npx @smithery/cli@latest run @jason-tan-swe/railway-mcp --key "your-token"
```

## 🚨 Troubleshooting

### "Authentication required" errors:
- Get a Railway API token from https://railway.app/account/tokens
- Set RAILWAY_TOKEN environment variable
- Restart Cursor from terminal

### "Command not found" errors:
- Ensure npx and @smithery/cli are accessible
- Check internet connection for npx downloads

### "Permission denied" errors:
- Verify Railway API token has correct permissions
- Check that token hasn't expired

### MCP not responding:
- Restart Cursor completely
- Check mcp.json syntax is valid
- Try manual Smithery CLI command first

## 📋 Quick Setup Checklist

- [ ] Railway API token obtained
- [ ] Environment variable set (RAILWAY_TOKEN)
- [ ] MCP configuration updated
- [ ] Cursor restarted from terminal
- [ ] Test Railway command in Cursor chat
- [ ] Verify MCP is working

## 🎉 Success Indicators

You'll know Railway MCP is working when:
- ✅ Railway commands respond in Cursor chat
- ✅ Can list Railway projects/services
- ✅ Can access Railway environment variables
- ✅ No authentication errors in console

The most reliable approach is **Option B (Environment Variable)** - set RAILWAY_TOKEN and restart Cursor from terminal.

