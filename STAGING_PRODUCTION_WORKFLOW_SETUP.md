# GitHub + Railway Staging/Production Workflow Setup

## 🎯 Current State vs Recommended Setup

### ❌ Current Issues:
- Single `main` branch deploys to BOTH staging and production
- No separation between staging and production code
- No automated testing pipeline
- No deployment approval process

### ✅ Recommended Solution:
- `develop` → staging environment (automatic)
- `main` → production environment (manual approval)
- GitHub Actions for automated testing
- Branch protection rules

## 🚀 Implementation Steps

### Step 1: Create Branch Structure

```bash
# Create and setup develop branch
git checkout -b develop
git push -u origin develop

# Set develop as default branch for new PRs
# (Done in GitHub settings)
```

### Step 2: Configure Railway Environment Deployments

**Production Environment:**
- Deploy from: `main` branch
- Auto-deploy: Manual approval only
- Database: Production database

**Staging Environment:**  
- Deploy from: `develop` branch
- Auto-deploy: Automatic on push
- Database: Staging database (already set up)

### Step 3: GitHub Branch Protection Rules

```yaml
# main branch protection:
- Require pull request reviews: 1 reviewer
- Require status checks to pass
- Require branches to be up to date
- Restrict pushes to main

# develop branch protection:
- Require status checks to pass
- Allow force pushes (for development)
```

### Step 4: GitHub Actions Workflow

Create `.github/workflows/ci-cd.yml`:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ develop, main ]
  pull_request:
    branches: [ develop, main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run type checking
      run: npm run check
    
    - name: Run security audit
      run: npm run security:check
    
    - name: Build application
      run: npm run build

  deploy-staging:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop' && github.event_name == 'push'
    steps:
    - name: Deploy to Railway Staging
      run: echo "Staging deployment triggered automatically"

  deploy-production:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    environment: production
    steps:
    - name: Deploy to Railway Production
      run: echo "Production deployment requires manual approval"
```

## 🔄 Recommended Development Workflow

### Daily Development:
1. **Feature Development**:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/new-feature
   # Make changes
   git commit -m "feat: add new feature"
   git push origin feature/new-feature
   ```

2. **Create Pull Request**:
   - Target: `develop` branch
   - Auto-deploy to staging after merge
   - Test in staging environment

3. **Production Release**:
   ```bash
   # After staging testing is complete
   git checkout main
   git pull origin main
   git merge develop
   git push origin main
   # Manual approval required for production deployment
   ```

### Emergency Hotfixes:
```bash
git checkout main
git checkout -b hotfix/critical-fix
# Make fix
git commit -m "fix: critical security patch"
# PR to main (expedited review)
# Deploy to production immediately after approval
# Merge back to develop
```

## 🏗️ Railway Configuration Changes Needed

### Production Service Configuration:
- **Source**: `main` branch
- **Auto-deploy**: Disabled (manual trigger only)
- **Environment**: production
- **Database**: Production database

### Staging Service Configuration:
- **Source**: `develop` branch  
- **Auto-deploy**: Enabled
- **Environment**: staging
- **Database**: Staging database ✅ (already configured)

## 📋 Environment-Specific Configurations

### Staging Environment Variables:
```bash
NODE_ENV=staging
CORS_ORIGINS=https://wake-exer-app-prod-staging.up.railway.app
# All other vars same as production
```

### Production Environment Variables:
```bash
NODE_ENV=production
CORS_ORIGINS=https://wake-exer-app-prod-production.up.railway.app
# Production-specific configurations
```

## 🛡️ Security Considerations

### Branch Protection:
- `main`: Require PR reviews, no direct pushes
- `develop`: Require status checks, allow force push for development

### Deployment Approval:
- Staging: Automatic (for rapid iteration)
- Production: Manual approval required

### Database Safety:
- Staging: Can be reset/restored from production
- Production: Never automatically modified

## 🧪 Testing Strategy

### Staging Testing:
- Feature testing with real data structure
- Integration testing
- Performance testing
- User acceptance testing

### Production Deployment:
- Only after thorough staging validation
- Manual approval process
- Rollback plan ready

## 📊 Benefits of This Setup

✅ **Safe Deployments**: Staging-first approach prevents production issues
✅ **Code Quality**: Automated testing and reviews
✅ **Fast Iteration**: Automatic staging deployments
✅ **Production Safety**: Manual approval for production
✅ **Real Data Testing**: Staging has production data copy
✅ **Rollback Capability**: Easy to revert if issues occur

## 🚨 Action Items

1. [ ] Create `develop` branch
2. [ ] Set up GitHub Actions workflow
3. [ ] Configure Railway branch-specific deployments
4. [ ] Set up branch protection rules
5. [ ] Update team workflow documentation
6. [ ] Train team on new process
