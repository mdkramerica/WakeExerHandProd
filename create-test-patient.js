import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  connectionString: 'postgresql://postgres:GAuUkkljaQYFgMfthQBfREDlDhMSnuPE@shuttle.proxy.rlwy.net:41769/railway'
});

async function createTestPatient() {
  try {
    await client.connect();
    console.log('Connected to production database');
    
    // Check if patient already exists
    const checkResult = await client.query('SELECT id FROM patients WHERE access_code = $1', ['123456']);
    
    if (checkResult.rows.length > 0) {
      console.log('Test patient already exists with ID:', checkResult.rows[0].id);
      return;
    }
    
    // Create test patient
    const result = await client.query(`
      INSERT INTO patients (patient_id, alias, access_code, injury_type, status, enrollment_status, is_active, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING id, patient_id, access_code
    `, ['TEST001', 'Test Patient', '123456', 'Hand Injury', 'stable', 'enrolled', true]);
    
    console.log('Test patient created successfully:', result.rows[0]);
    
  } catch (error) {
    console.error('Error creating test patient:', error);
  } finally {
    await client.end();
  }
}

createTestPatient();
