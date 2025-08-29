# Railway Database Verification Guide

## 🎯 Overview

This guide provides comprehensive steps to ensure your Railway database is complete, properly configured, and ready for production use with your HIPAA-compliant hand assessment platform.

## 🚀 Quick Verification

Run this command to verify your Railway database:

```bash
# Set your Railway DATABASE_URL and run verification
DATABASE_URL="your-railway-database-url" npm run db:verify
```

## 📋 Step-by-Step Verification Process

### Step 1: Environment Setup

1. **Get your DATABASE_URL from Railway:**
   - Go to your Railway dashboard
   - Navigate to your project
   - Click on PostgreSQL service
   - Copy the `DATABASE_URL` from the Connect tab

2. **Set environment variables locally:**
   ```bash
   # Create .env file (not tracked in git)
   cp env.example .env
   
   # Edit .env with your actual values:
   DATABASE_URL=postgresql://postgres:password@host:port/database
   NODE_ENV=production
   JWT_SECRET=your-64-char-secret
   ENCRYPTION_KEY=your-64-hex-encryption-key
   ```

### Step 2: Schema Deployment

Deploy your database schema to Railway:

```bash
# Deploy schema using Drizzle
npm run db:push
```

**Expected Output:**
```
✅ Connected to Railway PostgreSQL database
✅ Schema deployed successfully
```

### Step 3: Data Verification

Check if your database has all required data:

```bash
# Run comprehensive database verification
npm run db:verify
```

**What this checks:**
- ✅ All required tables exist
- ✅ Seed data is properly populated
- ✅ Security features are configured
- ✅ Indexes are in place for performance

### Step 4: Manual Data Seeding (if needed)

If verification shows missing data:

```bash
# Run the seeding script
npm run db:seed
```

**Alternative - Use SQL seed file:**
```bash
# Connect to Railway database and run SQL
psql $DATABASE_URL < final-seed.sql
```

## 🔍 Database Completeness Checklist

### Required Tables ✅
- [ ] `clinical_users` - Clinical dashboard users
- [ ] `admin_users` - Admin portal users  
- [ ] `user_sessions` - Secure session management
- [ ] `cohorts` - Patient cohorts by injury type
- [ ] `patients` - De-identified patient records
- [ ] `assessment_types` - Assessment templates
- [ ] `patient_assessments` - Assessment results
- [ ] `outlier_alerts` - Anomaly detection
- [ ] `audit_logs` - HIPAA compliance logging
- [ ] `data_exports` - Export tracking
- [ ] `quick_dash_responses` - Survey responses
- [ ] `study_visits` - Visit scheduling

### Required Data ✅
- [ ] **4 Cohorts**: Carpal Tunnel, Distal Radius Fracture, Trigger Finger, CMC Arthroplasty
- [ ] **5 Assessment Types**: TAM, Kapandji, Wrist Flex/Ext, Wrist Deviation, QuickDASH
- [ ] **3 Clinical Users**: admin, clinician, researcher (with bcrypt hashed passwords)
- [ ] **1 Admin User**: portaladmin (for compliance portal)

### Security Features ✅
- [ ] Password hashing with bcrypt (12 rounds)
- [ ] JWT authentication configured
- [ ] Session management enabled
- [ ] Audit logging active
- [ ] Rate limiting configured
- [ ] CORS protection enabled

## 🛠️ Manual Database Operations

### Connect to Railway Database

```bash
# Direct connection using psql
psql $DATABASE_URL

# Or use Railway CLI
railway connect postgresql
```

### Check Table Status

```sql
-- List all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check record counts
SELECT 
  'clinical_users' as table_name, COUNT(*) as records FROM clinical_users
UNION ALL SELECT 'admin_users', COUNT(*) FROM admin_users
UNION ALL SELECT 'cohorts', COUNT(*) FROM cohorts
UNION ALL SELECT 'assessment_types', COUNT(*) FROM assessment_types
UNION ALL SELECT 'patients', COUNT(*) FROM patients;
```

### Verify Security

```sql
-- Check password hashing
SELECT username, 
       CASE WHEN password_hash LIKE '$2b$12$%' THEN 'SECURE' ELSE 'INSECURE' END as status
FROM clinical_users;

-- Check indexes
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

## 🚨 Troubleshooting

### Common Issues

1. **"DATABASE_URL must be set" Error**
   ```bash
   # Solution: Set environment variable
   export DATABASE_URL="your-railway-database-url"
   # Or add to .env file
   ```

2. **Connection Refused Error**
   ```bash
   # Check if Railway database is running
   railway status
   
   # Restart if needed
   railway up
   ```

3. **Schema Migration Failed**
   ```bash
   # Reset and redeploy
   npm run db:push -- --force
   ```

4. **Missing Seed Data**
   ```bash
   # Force re-seed
   npm run db:seed
   
   # Or manually run SQL
   psql $DATABASE_URL -f final-seed.sql
   ```

### Health Check Commands

```bash
# Test basic connectivity
DATABASE_URL="your-url" node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
pool.query('SELECT NOW()').then(r => console.log('✅ Connected:', r.rows[0])).catch(console.error);
"

# Check schema version
psql $DATABASE_URL -c "SELECT version();"

# Database size and stats
psql $DATABASE_URL -c "
SELECT 
  pg_size_pretty(pg_database_size(current_database())) as db_size,
  COUNT(*) as total_tables
FROM information_schema.tables 
WHERE table_schema = 'public';
"
```

## 📊 Expected Database State

### Production-Ready Database Should Have:

```
📊 Table Counts:
   clinical_users     : 3 records (admin, clinician, researcher)
   admin_users        : 1 record  (portaladmin)
   cohorts           : 4 records (injury types)
   assessment_types  : 5 records (TAM, Kapandji, etc.)
   patients          : Variable (your patient data)
   patient_assessments: Variable (assessment results)

🔒 Security Status:
   ✅ Passwords hashed with bcrypt
   ✅ JWT tokens configured
   ✅ Session management active
   ✅ Audit logging enabled
   ✅ Rate limiting configured

📈 Performance:
   ✅ Indexes on username fields
   ✅ Indexes on access codes
   ✅ Foreign key constraints
   ✅ Connection pooling enabled
```

## 🔐 Default Login Credentials

**After deployment, log in and change these immediately:**

### Clinical Dashboard:
- **Admin**: `admin` / `TempSecureAdmin2024!@#$`
- **Clinician**: `clinician` / `TempSecureClinician2024!@#$`
- **Researcher**: `researcher` / `TempSecureResearcher2024!@#$`

### Admin Portal:
- **Portal Admin**: `portaladmin` / `TempSecurePortalAdmin2024!@#$`

## 🎯 Final Verification Steps

1. **Run complete verification:**
   ```bash
   npm run db:verify
   ```

2. **Test application:**
   ```bash
   npm run build
   npm start
   ```

3. **Access your Railway app URL and test login**

4. **Change all default passwords immediately**

5. **Monitor logs for any errors:**
   ```bash
   railway logs
   ```

## 📞 Support

If you encounter issues:

1. Check Railway service status
2. Verify environment variables in Railway dashboard
3. Review Railway logs for errors
4. Test connection using the provided scripts
5. Consult the `RAILWAY_DEPLOYMENT_GUIDE.md` for detailed deployment steps

---

Your Railway database should now be complete and ready for production use! 🎉

