#!/usr/bin/env node
/**
 * Railway Database Verification and Setup Script
 * This script verifies the completeness of your Railway database and ensures all data is properly populated
 */

import pkg from 'pg';
const { Pool } = pkg;
import fs from 'fs';
import path from 'path';

// Database verification and setup class
class RailwayDatabaseVerifier {
  constructor() {
    this.pool = null;
    this.client = null;
  }

  async connect(databaseUrl) {
    if (!databaseUrl) {
      throw new Error('❌ DATABASE_URL is required. Please set it in your environment or Railway dashboard.');
    }

    this.pool = new Pool({ 
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false } // Railway requires SSL
    });

    try {
      this.client = await this.pool.connect();
      console.log('✅ Connected to Railway PostgreSQL database');
      return true;
    } catch (error) {
      console.error('❌ Failed to connect to database:', error.message);
      return false;
    }
  }

  async verifyTables() {
    console.log('\n🔍 Verifying database tables...');
    
    const expectedTables = [
      'clinical_users', 'admin_users', 'user_sessions', 'cohorts', 'patients',
      'assessment_types', 'patient_assessments', 'outlier_alerts', 'audit_logs',
      'data_exports', 'quick_dash_responses', 'study_visits'
    ];

    const result = await this.client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    const existingTables = result.rows.map(row => row.table_name);
    const missingTables = expectedTables.filter(table => !existingTables.includes(table));

    console.log(`📊 Found ${existingTables.length} tables in database:`);
    existingTables.forEach(table => console.log(`  ✓ ${table}`));

    if (missingTables.length > 0) {
      console.log(`\n⚠️  Missing ${missingTables.length} expected tables:`);
      missingTables.forEach(table => console.log(`  ❌ ${table}`));
      return false;
    }

    console.log('✅ All expected tables are present');
    return true;
  }

  async verifyData() {
    console.log('\n🔍 Verifying database data completeness...');
    
    const checks = [
      { table: 'clinical_users', description: 'Clinical users (admin, clinician, researcher)' },
      { table: 'admin_users', description: 'Admin portal users' },
      { table: 'cohorts', description: 'Patient cohorts' },
      { table: 'assessment_types', description: 'Assessment templates' }
    ];

    const results = [];
    
    for (const check of checks) {
      try {
        const result = await this.client.query(`SELECT COUNT(*) as count FROM ${check.table}`);
        const count = parseInt(result.rows[0].count);
        results.push({ ...check, count, status: count > 0 ? '✅' : '⚠️' });
      } catch (error) {
        results.push({ ...check, count: 0, status: '❌', error: error.message });
      }
    }

    results.forEach(result => {
      console.log(`  ${result.status} ${result.description}: ${result.count} records`);
      if (result.error) {
        console.log(`    Error: ${result.error}`);
      }
    });

    return results.every(result => result.status === '✅');
  }

  async verifySecurityFeatures() {
    console.log('\n🔒 Verifying security features...');
    
    try {
      // Check password hashing
      const userResult = await this.client.query(`
        SELECT username, password_hash 
        FROM clinical_users 
        WHERE username = 'admin' 
        LIMIT 1
      `);

      if (userResult.rows.length > 0) {
        const passwordHash = userResult.rows[0].password_hash;
        if (passwordHash && passwordHash.startsWith('$2b$12$')) {
          console.log('  ✅ Password hashing (bcrypt) is properly configured');
        } else {
          console.log('  ⚠️  Password hashing may not be configured correctly');
        }
      } else {
        console.log('  ⚠️  No admin user found');
      }

      // Check indexes for performance
      const indexResult = await this.client.query(`
        SELECT indexname, tablename 
        FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND indexname LIKE '%username%' OR indexname LIKE '%access_code%'
      `);

      console.log(`  ✅ Found ${indexResult.rows.length} performance indexes`);

      return true;
    } catch (error) {
      console.error('  ❌ Security verification failed:', error.message);
      return false;
    }
  }

  async seedMissingData() {
    console.log('\n🌱 Checking for missing seed data...');

    try {
      // Check if basic seed data exists
      const cohortCount = await this.client.query('SELECT COUNT(*) FROM cohorts');
      const assessmentCount = await this.client.query('SELECT COUNT(*) FROM assessment_types');
      const userCount = await this.client.query('SELECT COUNT(*) FROM clinical_users');

      const needsSeeding = [
        cohortCount.rows[0].count == 0,
        assessmentCount.rows[0].count == 0,
        userCount.rows[0].count == 0
      ].some(Boolean);

      if (needsSeeding) {
        console.log('⚠️  Missing seed data detected. Running seed script...');
        
        // Read and execute the final seed script
        const seedPath = path.join(process.cwd(), 'final-seed.sql');
        if (fs.existsSync(seedPath)) {
          const seedScript = fs.readFileSync(seedPath, 'utf8');
          await this.client.query(seedScript);
          console.log('✅ Seed data inserted successfully');
        } else {
          console.log('⚠️  Seed script not found. Creating basic seed data...');
          await this.createBasicSeedData();
        }
      } else {
        console.log('✅ Seed data is already present');
      }

      return true;
    } catch (error) {
      console.error('❌ Seeding failed:', error.message);
      return false;
    }
  }

  async createBasicSeedData() {
    console.log('🌱 Creating basic seed data...');

    // This would run the essential seed data creation
    const seedSQL = `
      -- Insert cohorts if missing
      INSERT INTO cohorts (name, description, normal_rom_ranges, is_active) 
      SELECT * FROM (VALUES
        ('Carpal Tunnel Syndrome', 'Patients with carpal tunnel syndrome requiring median nerve decompression', 
         '{"wristFlexion": {"min": 80, "max": 90, "mean": 85}, "wristExtension": {"min": 70, "max": 80, "mean": 75}, "thumbOpposition": {"min": 8, "max": 10, "mean": 9}}'::jsonb, true),
        ('Distal Radius Fracture', 'Patients with distal radius fractures requiring surgical fixation',
         '{"wristFlexion": {"min": 75, "max": 85, "mean": 80}, "wristExtension": {"min": 65, "max": 75, "mean": 70}, "fingerExtension": {"min": 0, "max": 5, "mean": 2}}'::jsonb, true)
      ) AS v(name, description, normal_rom_ranges, is_active)
      WHERE NOT EXISTS (SELECT 1 FROM cohorts WHERE name = v.name);

      -- Insert assessment types if missing
      INSERT INTO assessment_types (name, description, instructions, duration, repetitions, order_index, is_active)
      SELECT * FROM (VALUES
        ('TAM Assessment', 'Total Active Motion assessment measuring finger flexibility and range of motion',
         'Make a tight fist, then fully extend fingers. Repeat 3 times for accurate measurement.', 60, 3, 1, true),
        ('Kapandji Assessment', 'Thumb opposition test measuring functional movement and dexterity',
         'Touch thumb tip to each fingertip and various points on the hand as demonstrated.', 45, 2, 2, true)
      ) AS v(name, description, instructions, duration, repetitions, order_index, is_active)
      WHERE NOT EXISTS (SELECT 1 FROM assessment_types WHERE name = v.name);
    `;

    await this.client.query(seedSQL);
    console.log('✅ Basic seed data created');
  }

  async generateReport() {
    console.log('\n📊 Database Status Report');
    console.log('=' .repeat(50));

    try {
      // Get table counts
      const tables = ['clinical_users', 'admin_users', 'patients', 'cohorts', 'assessment_types', 'patient_assessments'];
      
      for (const table of tables) {
        const result = await this.client.query(`SELECT COUNT(*) as count FROM ${table}`);
        const count = result.rows[0].count;
        console.log(`${table.padEnd(20)}: ${count} records`);
      }

      // Get recent activity
      const recentAssessments = await this.client.query(`
        SELECT COUNT(*) as count 
        FROM patient_assessments 
        WHERE assessment_date >= NOW() - INTERVAL '7 days'
      `);

      console.log(`\nRecent Activity (7 days):`);
      console.log(`New assessments: ${recentAssessments.rows[0].count}`);

      // Database size
      const sizeResult = await this.client.query(`
        SELECT pg_size_pretty(pg_database_size(current_database())) as size
      `);
      console.log(`Database size: ${sizeResult.rows[0].size}`);

    } catch (error) {
      console.error('❌ Failed to generate report:', error.message);
    }
  }

  async cleanup() {
    if (this.client) {
      this.client.release();
    }
    if (this.pool) {
      await this.pool.end();
    }
  }
}

// Main execution function
async function main() {
  console.log('🚀 Railway Database Verification Tool');
  console.log('====================================\n');

  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.log('❌ DATABASE_URL environment variable is not set.');
    console.log('📋 To use this script:');
    console.log('   1. Get your DATABASE_URL from Railway dashboard');
    console.log('   2. Run: DATABASE_URL="your-url" node verify-railway-database.js');
    console.log('   3. Or set it in your .env file');
    process.exit(1);
  }

  const verifier = new RailwayDatabaseVerifier();

  try {
    // Connect to database
    const connected = await verifier.connect(databaseUrl);
    if (!connected) {
      process.exit(1);
    }

    // Run verification steps
    const tablesOk = await verifier.verifyTables();
    const dataOk = await verifier.verifyData();
    const securityOk = await verifier.verifySecurityFeatures();

    // Seed missing data if needed
    if (!dataOk) {
      await verifier.seedMissingData();
    }

    // Generate final report
    await verifier.generateReport();

    // Final status
    console.log('\n' + '=' .repeat(50));
    if (tablesOk && dataOk && securityOk) {
      console.log('🎉 Railway database is complete and ready for production!');
    } else {
      console.log('⚠️  Some issues were found. Review the output above.');
    }

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    process.exit(1);
  } finally {
    await verifier.cleanup();
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { RailwayDatabaseVerifier };

