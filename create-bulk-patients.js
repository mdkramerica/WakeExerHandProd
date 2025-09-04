import fetch from 'node-fetch';

// Configuration - Local server with Production Database
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

console.log('🎯 Using Local Server with Production Database');
console.log('📍 API URL:', API_BASE_URL);
console.log('🗄️  Database: Railway Production');

async function loginAsAdmin() {
  console.log('🔐 Logging in as admin...');
  
  const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      username: ADMIN_USERNAME,
      password: ADMIN_PASSWORD
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Admin login failed: ${response.status} - ${error}`);
  }

  const data = await response.json();
  console.log('✅ Admin login successful');
  return data.accessToken;
}

async function createPatient(token, injuryType, surgeryDate) {
  const response = await fetch(`${API_BASE_URL}/api/admin/generate-code`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      injuryType: injuryType,
      surgeryDate: surgeryDate
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Patient creation failed: ${response.status} - ${error}`);
  }

  return await response.json();
}

async function createBulkPatients() {
  try {
    console.log('🚀 Starting bulk patient creation...');
    console.log('📋 Creating 13 patients with:');
    console.log('   - Injury Type: Distal Radius Fracture');
    console.log('   - Surgery Date: 9/4/2025');
    console.log('');

    // Login as admin
    const token = await loginAsAdmin();

    const patients = [];
    const injuryType = 'Distal Radius Fracture';
    const surgeryDate = '2025-09-04';

    // Create 13 patients
    for (let i = 1; i <= 13; i++) {
      console.log(`👤 Creating patient ${i}/13...`);
      
      try {
        const result = await createPatient(token, injuryType, surgeryDate);
        patients.push(result.patient);
        
        console.log(`✅ Patient ${i} created successfully:`);
        console.log(`   - Patient ID: ${result.patient.patientId}`);
        console.log(`   - Access Code: ${result.patient.code}`);
        console.log(`   - Injury Type: ${result.patient.injuryType}`);
        console.log(`   - Surgery Date: ${result.patient.surgeryDate}`);
        console.log('');
        
        // Small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`❌ Failed to create patient ${i}:`, error.message);
      }
    }

    console.log('🎉 Bulk patient creation completed!');
    console.log(`📊 Successfully created ${patients.length}/13 patients`);
    console.log('');
    console.log('📋 Summary of created patients:');
    console.log('=====================================');
    
    patients.forEach((patient, index) => {
      console.log(`${index + 1}. ${patient.patientId} - Code: ${patient.code} - Surgery: ${patient.surgeryDate}`);
    });

    console.log('');
    console.log('🔗 Access codes for easy reference:');
    console.log('===================================');
    patients.forEach(patient => {
      console.log(patient.code);
    });

    return patients;
  } catch (error) {
    console.error('❌ Bulk patient creation failed:', error.message);
    process.exit(1);
  }
}

// Run the script
createBulkPatients()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

export { createBulkPatients };
