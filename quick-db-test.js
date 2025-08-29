#!/usr/bin/env node
/**
 * Quick Database Connection Test
 * Run this to test your Railway database connection before full verification
 */

import { Pool } from 'pg';

async function quickTest(databaseUrl) {
  if (!databaseUrl) {
    console.log('❌ No DATABASE_URL provided');
    console.log('Usage: DATABASE_URL="your-url" node quick-db-test.js');
    return false;
  }

  console.log('🔗 Testing database connection...');
  
  const pool = new Pool({ 
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();
    
    // Test basic connection
    const result = await client.query('SELECT NOW(), version()');
    console.log('✅ Database connected successfully!');
    console.log(`📅 Server time: ${result.rows[0].now}`);
    console.log(`🗄️  PostgreSQL version: ${result.rows[0].version.split(' ')[0]} ${result.rows[0].version.split(' ')[1]}`);
    
    // Check if our schema exists
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log(`📊 Found ${tablesResult.rows.length} tables in database`);
    
    if (tablesResult.rows.length === 0) {
      console.log('⚠️  No tables found. Database needs schema deployment.');
      console.log('💡 Run: npm run db:push');
    } else {
      console.log('✅ Database has tables. Ready for verification!');
      console.log('💡 Run: npm run db:verify');
    }
    
    client.release();
    await pool.end();
    return true;
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    await pool.end();
    return false;
  }
}

const databaseUrl = process.env.DATABASE_URL;
quickTest(databaseUrl).then(success => {
  process.exit(success ? 0 : 1);
});

