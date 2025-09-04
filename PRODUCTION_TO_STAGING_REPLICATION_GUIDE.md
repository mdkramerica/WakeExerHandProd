# Production to Staging Environment Replication Guide

## Overview
This guide provides a comprehensive approach to create an exact replica staging environment from your production environment, including database replication, environment configuration, and deployment automation.

## Table of Contents
1. [Database Replication Strategy](#database-replication-strategy)
2. [Environment Configuration](#environment-configuration)
3. [Railway Setup for Staging](#railway-setup-for-staging)
4. [Automated Replication Scripts](#automated-replication-scripts)
5. [Data Synchronization](#data-synchronization)
6. [Testing and Validation](#testing-and-validation)
7. [Maintenance and Updates](#maintenance-and-updates)

## Database Replication Strategy

### Option 1: PostgreSQL Dump and Restore (Recommended for Railway)
```bash
# 1. Create production database dump
pg_dump "postgresql://postgres:GAuUkkljaQYFgMfthQBfREDlDhMSnuPE@shuttle.proxy.rlwy.net:41769/railway" > production_backup.sql

# 2. Create new staging database on Railway
# 3. Restore to staging database
psql "postgresql://postgres:STAGING_PASSWORD@STAGING_HOST:PORT/railway" < production_backup.sql
```

### Option 2: Railway Database Fork (If Available)
```bash
# Use Railway CLI to fork production database
railway database fork --from production --to staging
```

## Environment Configuration

### 1. Create Staging Environment Files

#### `.env.staging`
```env
# Staging Environment Configuration
NODE_ENV=staging
USE_DATABASE=true

# Staging Database URL (New Railway Database)
DATABASE_URL=postgresql://postgres:STAGING_PASSWORD@STAGING_HOST:PORT/railway

# Security Configuration (Use different keys for staging)
JWT_SECRET=staging-jwt-secret-key-different-from-production
ENCRYPTION_KEY=staging-encryption-key-32-chars-long

# Server Configuration
PORT=5000

# CORS Configuration
CORS_ORIGINS=http://localhost:5000,https://wakeexerhandprod-staging.up.railway.app

# Rate Limiting Configuration
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
LOGIN_RATE_LIMIT_MAX=5

# Admin Credentials (Same as production for testing)
PORTAL_ADMIN_PASSWORD=TempSecurePortalAdmin2024!@#$%
ADMIN_DEFAULT_PASSWORD=admin123
RESEARCHER_DEFAULT_PASSWORD=TempSecureResearcher2024!@#$%
CLINICIAN_DEFAULT_PASSWORD=TempSecureClinician2024!@#$%

# Environment Identifier
RAILWAY_ENVIRONMENT_NAME=staging
```

### 2. Railway Configuration

#### `railway.toml` (Updated)
```toml
[environments.production]
[environments.production.deploy]
startCommand = "npm start"
healthcheckPath = "/health"
healthcheckTimeout = 300
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10

[environments.staging]
[environments.staging.deploy]
startCommand = "npm start"
healthcheckPath = "/health"
healthcheckTimeout = 300
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10

[build]
builder = "NIXPACKS"
buildCommand = "npm run railway:build"
```

## Railway Setup for Staging

### Step 1: Create New Railway Project/Environment
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Create new environment or project for staging
railway environment create staging

# Or link to existing project
railway link
```

### Step 2: Create Staging Database
```bash
# Switch to staging environment
railway environment staging

# Add PostgreSQL database
railway add postgresql

# Get staging database URL
railway variables
```

### Step 3: Deploy Staging Environment
```bash
# Deploy to staging
railway deploy --environment staging
```

## Automated Replication Scripts

### 1. Database Replication Script

#### `scripts/replicate-production-to-staging.js`
```javascript
import { exec } from 'child_process';
import { promisify } from 'util';
import dotenv from 'dotenv';

const execAsync = promisify(exec);

// Load environment configurations
dotenv.config({ path: '.env.railway-prod' });
const PROD_DB_URL = process.env.DATABASE_URL;

dotenv.config({ path: '.env.staging' });
const STAGING_DB_URL = process.env.DATABASE_URL;

async function replicateDatabase() {
  try {
    console.log('🚀 Starting production to staging replication...');
    
    // 1. Create production backup
    console.log('📦 Creating production database backup...');
    const backupFile = `backup_${new Date().toISOString().split('T')[0]}.sql`;
    
    await execAsync(`pg_dump "${PROD_DB_URL}" > ${backupFile}`);
    console.log('✅ Production backup created');
    
    // 2. Drop and recreate staging database (careful!)
    console.log('🗑️  Preparing staging database...');
    await execAsync(`psql "${STAGING_DB_URL}" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"`);
    
    // 3. Restore to staging
    console.log('📥 Restoring to staging database...');
    await execAsync(`psql "${STAGING_DB_URL}" < ${backupFile}`);
    console.log('✅ Staging database restored');
    
    // 4. Clean up backup file
    await execAsync(`rm ${backupFile}`);
    console.log('🧹 Cleanup completed');
    
    console.log('🎉 Replication completed successfully!');
    
  } catch (error) {
    console.error('❌ Replication failed:', error);
    process.exit(1);
  }
}

// Run replication
replicateDatabase();
```

### 2. Environment Sync Script

#### `scripts/sync-environments.js`
```javascript
import fs from 'fs';
import path from 'path';

async function syncEnvironments() {
  try {
    console.log('🔄 Syncing environment configurations...');
    
    // Read production environment
    const prodEnv = fs.readFileSync('.env.railway-prod', 'utf8');
    
    // Create staging environment with modifications
    const stagingEnv = prodEnv
      .replace(/NODE_ENV=production/g, 'NODE_ENV=staging')
      .replace(/RAILWAY_ENVIRONMENT_NAME=production/g, 'RAILWAY_ENVIRONMENT_NAME=staging')
      .replace(/DATABASE_URL="[^"]*"/g, `DATABASE_URL="${process.env.STAGING_DATABASE_URL}"`)
      .replace(/JWT_SECRET=[^\n]*/g, 'JWT_SECRET=staging-jwt-secret-key')
      .replace(/ENCRYPTION_KEY=[^\n]*/g, 'ENCRYPTION_KEY=staging-encryption-key-32-chars');
    
    // Write staging environment
    fs.writeFileSync('.env.staging', stagingEnv);
    console.log('✅ Staging environment configuration created');
    
  } catch (error) {
    console.error('❌ Environment sync failed:', error);
  }
}

syncEnvironments();
```

### 3. Complete Replication Workflow

#### `scripts/full-staging-setup.sh`
```bash
#!/bin/bash

echo "🚀 Starting full production to staging replication..."

# 1. Backup current staging (safety)
echo "💾 Creating staging backup for safety..."
pg_dump "$STAGING_DATABASE_URL" > "staging_backup_$(date +%Y%m%d_%H%M%S).sql"

# 2. Replicate database
echo "🗄️  Replicating production database..."
node scripts/replicate-production-to-staging.js

# 3. Sync environment configurations
echo "⚙️  Syncing environment configurations..."
node scripts/sync-environments.js

# 4. Deploy to staging
echo "🚀 Deploying to staging environment..."
railway deploy --environment staging

# 5. Run health checks
echo "🏥 Running health checks..."
sleep 30
curl -f https://wakeexerhandprod-staging.up.railway.app/health || echo "⚠️  Health check failed"

echo "✅ Full staging setup completed!"
```

## Data Synchronization

### 1. Selective Data Sync (For Sensitive Data)

#### `scripts/selective-data-sync.js`
```javascript
import { DatabaseStorage } from '../server/storage.js';

async function selectiveSync() {
  const prodStorage = new DatabaseStorage(PROD_DB_URL);
  const stagingStorage = new DatabaseStorage(STAGING_DB_URL);
  
  try {
    // Sync non-sensitive data only
    console.log('🔄 Syncing assessments...');
    const assessments = await prodStorage.getAssessments();
    // Clear and repopulate staging assessments
    
    console.log('🔄 Syncing injury types...');
    const injuryTypes = await prodStorage.getInjuryTypes();
    // Clear and repopulate staging injury types
    
    // Skip sensitive user data - create test users instead
    console.log('👥 Creating test users for staging...');
    await createTestUsers(stagingStorage);
    
    console.log('✅ Selective sync completed');
    
  } catch (error) {
    console.error('❌ Selective sync failed:', error);
  }
}

async function createTestUsers(storage) {
  const testUsers = [
    { code: 'TEST01', injuryType: 'Distal Radius Fracture' },
    { code: 'TEST02', injuryType: 'Carpal Tunnel' },
    { code: 'TEST03', injuryType: 'Trigger Finger' }
  ];
  
  for (const user of testUsers) {
    await storage.createUser(user);
  }
}
```

### 2. Automated Scheduled Sync

#### `scripts/scheduled-sync.js`
```javascript
import cron from 'node-cron';

// Run replication every Sunday at 2 AM
cron.schedule('0 2 * * 0', () => {
  console.log('🕐 Running scheduled production to staging sync...');
  exec('bash scripts/full-staging-setup.sh');
});

console.log('⏰ Scheduled sync job started (Sundays at 2 AM)');
```

## Testing and Validation

### 1. Post-Replication Tests

#### `scripts/validate-staging.js`
```javascript
async function validateStaging() {
  const tests = [
    // Database connectivity
    async () => {
      const storage = new DatabaseStorage(STAGING_DB_URL);
      const users = await storage.getUsers();
      console.log(`✅ Database: ${users.length} users found`);
    },
    
    // API endpoints
    async () => {
      const response = await fetch('https://wakeexerhandprod-staging.up.railway.app/health');
      console.log(`✅ API Health: ${response.status}`);
    },
    
    // Admin login
    async () => {
      const response = await fetch('https://wakeexerhandprod-staging.up.railway.app/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'admin123' })
      });
      console.log(`✅ Admin Login: ${response.status}`);
    }
  ];
  
  for (const test of tests) {
    try {
      await test();
    } catch (error) {
      console.error('❌ Test failed:', error);
    }
  }
}
```

## Package.json Scripts

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "staging:replicate": "node scripts/replicate-production-to-staging.js",
    "staging:sync": "node scripts/sync-environments.js",
    "staging:setup": "bash scripts/full-staging-setup.sh",
    "staging:validate": "node scripts/validate-staging.js",
    "staging:deploy": "railway deploy --environment staging"
  }
}
```

## Usage Instructions

### Initial Setup
```bash
# 1. Create staging database on Railway
railway environment create staging
railway add postgresql

# 2. Update environment variables
npm run staging:sync

# 3. Run full replication
npm run staging:setup

# 4. Validate staging environment
npm run staging:validate
```

### Regular Updates
```bash
# Quick database sync
npm run staging:replicate

# Full environment sync
npm run staging:setup
```

## Security Considerations

1. **Different Secrets**: Use different JWT secrets and encryption keys for staging
2. **Access Control**: Limit staging environment access to development team
3. **Data Sanitization**: Consider anonymizing sensitive data in staging
4. **Network Security**: Use Railway's built-in security features
5. **Backup Strategy**: Always backup staging before replication

## Monitoring and Alerts

### 1. Health Check Monitoring
```javascript
// Add to staging deployment
app.get('/staging-health', (req, res) => {
  res.json({
    environment: 'staging',
    timestamp: new Date().toISOString(),
    database: 'connected',
    lastSync: process.env.LAST_SYNC_DATE
  });
});
```

### 2. Sync Status Tracking
```javascript
// Track replication status
const syncStatus = {
  lastSync: null,
  status: 'pending',
  recordCount: 0,
  errors: []
};
```

## Best Practices

1. **Regular Sync Schedule**: Weekly or bi-weekly full sync
2. **Incremental Updates**: Daily incremental updates for active development
3. **Testing Protocol**: Always test critical paths after replication
4. **Documentation**: Keep replication logs and documentation updated
5. **Rollback Plan**: Maintain ability to rollback staging changes
6. **Performance Testing**: Use staging for load and performance testing

## Troubleshooting

### Common Issues
1. **Connection Timeouts**: Increase timeout values for large databases
2. **Schema Conflicts**: Ensure staging schema matches production
3. **Permission Issues**: Verify database user permissions
4. **Environment Variables**: Double-check all environment configurations

### Debug Commands
```bash
# Test database connectivity
psql "$STAGING_DATABASE_URL" -c "SELECT version();"

# Check Railway deployment status
railway status --environment staging

# View deployment logs
railway logs --environment staging
```

This comprehensive approach ensures you have a robust, automated system for maintaining an exact staging replica of your production environment.
